/**
 * EmployeeMapper.ts
 * Maps between React MasterEmployee Model and Supabase master_employees DB Row.
 */

import { MasterEmployee } from '../types/masterEmployee'

export interface MasterEmployeeDbRow {
  id: string
  employee_no?: string | null
  name: string
  store_id?: string | null
  company_id?: string | null
  hire_date?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  notes?: string | null
  is_active?: boolean | null
  created_at?: string | null
  updated_at?: string | null
}

export class EmployeeMapper {
  static toModel(row: MasterEmployeeDbRow): MasterEmployee {
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

  static toDbRow(model: Partial<MasterEmployee>): MasterEmployeeDbRow {
    const now = new Date().toISOString()
    const row: MasterEmployeeDbRow = {
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
