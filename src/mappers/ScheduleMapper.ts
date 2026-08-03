/**
 * ScheduleMapper.ts
 * Maps between React Schedule Model and Supabase ScheduleWeekRow / ScheduleShiftRow.
 * Strictly validates UUIDs to avoid "invalid input syntax for type uuid".
 */

import { Schedule } from '../types/schedule'
import { ScheduleWeekRow, ScheduleShiftRow } from '../types/database'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isValidUuid(val?: string | null): boolean {
  return typeof val === 'string' && UUID_REGEX.test(val)
}

export class ScheduleMapper {
  static weekToModel(row: ScheduleWeekRow): Schedule {
    return {
      id: row.id || '',
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

  static modelToWeekDbRow(model: Partial<Schedule>): ScheduleWeekRow {
    const now = new Date().toISOString()
    const row: ScheduleWeekRow = {
      start_date: model.weekStart || new Date().toISOString().slice(0, 10),
      end_date: model.weekEnd || new Date().toISOString().slice(0, 10),
      notes: model.storeName || model.remark || '慶東門市',
      updated_at: model.updatedAt || now,
    }

    if (isValidUuid(model.id)) {
      row.id = model.id!
    }

    if (model.createdAt) {
      row.created_at = model.createdAt
    }

    return row
  }
}
