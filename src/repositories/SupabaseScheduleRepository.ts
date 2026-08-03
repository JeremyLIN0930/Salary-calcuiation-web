import { supabase } from '../lib/supabase'
import { Schedule } from '../types/schedule'
import { RepositoryResult, successResult, errorResult } from './base.repository'

export class SupabaseScheduleRepository {
  private tableName = 'schedules'

  async getMonths(): Promise<RepositoryResult<string[]>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('weekStart')

      if (error) return errorResult(error)
      const months = Array.from(
        new Set((data || []).map((item: { weekStart: string }) => item.weekStart.slice(0, 7)))
      ).sort().reverse()
      return successResult(months)
    } catch (err) {
      return errorResult(err)
    }
  }

  async createMonth(monthKey: string): Promise<RepositoryResult<string>> {
    try {
      return successResult(monthKey)
    } catch (err) {
      return errorResult(err)
    }
  }

  async deleteMonth(monthKey: string): Promise<RepositoryResult<boolean>> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .gte('weekStart', `${monthKey}-01`)
        .lte('weekStart', `${monthKey}-31`)

      if (error) return errorResult(error)
      return successResult(true)
    } catch (err) {
      return errorResult(err)
    }
  }

  async getWeeks(monthKey?: string): Promise<RepositoryResult<Schedule[]>> {
    try {
      let query = supabase.from(this.tableName).select('*')

      if (monthKey) {
        query = query.gte('weekStart', `${monthKey}-01`).lte('weekStart', `${monthKey}-31`)
      }

      const { data, error } = await query.order('weekStart', { ascending: false })

      if (error) return errorResult(error)
      return successResult((data as Schedule[]) || [])
    } catch (err) {
      return errorResult(err)
    }
  }

  async saveWeek(weekData: Partial<Schedule>): Promise<RepositoryResult<Schedule>> {
    return this.saveSchedule(weekData)
  }

  async getSchedule(id: string): Promise<RepositoryResult<Schedule>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single()

      if (error) return errorResult(error)
      return successResult(data as Schedule)
    } catch (err) {
      return errorResult(err)
    }
  }

  async saveSchedule(schedule: Partial<Schedule>): Promise<RepositoryResult<Schedule>> {
    try {
      const now = new Date().toISOString()
      const record = {
        id: schedule.id || Math.random().toString(36).slice(2),
        updatedAt: now,
        ...schedule,
      }

      const { data, error } = await supabase
        .from(this.tableName)
        .upsert([record])
        .select()
        .single()

      if (error) return errorResult(error)
      return successResult(data as Schedule)
    } catch (err) {
      return errorResult(err)
    }
  }

  async deleteSchedule(id: string): Promise<RepositoryResult<boolean>> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id)

      if (error) return errorResult(error)
      return successResult(true)
    } catch (err) {
      return errorResult(err)
    }
  }
}

export const supabaseScheduleRepository = new SupabaseScheduleRepository()
