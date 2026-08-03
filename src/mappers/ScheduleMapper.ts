/**
 * ScheduleMapper.ts
 * Maps between React Schedule Model and Supabase schedule_weeks / schedule_shifts DB Rows.
 */

import { Schedule } from '../types/schedule'

export interface ScheduleWeekDbRow {
  id: string
  start_date?: string | null
  end_date?: string | null
  notes?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface ScheduleShiftDbRow {
  id: string
  employee_id?: string | null
  shift_type?: string | null
  start_time?: string | null
  end_time?: string | null
  remarks?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export class ScheduleMapper {
  static weekToModel(row: ScheduleWeekDbRow): Schedule {
    return {
      id: row.id,
      storeId: '101',
      storeName: row.notes || '慶東門市',
      weekStart: row.start_date || new Date().toISOString().slice(0, 10),
      weekEnd: row.end_date || new Date().toISOString().slice(0, 10),
      employees: [],
      remark: row.notes || '',
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || new Date().toISOString(),
    }
  }

  static modelToWeekDbRow(model: Partial<Schedule>): ScheduleWeekDbRow {
    const now = new Date().toISOString()
    const row: ScheduleWeekDbRow = {
      id: model.id || Math.random().toString(36).slice(2),
      start_date: model.weekStart || new Date().toISOString().slice(0, 10),
      end_date: model.weekEnd || new Date().toISOString().slice(0, 10),
      notes: model.storeName || model.remark || '慶東門市',
      updated_at: model.updatedAt || now,
    }
    if (model.createdAt) {
      row.created_at = model.createdAt
    }
    return row
  }
}
