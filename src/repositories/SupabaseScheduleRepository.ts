import { supabase } from '../lib/supabase'
import { Schedule } from '../types/schedule'
import { RepositoryResult, successResult, errorResult } from './base.repository'

// ── Taipei timezone helper ────────────────────────────────────────────────────
function nowTaipei(): string {
  return new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Taipei' }).replace(' ', 'T')
}

// ── ShiftTemplate type ────────────────────────────────────────────────────────
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

// ── Repository ────────────────────────────────────────────────────────────────
export class SupabaseScheduleRepository {
  private tableName = 'schedules'
  private templateTable = 'shift_templates'

  // ── Months ──────────────────────────────────────────────────────────────────

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

  // ── Weeks / Schedules ────────────────────────────────────────────────────────

  async getWeeks(monthKey?: string): Promise<RepositoryResult<Schedule[]>> {
    try {
      let query = supabase.from(this.tableName).select('*')

      if (monthKey) {
        query = query
          .gte('weekStart', `${monthKey}-01`)
          .lte('weekStart', `${monthKey}-31`)
      }

      const { data, error } = await query.order('weekStart', { ascending: true })

      if (error) return errorResult(error)
      return successResult((data as Schedule[]) || [])
    } catch (err) {
      return errorResult(err)
    }
  }

  /** Alias used by ScheduleContext for initial load (all schedules) */
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

      if (error) return errorResult(error)
      return successResult(data as Schedule)
    } catch (err) {
      return errorResult(err)
    }
  }

  async saveSchedule(schedule: Partial<Schedule>): Promise<RepositoryResult<Schedule>> {
    try {
      const now = nowTaipei()
      const record = {
        id: schedule.id || Math.random().toString(36).slice(2),
        updatedAt: now,
        createdAt: schedule.createdAt || now,
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

  /** Alias for saveSchedule */
  async saveWeek(weekData: Partial<Schedule>): Promise<RepositoryResult<Schedule>> {
    return this.saveSchedule(weekData)
  }

  /** Upsert multiple schedules in one batch */
  async bulkSaveSchedules(schedules: Partial<Schedule>[]): Promise<RepositoryResult<Schedule[]>> {
    try {
      const now = nowTaipei()
      const records = schedules.map(s => ({
        id: s.id || Math.random().toString(36).slice(2),
        updatedAt: now,
        createdAt: s.createdAt || now,
        ...s,
      }))

      const { data, error } = await supabase
        .from(this.tableName)
        .upsert(records)
        .select()

      if (error) return errorResult(error)
      return successResult((data as Schedule[]) || [])
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

  // ── Duplicate / Copy ─────────────────────────────────────────────────────────

  /**
   * duplicateWeek: copies a week's schedule to a new weekStart/weekEnd.
   * All shifts are re-dated to match the new week offset.
   */
  async duplicateWeek(sourceScheduleId: string, newWeekStart: string, newWeekEnd: string): Promise<RepositoryResult<Schedule>> {
    try {
      const sourceRes = await this.getSchedule(sourceScheduleId)
      if (!sourceRes.success || !sourceRes.data) {
        return errorResult(sourceRes.error || '找不到來源週排班')
      }

      const source = sourceRes.data
      const srcStart = new Date(source.weekStart)
      const tgtStart = new Date(newWeekStart)

      const copiedEmployees = source.employees.map(emp => ({
        id: Math.random().toString(36).slice(2),
        name: emp.name,
        shifts: emp.shifts.map(shift => {
          const shiftDate = new Date(shift.date)
          const dayOffset = Math.round((shiftDate.getTime() - srcStart.getTime()) / (1000 * 3600 * 24))
          const newDate = new Date(tgtStart)
          newDate.setDate(tgtStart.getDate() + dayOffset)
          return { ...shift, date: newDate.toISOString().slice(0, 10) }
        }),
      }))

      const now = nowTaipei()
      const newSchedule: Schedule = {
        id: Math.random().toString(36).slice(2),
        storeId: source.storeId,
        storeName: source.storeName,
        weekStart: newWeekStart,
        weekEnd: newWeekEnd,
        employees: copiedEmployees,
        remark: `（複製自 ${source.weekStart} 週）`,
        createdAt: now,
        updatedAt: now,
      }

      return this.saveSchedule(newSchedule)
    } catch (err) {
      return errorResult(err)
    }
  }

  /**
   * duplicateMonth: copies all weeks from one month to another month.
   */
  async duplicateMonth(fromMonthKey: string, toMonthKey: string): Promise<RepositoryResult<Schedule[]>> {
    try {
      const srcRes = await this.getWeeks(fromMonthKey)
      if (!srcRes.success || !srcRes.data) {
        return errorResult(srcRes.error || '找不到來源月份排班')
      }

      const srcWeeks = srcRes.data
      const [fromYear, fromMonth] = fromMonthKey.split('-').map(Number)
      const [toYear, toMonth]     = toMonthKey.split('-').map(Number)

      const now = nowTaipei()
      const newSchedules: Schedule[] = srcWeeks.map(week => {
        const srcStart = new Date(week.weekStart)
        // Shift the date to the new month, keeping relative day offset within month
        const dayInMonth = srcStart.getDate()
        const newStart = new Date(toYear, toMonth - 1, dayInMonth)
        const newEnd = new Date(newStart)
        newEnd.setDate(newStart.getDate() + 6)

        const newWeekStart = newStart.toISOString().slice(0, 10)
        const newWeekEnd   = newEnd.toISOString().slice(0, 10)

        const copiedEmployees = week.employees.map(emp => ({
          id: Math.random().toString(36).slice(2),
          name: emp.name,
          shifts: emp.shifts.map(shift => {
            const sd = new Date(shift.date)
            const dayOffset = Math.round((sd.getTime() - srcStart.getTime()) / (1000 * 3600 * 24))
            const targetDate = new Date(newStart)
            targetDate.setDate(newStart.getDate() + dayOffset)
            return { ...shift, date: targetDate.toISOString().slice(0, 10) }
          }),
        }))

        return {
          id: Math.random().toString(36).slice(2),
          storeId: week.storeId,
          storeName: week.storeName,
          weekStart: newWeekStart,
          weekEnd: newWeekEnd,
          employees: copiedEmployees,
          remark: `（複製自 ${fromMonthKey}）`,
          createdAt: now,
          updatedAt: now,
        }
      })

      const result = await this.bulkSaveSchedules(newSchedules)
      return result
    } catch (err) {
      return errorResult(err)
    }
  }

  /**
   * copyLastWeek: finds the most recent schedule before `currentScheduleId`
   * and copies its employees + shifts (dates re-mapped) into the current schedule.
   */
  async copyLastWeek(currentScheduleId: string, allSchedules: Schedule[]): Promise<RepositoryResult<Schedule>> {
    try {
      const current = allSchedules.find(s => s.id === currentScheduleId)
      if (!current) return errorResult('找不到目前週排班')

      const older = allSchedules
        .filter(s => s.id !== currentScheduleId && s.weekStart < current.weekStart)
        .sort((a, b) => b.weekStart.localeCompare(a.weekStart))

      if (older.length === 0) return errorResult('找不到更早的週排班可供複製')

      const prev = older[0]
      const prevStart = new Date(prev.weekStart)
      const currStart = new Date(current.weekStart)

      const copiedEmployees = prev.employees.map(emp => ({
        id: Math.random().toString(36).slice(2),
        name: emp.name,
        shifts: emp.shifts.map(shift => {
          const sd = new Date(shift.date)
          const dayOffset = Math.round((sd.getTime() - prevStart.getTime()) / (1000 * 3600 * 24))
          const targetDate = new Date(currStart)
          targetDate.setDate(currStart.getDate() + dayOffset)
          return { ...shift, date: targetDate.toISOString().slice(0, 10) }
        }),
      }))

      const updated: Schedule = {
        ...current,
        employees: copiedEmployees,
        updatedAt: nowTaipei(),
      }

      return this.saveSchedule(updated)
    } catch (err) {
      return errorResult(err)
    }
  }

  // ── Shift Templates ──────────────────────────────────────────────────────────

  async getShiftTemplates(): Promise<RepositoryResult<ShiftTemplate[]>> {
    try {
      const { data, error } = await supabase
        .from(this.templateTable)
        .select('*')
        .order('id', { ascending: true })

      if (error || !data || data.length === 0) {
        // Fallback to defaults if table not created yet or empty
        return successResult(DEFAULT_SHIFT_TEMPLATES)
      }
      return successResult(data as ShiftTemplate[])
    } catch (err) {
      // Fallback to defaults on any network error
      return successResult(DEFAULT_SHIFT_TEMPLATES)
    }
  }

  async saveShiftTemplate(template: Partial<ShiftTemplate>): Promise<RepositoryResult<ShiftTemplate>> {
    try {
      const record = {
        id: template.id || Math.random().toString(36).slice(2),
        ...template,
      }

      const { data, error } = await supabase
        .from(this.templateTable)
        .upsert([record])
        .select()
        .single()

      if (error) return errorResult(error)
      return successResult(data as ShiftTemplate)
    } catch (err) {
      return errorResult(err)
    }
  }

  // ── Pagination & Search ──────────────────────────────────────────────────────

  async searchSchedules(keyword: string, limit = 50, offset = 0): Promise<RepositoryResult<Schedule[]>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .or(`storeName.ilike.%${keyword}%,storeId.ilike.%${keyword}%`)
        .order('weekStart', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) return errorResult(error)
      return successResult((data as Schedule[]) || [])
    } catch (err) {
      return errorResult(err)
    }
  }

  async getSchedulesPaged(limit = 50, offset = 0): Promise<RepositoryResult<Schedule[]>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .order('weekStart', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) return errorResult(error)
      return successResult((data as Schedule[]) || [])
    } catch (err) {
      return errorResult(err)
    }
  }
}

export const supabaseScheduleRepository = new SupabaseScheduleRepository()
