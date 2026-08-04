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
    let parsed: any = {}
    if (row.notes) {
      const trimmed = row.notes.trim()
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        try {
          parsed = JSON.parse(trimmed)
          remarkVal = typeof parsed.remark === 'string' ? parsed.remark : ''
        } catch {
          remarkVal = ''
        }
      } else {
        remarkVal = row.notes
      }
    }

    const storeName = parsed.storeName || (row as any).stores?.store_name || '慶東門市'
    const storeCode = parsed.storeCode || (row as any).stores?.store_code || (storeName.includes('南醫') ? '002' : '001')
    const storeId = parsed.storeId || (row as any).store_id || (storeCode === '002' ? 'c468eee2-8135-5b1b-9bb1-77d73325ecef' : 'b357ddf1-7024-4a0a-8aa0-66c62214dbeb')

    const startDateVal = row.start_date || parsed.weekStart || new Date().toISOString().slice(0, 10)
    const dayOfMonth = parseInt(startDateVal.slice(8, 10), 10) || 1
    const computedWeekNo = row.week_no || parsed.weekNo || Math.min(Math.ceil(dayOfMonth / 7), 5)

    return {
      id: row.id || parsed.id || '',
      storeId,
      storeCode,
      storeName,
      weekStart: startDateVal,
      weekEnd: row.end_date || parsed.weekEnd || new Date().toISOString().slice(0, 10),
      weekNo: computedWeekNo,
      employees: [],
      remark: remarkVal,
      createdAt: row.created_at || parsed.createdAt || new Date().toISOString(),
      updatedAt: row.updated_at || parsed.updatedAt || new Date().toISOString(),
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
