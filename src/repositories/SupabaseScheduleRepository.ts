import { supabase } from '../lib/supabase'
import { Schedule } from '../types/schedule'
import { ScheduleWeekRow } from '../types/database'
import { ScheduleMapper } from '../mappers/ScheduleMapper'
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
      const dbRow = ScheduleMapper.modelToWeekDbRow(schedule)
      console.log('🚀 [SupabaseScheduleRepository.saveSchedule] UPSERT Payload:', JSON.stringify(dbRow, null, 2))
      const { data, error } = await supabase
        .from(this.tableName)
        .upsert([dbRow])
        .select('*')
        .single()

      if (error) {
        return errorResult(error, this.tableName, 'saveSchedule')
      }
      return successResult(ScheduleMapper.weekToModel(data as ScheduleWeekRow))
    } catch (err: unknown) {
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
