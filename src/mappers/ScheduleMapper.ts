/**
 * ScheduleMapper.ts
 * Maps between React Schedule Model and Supabase ScheduleWeekRow.
 * notes column ONLY stores schedule.remark (text) or null.
 * Does NOT write full JSON object into notes.
 */

import { Schedule } from '../types/schedule'
import { ScheduleWeekRow } from '../types/database'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isValidUuid(val?: string | null): boolean {
  return typeof val === 'string' && UUID_REGEX.test(val)
}

export class ScheduleMapper {
  static weekToModel(row: ScheduleWeekRow): Schedule {
    let remarkVal = ''
    if (row.notes) {
      try {
        const parsed = JSON.parse(row.notes)
        remarkVal = parsed.remark || row.notes
      } catch {
        remarkVal = row.notes
      }
    }

    return {
      id: row.id || '',
      storeId: 'b357ddf1-7024-4a0a-8aa0-66c62214dbeb',
      storeName: '慶東門市',
      weekStart: row.start_date || new Date().toISOString().slice(0, 10),
      weekEnd: row.end_date || new Date().toISOString().slice(0, 10),
      employees: [],
      remark: remarkVal,
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || new Date().toISOString(),
    }
  }

  static modelToWeekDbRow(model: Partial<Schedule>): ScheduleWeekRow {
    const now = new Date().toISOString()
    const startDate = model.weekStart || new Date().toISOString().slice(0, 10)
    const endDate   = model.weekEnd   || new Date().toISOString().slice(0, 10)

    const dayOfMonth = parseInt(startDate.slice(8, 10), 10) || 1
    const weekNo = Math.min(Math.ceil(dayOfMonth / 7), 5)

    // notes should only store schedule.remark or null
    const remarkClean = model.remark && typeof model.remark === 'string' && model.remark.trim() !== ''
      ? model.remark.trim()
      : null

    const row: ScheduleWeekRow = {
      week_no: weekNo,
      start_date: startDate,
      end_date: endDate,
      notes: remarkClean,
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
