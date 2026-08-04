/**
 * EmployeeMapper.ts
 * Maps between React MasterEmployee Model and Supabase MasterEmployeeRow.
 * Converts store_id UUID ↔ store_name.
 * Cleans empty strings to null for optional database columns (hire_date, notes).
 */

import { MasterEmployee } from '../types/masterEmployee'
import { MasterEmployeeRow } from '../types/database'

export const DEFAULT_COMPANY_ID = '0553618d-1d44-4f24-b6d8-7981fd4c6427' // 預設公司 UUID
export const DEFAULT_STORE_ID   = 'b357ddf1-7024-4a0a-8aa0-66c62214dbeb' // 慶東門市 (001) UUID
export const NAN_YI_STORE_ID    = 'c468eee2-8135-5b1b-9bb1-77d73325ecef' // 南醫門市 (002) UUID

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isValidUuid(val?: string | null): boolean {
  return typeof val === 'string' && UUID_REGEX.test(val)
}

const STORE_NAME_MAP: Record<string, string> = {
  [DEFAULT_STORE_ID]: '慶東門市',
  [NAN_YI_STORE_ID]:  '南醫門市',
}

import { stripSystemTags } from '../utils/textUtils'

export class EmployeeMapper {
  static toModel(row: MasterEmployeeRow): MasterEmployee {
    let resolvedStoreName = row.stores?.store_name || ''
    if ((!resolvedStoreName || resolvedStoreName === '總店') && row.store_id) {
      resolvedStoreName = STORE_NAME_MAP[row.store_id] || (isValidUuid(row.store_id) ? '慶東門市' : row.store_id)
    }
    if (!resolvedStoreName || resolvedStoreName === '總店') {
      resolvedStoreName = '慶東門市'
    }

    // Determine if shared employee
    const isSharedVal = (row as any).is_shared !== undefined
      ? Boolean((row as any).is_shared)
      : (!row.store_id || row.notes?.includes('[shared]'))

    const employee: MasterEmployee = {
      id: row.id || '',
      name: row.name || '',
      store: resolvedStoreName,
      storeId: row.store_id || undefined,
      storeName: resolvedStoreName,
      isShared: isSharedVal,
      hireDate: row.hire_date || '',
      remark: stripSystemTags(row.notes),
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || new Date().toISOString(),
    }

    return employee
  }

  static toDbRow(model: Partial<MasterEmployee>): MasterEmployeeRow {
    const now = new Date().toISOString()

    // Determine target store_id UUID
    let targetStoreId: string | null = null
    if (isValidUuid(model.storeId)) {
      targetStoreId = model.storeId!
    } else if (isValidUuid(model.store)) {
      targetStoreId = model.store!
    } else if (model.store === '南醫門市') {
      targetStoreId = NAN_YI_STORE_ID
    } else {
      targetStoreId = DEFAULT_STORE_ID
    }

    // Ensure valid store_id (default to DEFAULT_STORE_ID if null)
    const finalStoreId = targetStoreId || DEFAULT_STORE_ID

    // Convert empty strings "" to default string for NOT-NULL columns
    const cleanHireDate = model.hireDate && model.hireDate.trim() !== '' ? model.hireDate.trim() : now.slice(0, 10)
    
    // Tag notes with [shared] or [local] for scope tracking
    let cleanNotes = model.remark && model.remark.trim() !== '' ? model.remark.trim() : ''
    if (model.isShared === true && !cleanNotes.includes('[shared]')) {
      cleanNotes = (cleanNotes + ' [shared]').trim()
    } else if (model.isShared === false && !cleanNotes.includes('[local]')) {
      cleanNotes = (cleanNotes + ' [local]').trim()
    }

    const row: MasterEmployeeRow = {
      name: model.name || '',
      company_id: DEFAULT_COMPANY_ID,
      store_id: finalStoreId,
      hire_date: cleanHireDate,
      notes: cleanNotes || null,
      is_active: true,
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
