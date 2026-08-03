/**
 * EmployeeMapper.ts
 * Maps between React MasterEmployee Model and Supabase MasterEmployeeRow.
 * Converts store_id UUID -> store_name for UI display.
 */

import { MasterEmployee } from '../types/masterEmployee'
import { MasterEmployeeRow } from '../types/database'

export const DEFAULT_COMPANY_ID = '0553618d-1d44-4f24-b6d8-7981fd4c6427'
export const DEFAULT_STORE_ID   = 'b357ddf1-7024-4a0a-8aa0-66c62214dbeb'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isValidUuid(val?: string | null): boolean {
  return typeof val === 'string' && UUID_REGEX.test(val)
}

const STORE_NAME_MAP: Record<string, string> = {
  [DEFAULT_STORE_ID]: '總店',
}

export class EmployeeMapper {
  static toModel(row: MasterEmployeeRow): MasterEmployee {
    console.log("Before Mapping", row)

    let resolvedStoreName = row.stores?.store_name || ''
    if (!resolvedStoreName && row.store_id) {
      resolvedStoreName = STORE_NAME_MAP[row.store_id] || (isValidUuid(row.store_id) ? '總店' : row.store_id)
    }
    if (!resolvedStoreName) {
      resolvedStoreName = '總店'
    }

    const employee: MasterEmployee = {
      id: row.id || '',
      name: row.name || '',
      store: resolvedStoreName,
      hireDate: row.hire_date || '',
      remark: row.notes || '',
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || new Date().toISOString(),
    }

    console.log("After Mapping", employee)
    return employee
  }

  static toDbRow(model: Partial<MasterEmployee>): MasterEmployeeRow {
    const now = new Date().toISOString()
    const row: MasterEmployeeRow = {
      name: model.name || '',
      company_id: DEFAULT_COMPANY_ID,
      store_id: isValidUuid(model.store) ? model.store! : DEFAULT_STORE_ID,
      hire_date: model.hireDate || null,
      notes: model.remark || null,
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
