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

const DEFAULT_SHIFT_TEMPLATES: ShiftTemplate[] = [
  { id: 'morning',   label: '早班',   emoji: '🌞', startTime: '07:00', endTime: '15:00', color: '#FFF9C4' },
  { id: 'evening',   label: '晚班',   emoji: '🌆', startTime: '15:00', endTime: '23:00', color: '#E3F2FD' },
  { id: 'night',     label: '大夜班', emoji: '🌙', startTime: '23:00', endTime: '07:00', color: '#EDE7F6' },
  { id: 'off',       label: '休',     emoji: '🏖️',  startTime: '',      endTime: '',      color: '#FCE4EC' },
  { id: 'public',    label: '公',     emoji: '📅', startTime: '',      endTime: '',      color: '#E8EAF6' },
  { id: 'annual',    label: '特',     emoji: '🌿', startTime: '',      endTime: '',      color: '#E8F5E9' },
  { id: 'sick',      label: '病',     emoji: '🤒', startTime: '',      endTime: '',      color: '#FFFDE7' },
  { id: 'personal',  label: '事',     emoji: '📝', startTime: '',      endTime: '',      color: '#FFF3E0' },
]

export class SupabaseScheduleRepository {
  private tableName = 'schedule_weeks'

  /**
   * Helper to fetch and reconstruct the employees and shifts array for a list of schedules.
   */
  private async populateSchedulesWithShifts(schedules: Schedule[]): Promise<void> {
    if (schedules.length === 0) return

    const weekIds = schedules.map(s => s.id).filter(Boolean)

    // 1. Fetch all shifts for these week ids
    const { data: shiftsData, error: shiftsError } = await supabase
      .from('schedule_shifts')
      .select('*')
      .in('schedule_week_id', weekIds)

    if (shiftsError) {
      console.error('[SupabaseScheduleRepository] Failed to fetch schedule_shifts:', shiftsError)
      return
    }

    const shifts = shiftsData || []

    // 2. Fetch all master employees to map employee_id -> name
    const { data: empsData, error: empsError } = await supabase
      .from('master_employees')
      .select('id, name')

    const empMap = new Map<string, string>()
    if (empsError) {
      console.error('[SupabaseScheduleRepository] Failed to fetch master_employees:', empsError)
    } else if (empsData) {
      empsData.forEach(e => empMap.set(e.id, e.name))
    }

    // 3. Group shifts by schedule_week_id
    const shiftsByWeek = new Map<string, typeof shifts>()
    shifts.forEach(s => {
      const wId = (s.schedule_week_id || '').toLowerCase()
      if (!shiftsByWeek.has(wId)) {
        shiftsByWeek.set(wId, [])
      }
      shiftsByWeek.get(wId)!.push(s)
    })

    // 4. Populate each schedule
    for (const sch of schedules) {
      const schIdKey = (sch.id || '').toLowerCase()
      const schShifts = shiftsByWeek.get(schIdKey) || []
      
      // Calculate 7 dates of the week (Mon ~ Sun)
      const weekDates: string[] = []
      if (sch.weekStart) {
        const start = new Date(sch.weekStart)
        for (let i = 0; i < 7; i++) {
          const cur = new Date(start)
          cur.setDate(start.getDate() + i)
          weekDates.push(cur.toISOString().slice(0, 10))
        }
      }

      // Group DB shifts by employee key (formal vs temporary)
      const empShiftsMap = new Map<string, { name: string; isTemp: boolean; dateMap: Map<string, any> }>()
      
      schShifts.forEach((s: any) => {
        let empKey = s.employee_id
        let isTemp = false
        let empName = ''

        if (s.employee_id && isValidUuid(s.employee_id)) {
          empKey = s.employee_id
          empName = empMap.get(s.employee_id) || s.employee_name || '未命名員工'
        } else {
          // Temporary employee (employee_id is NULL)
          empName = s.employee_name || (s.remarks && s.remarks.startsWith('[temp:') ? s.remarks.slice(6, -1) : '臨時工')
          empKey = `temp_${empName}`
          isTemp = true
        }

        if (!empShiftsMap.has(empKey)) {
          empShiftsMap.set(empKey, { name: empName, isTemp, dateMap: new Map<string, any>() })
        }
        empShiftsMap.get(empKey)!.dateMap.set(s.work_date, s)
      })

      // Merge existing employee objects in sch.employees
      const existingEmps = sch.employees || []
      existingEmps.forEach(e => {
        const isTemp = e.isTemp || e.id.startsWith('temp_') || !isValidUuid(e.id)
        const empKey = isTemp ? `temp_${e.name}` : e.id
        if (!empShiftsMap.has(empKey)) {
          empShiftsMap.set(empKey, { name: e.name, isTemp, dateMap: new Map<string, any>() })
        }
      })

      const schEmployees: ScheduleEmployee[] = []
      empShiftsMap.forEach(({ name: empName, isTemp, dateMap }, empKey) => {
        // Pad to 7 days for UI display
        const paddedShifts: Shift[] = weekDates.map(dateStr => {
          const dbShift = dateMap.get(dateStr)
          if (dbShift) {
            return {
              date: dateStr,
              type: (dbShift.shift_type || '') as ShiftType,
              startTime: formatTimeHHmm(dbShift.start_time) || undefined,
              endTime: formatTimeHHmm(dbShift.end_time) || undefined,
              remark: dbShift.remarks || undefined
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
          isTemp: isTemp,
          shifts: paddedShifts
        })
      })

      // Sort employees by name to keep order consistent
      schEmployees.sort((a, b) => a.name.localeCompare(b.name))

      sch.employees = schEmployees

      console.log("Schedule ID", sch.id)
      console.log("Shifts", schShifts)
      console.log("Employees", schEmployees)
      console.log("Returned Schedule", sch)
    }
  }

  async getMonths(): Promise<RepositoryResult<string[]>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('start_date')

      if (error) {
        return errorResult(error, this.tableName, 'getMonths')
      }
      const rows = (data || []) as { start_date?: string | null }[]
      const months = Array.from(
        new Set(rows.map(item => (item.start_date || '').slice(0, 7)).filter(Boolean))
      ).sort().reverse()
      return successResult(months)
    } catch (err: unknown) {
      return errorResult(err, this.tableName, 'getMonths')
    }
  }

  async createMonth(monthKey: string): Promise<RepositoryResult<string>> {
    try {
      return successResult(monthKey)
    } catch (err: unknown) {
      return errorResult(err, this.tableName, 'createMonth')
    }
  }

  async deleteMonth(monthKey: string): Promise<RepositoryResult<boolean>> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .gte('start_date', `${monthKey}-01`)
        .lte('start_date', `${monthKey}-31`)

      if (error) {
        return errorResult(error, this.tableName, 'deleteMonth')
      }
      return successResult(true)
    } catch (err: unknown) {
      return errorResult(err, this.tableName, 'deleteMonth')
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
      const { data: weeksData, error: error } = await query.order('updated_at', { ascending: false })

      if (error) {
        return errorResult(error, this.tableName, 'getWeeks')
      }
      const rows = (weeksData || []) as ScheduleWeekRow[]

      // Load parent schedule_months and stores to resolve store name and code in memory
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
        .select('*')
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
            store_name: parentStore.store_name
          } : null,
          store_id: parentMonth?.store_id || null
        }
        return ScheduleMapper.weekToModel(rowWithStore as any)
      })
      
      // Load shifts and reconstruct employees/shifts
      await this.populateSchedulesWithShifts(models)
      
      console.log("Loaded schedules", models)
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
      let storeIdVal: string | null = null
      if (row.schedule_month_id) {
        const { data: parentMonth } = await supabase
          .from('schedule_months')
          .select('*')
          .eq('id', row.schedule_month_id)
          .maybeSingle()

        if (parentMonth?.store_id) {
          storeIdVal = parentMonth.store_id
          const { data: storeRow } = await supabase
            .from('stores')
            .select('*')
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
          store_name: parentStore.store_name
        } : null,
        store_id: storeIdVal
      }

      const model = ScheduleMapper.weekToModel(rowWithStore as any)
      
      // Load shifts for this single schedule
      await this.populateSchedulesWithShifts([model])
      
      console.log("Schedule employees", model.employees)
      return successResult(model)
    } catch (err: unknown) {
      return errorResult(err, this.tableName, 'getSchedule')
    }
  }

  async getScheduleByMonthStoreWeek(storeId: string, year: number, month: number, weekNo: number): Promise<RepositoryResult<Schedule>> {
    try {
      const { data: dbStores } = await supabase
        .from('stores')
        .select('id, store_code, store_name')
        .eq('company_id', DEFAULT_COMPANY_ID)

      let resolvedStoreId = storeId
      if (dbStores && dbStores.length > 0) {
        if (!isValidUuid(storeId)) {
          const match = dbStores.find(s => s.store_code === storeId || s.store_name === storeId)
          if (match) resolvedStoreId = match.id
        }
      }

      const { data: parentMonth } = await supabase
        .from('schedule_months')
        .select('id')
        .eq('company_id', DEFAULT_COMPANY_ID)
        .eq('store_id', resolvedStoreId)
        .eq('year', year)
        .eq('month', month)
        .maybeSingle()

      if (!parentMonth?.id) {
        return errorResult('Schedule month not found', this.tableName, 'getScheduleByMonthStoreWeek')
      }

      const { data: weekData, error: weekErr } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('schedule_month_id', parentMonth.id)
        .eq('week_no', weekNo)
        .single()

      if (weekErr || !weekData) {
        return errorResult(weekErr || 'Schedule week not found', this.tableName, 'getScheduleByMonthStoreWeek')
      }
      return this.getSchedule(weekData.id)
    } catch (err: unknown) {
      return errorResult(err, this.tableName, 'getScheduleByMonthStoreWeek')
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
        .select('id, store_code, store_name')
        .eq('company_id', DEFAULT_COMPANY_ID)

      let resolvedStoreId: string | null = null
      if (dbStores && dbStores.length > 0) {
        if (isValidUuid(storeIdentifier)) {
          const match = dbStores.find(s => s.id === storeIdentifier)
          if (match) resolvedStoreId = match.id
        }
        if (!resolvedStoreId) {
          const match = dbStores.find(s => 
            s.store_code === storeIdentifier || 
            s.store_name === storeIdentifier
          )
          if (match) resolvedStoreId = match.id
        }
        if (!resolvedStoreId) {
          resolvedStoreId = dbStores[0].id
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
      // 1. Extract year and month from weekStart (e.g., "2026-08-03" -> year 2026, month 8)
      const startDateStr = schedule.weekStart || new Date().toISOString().slice(0, 10)
      const yearVal  = parseInt(startDateStr.slice(0, 4), 10) || new Date().getFullYear()
      const monthNum = parseInt(startDateStr.slice(5, 7), 10) || (new Date().getMonth() + 1)

      // 1.5. Resolve store UUID from stores table
      let resolvedStoreId: string | null = null
      
      const { data: dbStores } = await supabase
        .from('stores')
        .select('id, store_code, store_name')
        .eq('company_id', DEFAULT_COMPANY_ID)

      if (dbStores && dbStores.length > 0) {
        if (isValidUuid(schedule.storeId)) {
          const match = dbStores.find(s => s.id === schedule.storeId)
          if (match) resolvedStoreId = match.id
        }

        if (!resolvedStoreId) {
          const match = dbStores.find(s => 
            s.store_code === schedule.storeCode || 
            s.store_code === schedule.storeId ||
            s.store_name === schedule.storeName
          )
          if (match) resolvedStoreId = match.id
        }

        if (!resolvedStoreId) {
          resolvedStoreId = dbStores[0].id
        }
      }

      console.log('🚀 [SupabaseScheduleRepository] Resolved store_id UUID:', resolvedStoreId)

      // 2. Query schedule_months to find existing parent month row by store_id, company_id, year, month
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
        console.warn('⚠️ Query schedule_months warning:', findMonthErr.message)
      }

      if (existingMonth?.id) {
        scheduleMonthId = existingMonth.id
        console.log('✅ Found existing schedule_months ID:', scheduleMonthId)
      } else {
        // Create new schedule_months row
        const monthPayload = {
          company_id: DEFAULT_COMPANY_ID,
          store_id: resolvedStoreId,
          year: yearVal,
          month: monthNum,
          status: 'draft',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        console.log('🚀 [SupabaseScheduleRepository] Creating schedule_months parent row:', monthPayload)
        const { data: newMonth, error: createMonthErr } = await supabase
          .from('schedule_months')
          .insert([monthPayload])
          .select('id')
          .single()

        if (createMonthErr) {
          console.error('code:', createMonthErr.code)
          console.error('message:', createMonthErr.message)
          console.error('details:', createMonthErr.details)
          console.error('hint:', createMonthErr.hint)
          console.error('status:', (createMonthErr as any).status || 'N/A')
          return errorResult(createMonthErr, 'schedule_months', 'saveSchedule')
        }

        scheduleMonthId = newMonth.id
        console.log('✅ Successfully created schedule_months ID:', scheduleMonthId)
      }

      // 3. Prepare schedule_weeks row with schedule_month_id and week_no
      const dbRow = ScheduleMapper.modelToWeekDbRow(schedule)
      dbRow.schedule_month_id = scheduleMonthId
      if (!dbRow.week_no) {
        const dayOfMonth = parseInt(startDateStr.slice(8, 10), 10) || 1
        dbRow.week_no = Math.min(Math.ceil(dayOfMonth / 7), 5)
      }

      console.log('Schedule Upsert Check - Month ID:', scheduleMonthId, 'Week No:', dbRow.week_no)

      // Query schedule_weeks by schedule_month_id and week_no first to decide UPDATE or INSERT
      let weekRowId: string | null = null
      let weekData: any = null

      const { data: existingWeek, error: findWeekErr } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('schedule_month_id', scheduleMonthId)
        .eq('week_no', dbRow.week_no)
        .maybeSingle()

      if (findWeekErr) {
        console.warn('⚠️ Query schedule_weeks warning:', findWeekErr.message)
      }

      if (existingWeek) {
        weekRowId = existingWeek.id
        console.log('✅ Found existing schedule_weeks ID:', weekRowId)
        // UPDATE existing week
        const updatePayload = {
          ...dbRow,
          updated_at: new Date().toISOString()
        }
        delete updatePayload.id // do not overwrite UUID primary key

        const { data: updatedWeek, error: updateErr } = await supabase
          .from(this.tableName)
          .update(updatePayload)
          .eq('id', weekRowId)
          .select('*')
          .single()

        if (updateErr) {
          console.error('Failed to update schedule_weeks:', updateErr.message)
          return errorResult(updateErr, this.tableName, 'saveSchedule')
        }
        weekData = updatedWeek
      } else {
        console.log('🚀 Inserting new schedule_weeks')
        // INSERT new week
        const { data: insertedWeek, error: insertErr } = await supabase
          .from(this.tableName)
          .insert([dbRow])
          .select('*')
          .single()

        if (insertErr) {
          console.error('Failed to insert schedule_weeks:', insertErr.message)
          return errorResult(insertErr, this.tableName, 'saveSchedule')
        }
        weekData = insertedWeek
        weekRowId = insertedWeek.id
      }

      // 4. Resolve Master Employee UUIDs for Formal Employees ONLY
      // Do NOT create master_employees for temporary employees (isTemp = true)
      const { data: allMasterEmps } = await supabase
        .from('master_employees')
        .select('id, name')

      const masterEmpMap = new Map<string, string>()
      if (allMasterEmps) {
        allMasterEmps.forEach(e => masterEmpMap.set(e.name.trim(), e.id))
      }

      const employeesToSave = schedule.employees || []
      const resolvedEmployees: { id: string | null; name: string; isTemp: boolean; shifts: Shift[] }[] = []

      for (const emp of employeesToSave) {
        const trimmedName = emp.name.trim()
        const isExplicitTemp = emp.isTemp === true || emp.id.startsWith('temp_')

        if (isExplicitTemp) {
          // Temporary employee: NO master_employees record, NO UUID!
          resolvedEmployees.push({
            id: null,
            name: trimmedName,
            isTemp: true,
            shifts: emp.shifts || []
          })
        } else if (isValidUuid(emp.id)) {
          // Formal employee with valid UUID
          resolvedEmployees.push({
            id: emp.id,
            name: trimmedName,
            isTemp: false,
            shifts: emp.shifts || []
          })
        } else if (masterEmpMap.has(trimmedName)) {
          // Match existing master employee by name
          resolvedEmployees.push({
            id: masterEmpMap.get(trimmedName)!,
            name: trimmedName,
            isTemp: false,
            shifts: emp.shifts || []
          })
        } else {
          // Unmatched non-explicit temp -> Treat as temporary employee (no master_employee creation)
          resolvedEmployees.push({
            id: null,
            name: trimmedName,
            isTemp: true,
            shifts: emp.shifts || []
          })
        }
      }

      // 5. Prepare schedule_shifts insertion rows
      const shiftRows: any[] = []
      for (const emp of resolvedEmployees) {
        for (const shift of emp.shifts) {
          if (shift.type && typeof shift.type === 'string' && shift.type.trim() !== '') {
            shiftRows.push({
              schedule_week_id: weekRowId,
              employee_id: emp.id, // null for temporary employees
              employee_name: emp.name, // stores name string
              work_date: shift.date,
              shift_type: shift.type,
              start_time: shift.startTime || null,
              end_time: shift.endTime || null,
              is_day_off: shift.type === 'off',
              remarks: shift.remark || null,
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
        console.warn('⚠️ Query schedule_shifts warning:', queryShiftsErr.message)
      }

      const dbShiftMap = new Map<string, string>() // key -> shift.id
      if (dbShifts) {
        dbShifts.forEach((s: any) => {
          if (s.employee_id) {
            dbShiftMap.set(`formal_${s.employee_id}_${s.work_date}`, s.id)
          } else {
            const name = s.employee_name || (s.remarks && s.remarks.startsWith('[temp:') ? s.remarks.slice(6, -1) : '')
            dbShiftMap.set(`temp_${name}_${s.work_date}`, s.id)
          }
        })
      }

      const keptShiftIds = new Set<string>()

      // 7. Upsert each shift
      for (const shiftRow of shiftRows) {
        const key = shiftRow.employee_id 
          ? `formal_${shiftRow.employee_id}_${shiftRow.work_date}` 
          : `temp_${shiftRow.employee_name}_${shiftRow.work_date}`
        const existingShiftId = dbShiftMap.get(key)

        if (existingShiftId) {
          keptShiftIds.add(existingShiftId)
          // UPDATE
          const updatePayload: any = {
            shift_type: shiftRow.shift_type,
            start_time: shiftRow.start_time,
            end_time: shiftRow.end_time,
            is_day_off: shiftRow.is_day_off,
            remarks: shiftRow.remarks,
            updated_at: new Date().toISOString()
          }
          if (shiftRow.employee_name) {
            updatePayload.employee_name = shiftRow.employee_name
          }

          const { error: updErr } = await supabase
            .from('schedule_shifts')
            .update(updatePayload)
            .eq('id', existingShiftId)

          if (updErr) {
            console.error('❌ Failed to update schedule_shift:', updErr.message)
          }
        } else {
          // INSERT
          const { data: newShift, error: insErr } = await supabase
            .from('schedule_shifts')
            .insert([shiftRow])
            .select('id')
            .single()

          if (insErr) {
            console.error('❌ Failed to insert schedule_shift:', insErr.message)
            // Fallback if DB table schedule_shifts has NOT-NULL employee_id constraint before SQL migration execution
            if (insErr.message?.includes('employee_id') || insErr.message?.includes('employee_name')) {
              console.warn('⚠️ Fallback for NOT-NULL employee_id constraint...')
              const tempRemark = `[temp:${shiftRow.employee_name}]`
              const { data: tempMaster } = await supabase
                .from('master_employees')
                .insert([{
                  name: shiftRow.employee_name,
                  company_id: DEFAULT_COMPANY_ID,
                  store_id: resolvedStoreId,
                  hire_date: new Date().toISOString().slice(0, 10),
                  is_active: true,
                  notes: '[temp]'
                }])
                .select('id')
                .single()

              if (tempMaster?.id) {
                const fallbackRow = { ...shiftRow, employee_id: tempMaster.id, remarks: tempRemark }
                delete fallbackRow.employee_name
                const { data: retryData } = await supabase.from('schedule_shifts').insert([fallbackRow]).select('id').single()
                if (retryData) keptShiftIds.add(retryData.id)
              }
            }
          } else if (newShift) {
            keptShiftIds.add(newShift.id)
          }
        }
      }

      // 8. Delete any shifts that are no longer present in the updated roster
      const deleteIds: string[] = []
      if (dbShifts) {
        dbShifts.forEach(s => {
          if (!keptShiftIds.has(s.id)) {
            deleteIds.push(s.id)
          }
        })
      }

      if (deleteIds.length > 0) {
        console.log(`🚀 [SupabaseScheduleRepository] Deleting ${deleteIds.length} removed shifts...`)
        await supabase
          .from('schedule_shifts')
          .delete()
          .in('id', deleteIds)
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

  async saveWeek(weekData: Partial<Schedule>): Promise<RepositoryResult<Schedule>> {
    return this.saveSchedule(weekData)
  }

  async bulkSaveSchedules(schedules: Partial<Schedule>[]): Promise<RepositoryResult<Schedule[]>> {
    try {
      const savedModels: Schedule[] = []
      for (const s of schedules) {
        const res = await this.saveSchedule(s)
        if (res.success && res.data) {
          savedModels.push(res.data)
        } else {
          return errorResult(res.error || 'Bulk save failed at individual week', this.tableName, 'bulkSaveSchedules')
        }
      }
      return successResult(savedModels)
    } catch (err: unknown) {
      return errorResult(err, this.tableName, 'bulkSaveSchedules')
    }
  }

  async deleteSchedule(id: string): Promise<RepositoryResult<boolean>> {
    try {
      // 1. Delete associated shifts first
      await supabase
        .from('schedule_shifts')
        .delete()
        .eq('schedule_week_id', id)

      // 2. Delete the week row
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

  async getShiftTemplates(): Promise<RepositoryResult<ShiftTemplate[]>> {
    return successResult(DEFAULT_SHIFT_TEMPLATES)
  }
}

export const supabaseScheduleRepository = new SupabaseScheduleRepository()
