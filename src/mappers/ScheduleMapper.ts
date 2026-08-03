/**
 * ScheduleMapper.ts
 * Maps between React Schedule Model and Supabase ScheduleWeekRow.
 * Persists complete Schedule & Shifts data via notes JSON stringification.
 * Cleans empty strings and undefined fields.
 */

import { Schedule } from '../types/schedule'
import { ScheduleWeekRow } from '../types/database'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isValidUuid(val?: string | null): boolean {
  return typeof val === 'string' && UUID_REGEX.test(val)
}

export class ScheduleMapper {
  static weekToModel(row: ScheduleWeekRow): Schedule {
    let parsed: Partial<Schedule> = {}

    if (row.notes) {
      try {
        parsed = JSON.parse(row.notes)
      } catch {
        parsed = { remark: row.notes }
      }
    }

    return {
      id: row.id || parsed.id || '',
      storeId: parsed.storeId || 'b357ddf1-7024-4a0a-8aa0-66c62214dbeb',
      storeName: parsed.storeName || '慶東門市',
      weekStart: row.start_date || parsed.weekStart || new Date().toISOString().slice(0, 10),
      weekEnd: row.end_date || parsed.weekEnd || new Date().toISOString().slice(0, 10),
      employees: parsed.employees || [],
      remark: parsed.remark || row.notes || '',
      createdAt: row.created_at || parsed.createdAt || new Date().toISOString(),
      updatedAt: row.updated_at || parsed.updatedAt || new Date().toISOString(),
    }
  }

  static modelToWeekDbRow(model: Partial<Schedule>): ScheduleWeekRow {
    const now = new Date().toISOString()
    const startDate = model.weekStart || new Date().toISOString().slice(0, 10)
    const endDate   = model.weekEnd   || new Date().toISOString().slice(0, 10)

    // Omit empty strings and undefined before JSON serialization
    const cleanPayload: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(model)) {
      if (val === undefined || val === null || val === '') continue
      cleanPayload[key] = val
    }

    const row: ScheduleWeekRow = {
      start_date: startDate,
      end_date: endDate,
      notes: JSON.stringify(cleanPayload),
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
