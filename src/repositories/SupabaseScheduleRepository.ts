import { supabase } from '../lib/supabase'
import { Schedule } from '../types/schedule'
import { ScheduleWeekRow } from '../types/database'
import { ScheduleMapper } from '../mappers/ScheduleMapper'
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
      return successResult(ScheduleMapper.weekToModel(data as ScheduleWeekRow))
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

      // 3. Prepare schedule_weeks row with schedule_month_id
      const dbRow = ScheduleMapper.modelToWeekDbRow(schedule)
      dbRow.schedule_month_id = scheduleMonthId

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

      console.log('④ Supabase Schedule Success Data:\n' + JSON.stringify(data, null, 2))
      return successResult(ScheduleMapper.weekToModel(data as ScheduleWeekRow))
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
      const dbRows = schedules.map(s => ScheduleMapper.modelToWeekDbRow(s))
      console.log('🚀 [SupabaseScheduleRepository.bulkSaveSchedules] UPSERT Payload:', JSON.stringify(dbRows, null, 2))
      const { data, error } = await supabase
        .from(this.tableName)
        .upsert(dbRows)
        .select('*')

      if (error) {
        return errorResult(error, this.tableName, 'bulkSaveSchedules')
      }
      const rows = (data || []) as ScheduleWeekRow[]
      const models = rows.map(row => ScheduleMapper.weekToModel(row))
      return successResult(models)
    } catch (err: unknown) {
      return errorResult(err, this.tableName, 'bulkSaveSchedules')
    }
  }

  async deleteSchedule(id: string): Promise<RepositoryResult<boolean>> {
    try {
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
