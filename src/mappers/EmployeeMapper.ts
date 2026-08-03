/**
 * EmployeeMapper.ts
 * Maps between React MasterEmployee Model and Supabase MasterEmployeeRow.
 */

import { MasterEmployee } from '../types/masterEmployee'
import { MasterEmployeeRow } from '../types/database'

export class EmployeeMapper {
  static toModel(row: MasterEmployeeRow): MasterEmployee {
    return {
      id: row.id,
      name: row.name || '',
      store: row.store_id || '慶東門市',
      hireDate: row.hire_date || '',
      remark: row.notes || '',
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || new Date().toISOString(),
    }
  }

  static toDbRow(model: Partial<MasterEmployee>): MasterEmployeeRow {
    const now = new Date().toISOString()
    const row: MasterEmployeeRow = {
      id: model.id || Math.random().toString(36).slice(2),
      name: model.name || '',
      store_id: model.store || null,
      hire_date: model.hireDate || null,
      notes: model.remark || null,
      is_active: true,
      updated_at: model.updatedAt || now,
    }
    if (model.createdAt) {
      row.created_at = model.createdAt
    }
    return row
  }
}
