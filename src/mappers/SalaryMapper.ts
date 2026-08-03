/**
 * SalaryMapper.ts
 * Maps between React Employee Salary Model and Supabase salary_months DB Row.
 */

import { Employee, createEmptyEmployee } from '../types/employee'

export interface SalaryMonthDbRow {
  id: string
  company_id?: string | null
  month: string
  year?: number | null
  notes?: string | null
  status?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export class SalaryMapper {
  static toModel(row: SalaryMonthDbRow): Employee {
    const base = createEmptyEmployee()
    const yearMonth = row.month || new Date().toISOString().slice(0, 7)
    return {
      ...base,
      id: row.id,
      name: row.notes || '未命名員工',
      month: yearMonth,
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || new Date().toISOString(),
    }
  }

  static toDbRow(model: Partial<Employee>): SalaryMonthDbRow {
    const now = new Date().toISOString()
    const monthStr = model.month || new Date().toISOString().slice(0, 7)
    const yearVal = parseInt(monthStr.slice(0, 4), 10) || new Date().getFullYear()

    const row: SalaryMonthDbRow = {
      id: model.id || Math.random().toString(36).slice(2),
      month: monthStr,
      year: yearVal,
      notes: model.name || '',
      status: 'active',
      updated_at: model.updatedAt || now,
    }
    if (model.createdAt) {
      row.created_at = model.createdAt
    }
    return row
  }
}
