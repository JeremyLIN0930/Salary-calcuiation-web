import { supabase } from '../lib/supabase'
import { Schedule, ScheduleEmployee, Shift, ShiftType } from '../types/schedule'
import { ScheduleWeekRow } from '../types/database'
import { ScheduleMapper, isValidUuid } from '../mappers/ScheduleMapper'
import { DEFAULT_COMPANY_ID } from '../mappers/EmployeeMapper'
import { RepositoryResult, successResult, errorResult } from './base.repository'
import { formatTimeHHmm } from '../utils/dateUtils'

export interface ShiftTemplate {
  id: string
  label: string
  emoji: string
  startTime: string
  endTime: string
  color?: string
}

export class SupabaseScheduleRepository {
  private tableName = 'schedule_weeks'

  /**
   * Helper to fetch and reconstruct the employees and shifts array for a list of schedules.
   * Uses schedule_shifts columns including employee_name for temporary staff.
   */
  private async populateSchedulesWithShifts(schedules: Schedule[]): Promise<void> {
    if (schedules.length === 0) return

    const weekIds = schedules.map(s => s.id).filter(Boolean)

    const { data: shiftsData, error: shiftsError } = await supabase
      .from('schedule_shifts')
      .select('id, schedule_week_id, employee_id, employee_name, work_date, shift_type, start_time, end_time, is_day_off, remarks, created_at, updated_at')
      .in('schedule_week_id', weekIds)

    if (shiftsError) {
      console.error('[SupabaseScheduleRepository] Failed to fetch schedule_shifts:', shiftsError.message)
      return
    }

    const shifts = shiftsData || []

    const { data: empsData, error: empsError } = await supabase
      .from('master_employees')
      .select('id, name')

    const empMap = new Map<string, string>()
    if (empsError) {
      console.error('[SupabaseScheduleRepository] Failed to fetch master_employees:', empsError.message)
    } else if (empsData) {
      empsData.forEach(e => empMap.set(e.id, (e.name || '').trim()))
    }

    const shiftsByWeek = new Map<string, typeof shifts>()
    shifts.forEach(s => {
      const wId = (s.schedule_week_id || '').toLowerCase()
      if (!shiftsByWeek.has(wId)) {
        shiftsByWeek.set(wId, [])
      }
      shiftsByWeek.get(wId)!.push(s)
    })

    for (const sch of schedules) {
      const schIdKey = (sch.id || '').toLowerCase()
      const schShifts = shiftsByWeek.get(schIdKey) || []

      const weekDates: string[] = []
      if (sch.weekStart) {
        const start = new Date(sch.weekStart)
        for (let i = 0; i < 7; i++) {
          const cur = new Date(start)
          cur.setDate(start.getDate() + i)
          weekDates.push(cur.toISOString().slice(0, 10))
        }
      }

      const empShiftsMap = new Map<string, { name: string; isTemp: boolean; dateMap: Map<string, any> }>()

      schShifts.forEach((s: any) => {
        const remarksStr = (s.remarks || '').trim()
        const isTempRemark = remarksStr.startsWith('[temp:')
        const employeeName = (s.employee_name || '').trim()
        const employeeId = s.employee_id || null

        let empKey = ''
        let isTemp = false
        let empName = ''

        if (employeeId && isValidUuid(employeeId) && !isTempRemark) {
          empKey = employeeId
          empName = empMap.get(employeeId) || employeeName || '未命名員工'
          isTemp = false
        } else {
          isTemp = true
          if (employeeName) {
            empName = employeeName
          } else if (isTempRemark) {
            const idx = remarksStr.indexOf(']')
            empName = idx > 6 ? remarksStr.substring(6, idx).trim() : '臨時工'
          } else {
            empName = '臨時工'
          }
          empKey = employeeId ?? `temp:${empName}`
        }

        if (!empShiftsMap.has(empKey)) {
          empShiftsMap.set(empKey, { name: empName, isTemp, dateMap: new Map<string, any>() })
        }

        let cleanRemark = remarksStr
        if (isTempRemark) {
          const idx = remarksStr.indexOf(']')
          cleanRemark = idx > 0 ? remarksStr.substring(idx + 1).trim() : ''
        }

        empShiftsMap.get(empKey)!.dateMap.set(s.work_date, {
          ...s,
          cleanRemark
        })
      })

      const schEmployees: ScheduleEmployee[] = []
      empShiftsMap.forEach(({ name: empName, isTemp, dateMap }, empKey) => {
        const paddedShifts: Shift[] = weekDates.map(dateStr => {
          const dbShift = dateMap.get(dateStr)
          if (dbShift) {
            return {
              date: dateStr,
              type: (dbShift.shift_type || '') as ShiftType,
              startTime: formatTimeHHmm(dbShift.start_time) || undefined,
              endTime: formatTimeHHmm(dbShift.end_time) || undefined,
              remark: dbShift.cleanRemark || undefined
            }
          }
          return {
            date: dateStr,
            type: '' as ShiftType,
            startTime: '',
            endTime: '',
            remark: ''
          }
        })

        schEmployees.push({
          id: empKey,
          name: empName,
          isTemp,
          shifts: paddedShifts
        })
      })

      schEmployees.sort((a, b) => a.name.localeCompare(b.name, 'zh-TW'))
      sch.employees = schEmployees
    }
  }

  async getWeeks(monthKey?: string): Promise<RepositoryResult<Schedule[]>> {
    try {
      let query = supabase.from(this.tableName).select('*')
      if (monthKey) {
        query = query
          .gte('start_date', `${monthKey}-01`)
          .lte('start_date', `${monthKey}-31`)
      }
      const { data: weeksData, error } = await query.order('updated_at', { ascending: false })

      if (error) {
        return errorResult(error, this.tableName, 'getWeeks')
      }
      const rows = (weeksData || []) as ScheduleWeekRow[]

      // Load parent schedule_months and stores to resolve store info
      const { data: monthsData } = await supabase
        .from('schedule_months')
        .select('*')
        .eq('company_id', DEFAULT_COMPANY_ID)

      const monthMap = new Map<string, any>()
      if (monthsData) {
        monthsData.forEach(m => monthMap.set(m.id, m))
      }

      const { data: storesData } = await supabase
        .from('stores')
        .select('id, store_code, store_no, store_name, address, phone')
        .eq('company_id', DEFAULT_COMPANY_ID)

      const storeMap = new Map<string, any>()
      if (storesData) {
        storesData.forEach(s => storeMap.set(s.id, s))
      }

      const models = rows.map(row => {
        const parentMonth = row.schedule_month_id ? monthMap.get(row.schedule_month_id) : null
        const parentStore = parentMonth?.store_id ? storeMap.get(parentMonth.store_id) : null

        const rowWithStore = {
          ...row,
          stores: parentStore ? {
            id: parentStore.id,
            store_code: parentStore.store_code,
            store_no: parentStore.store_no,
            store_name: parentStore.store_name
          } : null,
          store_id: parentMonth?.store_id || null
        }

        return ScheduleMapper.weekToModel(rowWithStore as any)
      })

      // Load shifts and reconstruct employees/shifts
      await this.populateSchedulesWithShifts(models)

      return successResult(models)
    } catch (err: unknown) {
      return errorResult(err, this.tableName, 'getWeeks')
    }
  }

  async getAllSchedules(): Promise<RepositoryResult<Schedule[]>> {
    return this.getWeeks()
  }

  async getSchedule(id: string): Promise<RepositoryResult<Schedule>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        return errorResult(error, this.tableName, 'getSchedule')
      }
      const row = data as ScheduleWeekRow

      let parentStore: any = null
      if (row.schedule_month_id) {
        const { data: parentMonth } = await supabase
          .from('schedule_months')
          .select('*')
          .eq('id', row.schedule_month_id)
          .maybeSingle()

        if (parentMonth?.store_id) {
          const { data: storeRow } = await supabase
            .from('stores')
            .select('id, store_code, store_no, store_name, address, phone')
            .eq('id', parentMonth.store_id)
            .maybeSingle()

          if (storeRow) {
            parentStore = storeRow
          }
        }
      }

      const rowWithStore = {
        ...row,
        stores: parentStore ? {
          id: parentStore.id,
          store_code: parentStore.store_code,
          store_no: parentStore.store_no,
          store_name: parentStore.store_name
        } : null,
        store_id: parentStore?.id || null
      }

      const model = ScheduleMapper.weekToModel(rowWithStore as any)

      await this.populateSchedulesWithShifts([model])

      return successResult(model)
    } catch (err: unknown) {
      return errorResult(err, this.tableName, 'getSchedule')
    }
  }

  async checkScheduleWeekExists(storeIdentifier: string, weekStartStr: string): Promise<{ exists: boolean; existingSchedule?: Schedule }> {
    try {
      const startDateStr = weekStartStr || new Date().toISOString().slice(0, 10)
      const yearVal = parseInt(startDateStr.slice(0, 4), 10) || new Date().getFullYear()
      const monthNum = parseInt(startDateStr.slice(5, 7), 10) || (new Date().getMonth() + 1)
      const dayOfMonth = parseInt(startDateStr.slice(8, 10), 10) || 1
      const weekNo = Math.min(Math.ceil(dayOfMonth / 7), 5)

      const { data: dbStores } = await supabase
        .from('stores')
        .select('id, store_code, store_no, store_name')
        .eq('company_id', DEFAULT_COMPANY_ID)

      let resolvedStoreId: string | null = null
      if (dbStores && dbStores.length > 0) {
        if (isValidUuid(storeIdentifier)) {
          const match = dbStores.find(s => s.id === storeIdentifier)
          if (match) resolvedStoreId = match.id
        }
        if (!resolvedStoreId) {
          const match = dbStores.find(s =>
            s.store_no === storeIdentifier ||
            s.store_code === storeIdentifier ||
            s.store_name === storeIdentifier ||
            s.id === storeIdentifier
          )
          if (match) resolvedStoreId = match.id
        }
      }

      if (!resolvedStoreId) {
        return { exists: false }
      }

      const { data: parentMonth } = await supabase
        .from('schedule_months')
        .select('id')
        .eq('company_id', DEFAULT_COMPANY_ID)
        .eq('store_id', resolvedStoreId)
        .eq('year', yearVal)
        .eq('month', monthNum)
        .maybeSingle()

      if (!parentMonth?.id) {
        return { exists: false }
      }

      const { data: weekRow } = await supabase
        .from('schedule_weeks')
        .select('id')
        .eq('schedule_month_id', parentMonth.id)
        .eq('week_no', weekNo)
        .maybeSingle()

      if (weekRow?.id) {
        const fullSch = await this.getSchedule(weekRow.id)
        return { exists: true, existingSchedule: fullSch.data || undefined }
      }

      return { exists: false }
    } catch (err) {
      console.error('[SupabaseScheduleRepository] checkScheduleWeekExists error:', err)
      return { exists: false }
    }
  }

  async saveSchedule(schedule: Partial<Schedule>): Promise<RepositoryResult<Schedule>> {
    try {
      const startDateStr = schedule.weekStart || new Date().toISOString().slice(0, 10)
      const yearVal  = parseInt(startDateStr.slice(0, 4), 10) || new Date().getFullYear()
      const monthNum = parseInt(startDateStr.slice(5, 7), 10) || (new Date().getMonth() + 1)

      // 1. Resolve store UUID from stores table
      let resolvedStoreId: string | null = null
      const { data: dbStores } = await supabase
        .from('stores')
        .select('id, store_code, store_no, store_name')
        .eq('company_id', DEFAULT_COMPANY_ID)

      if (dbStores && dbStores.length > 0) {
        if (isValidUuid(schedule.storeId)) {
          const match = dbStores.find(s => s.id === schedule.storeId)
          if (match) resolvedStoreId = match.id
        }

        if (!resolvedStoreId) {
          const match = dbStores.find(s =>
            s.store_no === schedule.storeNo ||
            s.store_code === schedule.storeCode ||
            s.store_name === schedule.storeName
          )
          if (match) resolvedStoreId = match.id
        }

        if (!resolvedStoreId) {
          resolvedStoreId = dbStores[0].id
        }
      }

      if (!resolvedStoreId) {
        return errorResult('門市資料無效，找不到對應門市', 'stores', 'saveSchedule')
      }

      // 2. Query schedule_months parent row
      let scheduleMonthId: string | null = null
      const { data: existingMonth, error: findMonthErr } = await supabase
        .from('schedule_months')
        .select('id')
        .eq('company_id', DEFAULT_COMPANY_ID)
        .eq('store_id', resolvedStoreId)
        .eq('year', yearVal)
        .eq('month', monthNum)
        .maybeSingle()

      if (findMonthErr) {
        return errorResult(findMonthErr, 'schedule_months', 'saveSchedule')
      }

      if (existingMonth?.id) {
        scheduleMonthId = existingMonth.id
      } else {
        const monthPayload = {
          company_id: DEFAULT_COMPANY_ID,
          store_id: resolvedStoreId,
          year: yearVal,
          month: monthNum,
          status: 'draft',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        const { data: newMonth, error: createMonthErr } = await supabase
          .from('schedule_months')
          .insert([monthPayload])
          .select('id')
          .single()

        if (createMonthErr || !newMonth) {
          return errorResult(createMonthErr || '建立月度排班失敗', 'schedule_months', 'saveSchedule')
        }
        scheduleMonthId = newMonth.id
      }

      // 3. Prepare schedule_weeks row
      const dbRow = ScheduleMapper.modelToWeekDbRow(schedule)
      dbRow.schedule_month_id = scheduleMonthId
      if (!dbRow.week_no) {
        const dayOfMonth = parseInt(startDateStr.slice(8, 10), 10) || 1
        dbRow.week_no = Math.min(Math.ceil(dayOfMonth / 7), 5)
      }

      let weekRowId: string | null = null
      let weekData: any = null

      const { data: existingWeek, error: findWeekErr } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('schedule_month_id', scheduleMonthId)
        .eq('week_no', dbRow.week_no)
        .maybeSingle()

      if (findWeekErr) {
        return errorResult(findWeekErr, this.tableName, 'saveSchedule')
      }

      if (existingWeek) {
        weekRowId = existingWeek.id
        const updatePayload = {
          ...dbRow,
          updated_at: new Date().toISOString()
        }
        delete updatePayload.id

        const { data: updatedWeek, error: updateErr } = await supabase
          .from(this.tableName)
          .update(updatePayload)
          .eq('id', weekRowId)
          .select('*')
          .single()

        if (updateErr || !updatedWeek) {
          return errorResult(updateErr || '更新週排班失敗', this.tableName, 'saveSchedule')
        }
        weekData = updatedWeek
      } else {
        const { data: insertedWeek, error: insertErr } = await supabase
          .from(this.tableName)
          .insert([dbRow])
          .select('*')
          .single()

        if (insertErr || !insertedWeek) {
          return errorResult(insertErr || '新增週排班失敗', this.tableName, 'saveSchedule')
        }
        weekData = insertedWeek
        weekRowId = insertedWeek.id
      }

      // 4. Resolve employees for persistence without creating master employees
      const { data: allMasterEmps } = await supabase
        .from('master_employees')
        .select('id, name')

      const masterEmpMap = new Map<string, string>()
      if (allMasterEmps) {
        allMasterEmps.forEach(e => masterEmpMap.set((e.name || '').trim(), e.id))
      }

      const employeesToSave = schedule.employees || []
      const resolvedEmployees: { id: string | null; name: string; isTemp: boolean; shifts: Shift[] }[] = []

      for (const emp of employeesToSave) {
        const trimmedName = (emp.name || '').trim()
        const isExplicitTemp = emp.isTemp === true || emp.id.startsWith('temp_')
        const matchedMasterEmpId = masterEmpMap.get(trimmedName)

        if (isExplicitTemp) {
          resolvedEmployees.push({
            id: null,
            name: trimmedName,
            isTemp: true,
            shifts: emp.shifts || []
          })
        } else if (isValidUuid(emp.id)) {
          resolvedEmployees.push({
            id: emp.id,
            name: trimmedName,
            isTemp: false,
            shifts: emp.shifts || []
          })
        } else if (matchedMasterEmpId) {
          resolvedEmployees.push({
            id: matchedMasterEmpId,
            name: trimmedName,
            isTemp: false,
            shifts: emp.shifts || []
          })
        } else {
          resolvedEmployees.push({
            id: null,
            name: trimmedName,
            isTemp: true,
            shifts: emp.shifts || []
          })
        }
      }

      // 5. Prepare schedule_shifts rows with employee_id / employee_name split
      const shiftRows: any[] = []
      for (const emp of resolvedEmployees) {
        for (const shift of emp.shifts) {
          if (shift.type && typeof shift.type === 'string' && shift.type.trim() !== '') {
            const userRemark = shift.remark ? shift.remark.trim() : ''
            const shiftRemark = userRemark || null

            shiftRows.push({
              schedule_week_id: weekRowId,
              employee_id: emp.isTemp ? null : emp.id,
              employee_name: emp.isTemp ? emp.name : null,
              work_date: shift.date,
              shift_type: shift.type,
              start_time: shift.startTime || null,
              end_time: shift.endTime || null,
              is_day_off: shift.type === 'off',
              remarks: shiftRemark,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
          }
        }
      }

      // 6. Query existing shifts in DB for this week
      const { data: dbShifts, error: queryShiftsErr } = await supabase
        .from('schedule_shifts')
        .select('id, employee_id, employee_name, work_date, remarks')
        .eq('schedule_week_id', weekRowId)

      if (queryShiftsErr) {
        return errorResult(queryShiftsErr, 'schedule_shifts', 'saveSchedule')
      }

      const dbShiftMap = new Map<string, string>()
      if (dbShifts) {
        dbShifts.forEach((s: any) => {
          if (s.employee_id) {
            dbShiftMap.set(`formal_${s.employee_id}_${s.work_date}`, s.id)
          } else {
            const name = (s.employee_name || '').trim() || '臨時工'
            const legacyName = name.replace(/\s+/g, '_')
            dbShiftMap.set(`temp:${name}_${s.work_date}`, s.id)
            dbShiftMap.set(`temp_${legacyName}_${s.work_date}`, s.id)
          }
        })
      }

      const keptShiftIds = new Set<string>()

      // 7. Upsert each shift. If any fails, return error immediately!
      for (const shiftRow of shiftRows) {
        let key = ''
        if (shiftRow.employee_id) {
          key = `formal_${shiftRow.employee_id}_${shiftRow.work_date}`
        } else {
          const name = (shiftRow.employee_name || '').trim() || '臨時工'
          const legacyName = name.replace(/\s+/g, '_')
          key = `temp:${name}_${shiftRow.work_date}`
          const legacyKey = `temp_${legacyName}_${shiftRow.work_date}`
          const existingShiftId = dbShiftMap.get(key) || dbShiftMap.get(legacyKey)
          if (existingShiftId) {
            keptShiftIds.add(existingShiftId)
            const updatePayload: any = {
              shift_type: shiftRow.shift_type,
              start_time: shiftRow.start_time,
              end_time: shiftRow.end_time,
              is_day_off: shiftRow.is_day_off,
              employee_id: shiftRow.employee_id,
              employee_name: shiftRow.employee_name,
              remarks: shiftRow.remarks,
              updated_at: new Date().toISOString()
            }

            const { error: updErr } = await supabase
              .from('schedule_shifts')
              .update(updatePayload)
              .eq('id', existingShiftId)

            if (updErr) {
              console.error('❌ Failed to update schedule_shift:', updErr.message)
              return errorResult(updErr, 'schedule_shifts', 'saveSchedule')
            }
            continue
          }

          const { data: newShift, error: insErr } = await supabase
            .from('schedule_shifts')
            .insert([shiftRow])
            .select('id')
            .single()

          if (insErr || !newShift) {
            console.error('❌ Failed to insert schedule_shift:', insErr?.message)
            return errorResult(insErr || '新增班別失敗', 'schedule_shifts', 'saveSchedule')
          }
          keptShiftIds.add(newShift.id)
          continue
        }

        const existingShiftId = dbShiftMap.get(key)

        if (existingShiftId) {
          keptShiftIds.add(existingShiftId)
          const updatePayload: any = {
            shift_type: shiftRow.shift_type,
            start_time: shiftRow.start_time,
            end_time: shiftRow.end_time,
            is_day_off: shiftRow.is_day_off,
            remarks: shiftRow.remarks,
            updated_at: new Date().toISOString()
          }

          const { error: updErr } = await supabase
            .from('schedule_shifts')
            .update(updatePayload)
            .eq('id', existingShiftId)

          if (updErr) {
            console.error('❌ Failed to update schedule_shift:', updErr.message)
            return errorResult(updErr, 'schedule_shifts', 'saveSchedule')
          }
        } else {
          const { data: newShift, error: insErr } = await supabase
            .from('schedule_shifts')
            .insert([shiftRow])
            .select('id')
            .single()

          if (insErr || !newShift) {
            console.error('❌ Failed to insert schedule_shift:', insErr?.message)
            return errorResult(insErr || '新增班別失敗', 'schedule_shifts', 'saveSchedule')
          }
          keptShiftIds.add(newShift.id)
        }
      }

      // 8. Delete removed shifts. If fails, return error!
      const deleteIds: string[] = []
      if (dbShifts) {
        dbShifts.forEach(s => {
          if (!keptShiftIds.has(s.id)) {
            deleteIds.push(s.id)
          }
        })
      }

      if (deleteIds.length > 0) {
        const { error: delErr } = await supabase
          .from('schedule_shifts')
          .delete()
          .in('id', deleteIds)

        if (delErr) {
          console.error('❌ Failed to delete old schedule_shifts:', delErr.message)
          return errorResult(delErr, 'schedule_shifts', 'saveSchedule')
        }
      }

      // 9. Reconstruct fully populated schedule model to return
      const savedModel = ScheduleMapper.weekToModel(weekData as ScheduleWeekRow)
      await this.populateSchedulesWithShifts([savedModel])

      return successResult(savedModel)
    } catch (err: unknown) {
      console.error('❌ Supabase saveSchedule Exception:', err)
      return errorResult(err, this.tableName, 'saveSchedule')
    }
  }

  async deleteSchedule(id: string): Promise<RepositoryResult<boolean>> {
    try {
      await supabase
        .from('schedule_shifts')
        .delete()
        .eq('schedule_week_id', id)

      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id)

      if (error) {
        return errorResult(error, this.tableName, 'deleteSchedule')
      }
      return successResult(true)
    } catch (err: unknown) {
      return errorResult(err, this.tableName, 'deleteSchedule')
    }
  }
}

export const supabaseScheduleRepository = new SupabaseScheduleRepository()
