import { supabase } from '../lib/supabase'
import { Schedule, ScheduleEmployee, Shift, ShiftType } from '../types/schedule'
import { ScheduleWeekRow } from '../types/database'
import { ScheduleMapper, isValidUuid } from '../mappers/ScheduleMapper'
import { DEFAULT_COMPANY_ID } from '../mappers/EmployeeMapper'
import { RepositoryResult, successResult, errorResult } from './base.repository'

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

    // 3. Group shifts by week_id
    const shiftsByWeek = new Map<string, typeof shifts>()
    shifts.forEach(s => {
      const wId = s.schedule_week_id
      if (!shiftsByWeek.has(wId)) {
        shiftsByWeek.set(wId, [])
      }
      shiftsByWeek.get(wId)!.push(s)
    })

    // 4. Populate each schedule
    for (const sch of schedules) {
      const schShifts = shiftsByWeek.get(sch.id) || []
      
      // Group shifts by employee_id to build the ScheduleEmployee list
      const empShiftsMap = new Map<string, any[]>()
      schShifts.forEach(s => {
        const empId = s.employee_id
        if (!empShiftsMap.has(empId)) {
          empShiftsMap.set(empId, [])
        }
        empShiftsMap.get(empId)!.push(s)
      })

      const schEmployees: ScheduleEmployee[] = []
      empShiftsMap.forEach((empShifts, empId) => {
        const empName = empMap.get(empId) || '未命名員工'
        const employeeShifts: Shift[] = empShifts.map(s => ({
          date: s.work_date,
          type: s.shift_type as ShiftType,
          startTime: s.start_time || undefined,
          endTime: s.end_time || undefined,
          remark: s.remarks || undefined
        }))

        schEmployees.push({
          id: empId,
          name: empName,
          shifts: employeeShifts
        })
      })

      // Sort employees by name to keep order consistent
      schEmployees.sort((a, b) => a.name.localeCompare(b.name))

      sch.employees = schEmployees
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
      const { data, error } = await query.order('updated_at', { ascending: false })

      if (error) {
        return errorResult(error, this.tableName, 'getWeeks')
      }
      const rows = (data || []) as ScheduleWeekRow[]
      const models = rows.map(row => ScheduleMapper.weekToModel(row))
      
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
      const model = ScheduleMapper.weekToModel(data as ScheduleWeekRow)
      
      // Load shifts for this single schedule
      await this.populateSchedulesWithShifts([model])
      
      return successResult(model)
    } catch (err: unknown) {
      return errorResult(err, this.tableName, 'getSchedule')
    }
  }

  async saveSchedule(schedule: Partial<Schedule>): Promise<RepositoryResult<Schedule>> {
    try {
      // 1. Extract year and month from weekStart (e.g., "2026-08-03" -> year 2026, month 8)
      const startDateStr = schedule.weekStart || new Date().toISOString().slice(0, 10)
      const yearVal  = parseInt(startDateStr.slice(0, 4), 10) || new Date().getFullYear()
      const monthNum = parseInt(startDateStr.slice(5, 7), 10) || (new Date().getMonth() + 1)

      // 2. Query schedule_months to find existing parent month row
      let scheduleMonthId: string | null = null
      const { data: existingMonth, error: findMonthErr } = await supabase
        .from('schedule_months')
        .select('id')
        .eq('company_id', DEFAULT_COMPANY_ID)
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

      console.log('schedule_weeks INSERT', dbRow)
      console.log('Schedule INSERT/UPSERT Payload', dbRow)
      console.log('③ Repository Payload (JSON):\n' + JSON.stringify(dbRow, null, 2))

      const result = dbRow.id
        ? await supabase.from(this.tableName).upsert([dbRow]).select('*').single()
        : await supabase.from(this.tableName).insert([dbRow]).select('*').single()

      console.log('④ Supabase Schedule Result:', result)
      const { data, error } = result

      if (error) {
        console.error('code:', error.code)
        console.error('message:', error.message)
        console.error('details:', error.details)
        console.error('hint:', error.hint)
        console.error('status:', (error as any).status || (error as any).statusCode || 'N/A')
        return errorResult(error, this.tableName, 'saveSchedule')
      }

      const weekRowId = data.id
      console.log('④ Supabase Schedule Success Data:\n' + JSON.stringify(data, null, 2))

      // 4. Resolve Master Employee UUIDs by name, creating them if missing
      const { data: allMasterEmps } = await supabase
        .from('master_employees')
        .select('id, name')

      const masterEmpMap = new Map<string, string>()
      if (allMasterEmps) {
        allMasterEmps.forEach(e => masterEmpMap.set(e.name.trim(), e.id))
      }

      const employeesToSave = schedule.employees || []
      const resolvedEmployees: { id: string; name: string; shifts: Shift[] }[] = []

      for (const emp of employeesToSave) {
        let realUuid = ''
        const trimmedName = emp.name.trim()

        if (isValidUuid(emp.id)) {
          realUuid = emp.id
        } else if (masterEmpMap.has(trimmedName)) {
          realUuid = masterEmpMap.get(trimmedName)!
        } else {
          // Dynamic insert into master_employees to preserve FK referential integrity
          console.log(`🚀 [SupabaseScheduleRepository] Dynamically creating master_employee for: ${trimmedName}`)
          const { data: newEmpRow, error: newEmpErr } = await supabase
            .from('master_employees')
            .insert([{
              name: trimmedName,
              company_id: DEFAULT_COMPANY_ID,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }])
            .select('id')
            .single()

          if (newEmpErr) {
            console.error('Failed to auto-create master employee:', newEmpErr)
            continue
          }
          realUuid = newEmpRow.id
          masterEmpMap.set(trimmedName, realUuid)
        }

        resolvedEmployees.push({
          id: realUuid,
          name: trimmedName,
          shifts: emp.shifts || []
        })
      }

      // 5. Prepare schedule_shifts insertion rows
      const shiftRows: any[] = []
      for (const emp of resolvedEmployees) {
        for (const shift of emp.shifts) {
          shiftRows.push({
            schedule_week_id: weekRowId,
            employee_id: emp.id,
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

      // 6. Delete old shifts for this week start fresh
      const { error: delShiftsErr } = await supabase
        .from('schedule_shifts')
        .delete()
        .eq('schedule_week_id', weekRowId)

      if (delShiftsErr) {
        console.error('❌ Failed to delete old schedule_shifts:', delShiftsErr)
      }

      // 7. Bulk insert new shifts
      if (shiftRows.length > 0) {
        console.log(`🚀 [SupabaseScheduleRepository] Inserting ${shiftRows.length} shifts to schedule_shifts...`)
        const { error: insShiftsErr } = await supabase
          .from('schedule_shifts')
          .insert(shiftRows)

        if (insShiftsErr) {
          console.error('❌ Failed to insert schedule_shifts:', insShiftsErr)
        }
      }

      // 8. Reconstruct fully populated schedule model to return
      const savedModel = ScheduleMapper.weekToModel(data as ScheduleWeekRow)
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
