import { supabase } from '../lib/supabase'
import { Schedule } from '../types/schedule'
import { ScheduleMapper, ScheduleWeekDbRow, ScheduleShiftDbRow } from '../mappers/ScheduleMapper'
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
  private shiftTableName = 'schedule_shifts'

  async getMonths(): Promise<RepositoryResult<string[]>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('start_date')

      if (error) {
        console.error('[ScheduleRepo] DB error on getMonths:', error.message)
        return errorResult(error.message)
      }
      const months = Array.from(
        new Set((data || []).map((item: { start_date: string }) => (item.start_date || '').slice(0, 7)).filter(Boolean))
      ).sort().reverse()
      return successResult(months)
    } catch (err: any) {
      console.error('[ScheduleRepo] Exception on getMonths:', err)
      return errorResult(err.message || String(err))
    }
  }

  async createMonth(monthKey: string): Promise<RepositoryResult<string>> {
    try {
      return successResult(monthKey)
    } catch (err: any) {
      return errorResult(err.message || String(err))
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
        console.error('[ScheduleRepo] DB error on deleteMonth:', error.message)
        return errorResult(error.message)
      }
      return successResult(true)
    } catch (err: any) {
      console.error('[ScheduleRepo] Exception on deleteMonth:', err)
      return errorResult(err.message || String(err))
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
        console.error('[ScheduleRepo] DB error on getWeeks:', error.message)
        return errorResult(error.message)
      }
      const models = (data || []).map((row: ScheduleWeekDbRow) => ScheduleMapper.weekToModel(row))
      return successResult(models)
    } catch (err: any) {
      console.error('[ScheduleRepo] Exception on getWeeks:', err)
      return errorResult(err.message || String(err))
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
        console.error('[ScheduleRepo] DB error on getSchedule:', error.message)
        return errorResult(error.message)
      }
      return successResult(ScheduleMapper.weekToModel(data as ScheduleWeekDbRow))
    } catch (err: any) {
      console.error('[ScheduleRepo] Exception on getSchedule:', err)
      return errorResult(err.message || String(err))
    }
  }

  async saveSchedule(schedule: Partial<Schedule>): Promise<RepositoryResult<Schedule>> {
    try {
      const dbRow = ScheduleMapper.modelToWeekDbRow(schedule)
      const { data, error } = await supabase
        .from(this.tableName)
        .upsert([dbRow])
        .select('*')
        .single()

      if (error) {
        console.error('[ScheduleRepo] DB error on saveSchedule:', error.message)
        return errorResult(error.message)
      }
      return successResult(ScheduleMapper.weekToModel(data as ScheduleWeekDbRow))
    } catch (err: any) {
      console.error('[ScheduleRepo] Exception on saveSchedule:', err)
      return errorResult(err.message || String(err))
    }
  }

  async saveWeek(weekData: Partial<Schedule>): Promise<RepositoryResult<Schedule>> {
    return this.saveSchedule(weekData)
  }

  async bulkSaveSchedules(schedules: Partial<Schedule>[]): Promise<RepositoryResult<Schedule[]>> {
    try {
      const dbRows = schedules.map(s => ScheduleMapper.modelToWeekDbRow(s))
      const { data, error } = await supabase
        .from(this.tableName)
        .upsert(dbRows)
        .select('*')

      if (error) {
        console.error('[ScheduleRepo] DB error on bulkSaveSchedules:', error.message)
        return errorResult(error.message)
      }
      const models = (data || []).map((row: ScheduleWeekDbRow) => ScheduleMapper.weekToModel(row))
      return successResult(models)
    } catch (err: any) {
      console.error('[ScheduleRepo] Exception on bulkSaveSchedules:', err)
      return errorResult(err.message || String(err))
    }
  }

  async deleteSchedule(id: string): Promise<RepositoryResult<boolean>> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id)

      if (error) {
        console.error('[ScheduleRepo] DB error on deleteSchedule:', error.message)
        return errorResult(error.message)
      }
      return successResult(true)
    } catch (err: any) {
      console.error('[ScheduleRepo] Exception on deleteSchedule:', err)
      return errorResult(err.message || String(err))
    }
  }

  async getShiftTemplates(): Promise<RepositoryResult<ShiftTemplate[]>> {
    return successResult(DEFAULT_SHIFT_TEMPLATES)
  }
}

export const supabaseScheduleRepository = new SupabaseScheduleRepository()
