/**
 * SalaryMapper.ts
 * Maps between React Employee Salary Model and Supabase SalaryMonthRow.
 * Converts month string "YYYY-MM" ↔ smallint month (1-12) for Supabase PostgreSQL schema.
 * Persists complete Employee Salary data via notes JSON stringification.
 * Cleans empty strings to null or omits undefined fields.
 */

import { Employee, createEmptyEmployee } from '../types/employee'
import { SalaryMonthRow } from '../types/database'
import { DEFAULT_COMPANY_ID, isValidUuid } from './EmployeeMapper'

export class SalaryMapper {
  static toModel(row: SalaryMonthRow): Employee {
    const base = createEmptyEmployee()
    let parsed: Partial<Employee> = {}

    if (row.notes) {
      try {
        parsed = JSON.parse(row.notes)
      } catch {
        parsed = { name: row.notes }
      }
    }

    const yearVal = row.year || (parsed.month ? parseInt(String(parsed.month).slice(0, 4), 10) : new Date().getFullYear())
    const monthNum = typeof row.month === 'number' ? row.month : (row.month ? parseInt(String(row.month).slice(5, 7), 10) : (parsed.month ? parseInt(String(parsed.month).slice(5, 7), 10) : 8))
    const formattedMonth = `${yearVal}-${String(monthNum).padStart(2, '0')}`

    return {
      ...base,
      ...parsed,
      id: row.id || parsed.id || base.id,
      name: parsed.name || row.notes || '未命名員工',
      month: formattedMonth,
      createdAt: row.created_at || parsed.createdAt || new Date().toISOString(),
      updatedAt: row.updated_at || parsed.updatedAt || new Date().toISOString(),
    }
  }

  static toDbRow(model: Partial<Employee>): SalaryMonthRow {
    const now = new Date().toISOString()
    const monthStr = model.month || new Date().toISOString().slice(0, 7)
    const yearVal  = parseInt(monthStr.slice(0, 4), 10) || new Date().getFullYear()
    const monthNum = parseInt(monthStr.slice(5, 7), 10) || 8

    // Convert empty strings "" to null or omit undefined
    const cleanPayload: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(model)) {
      if (val === undefined || val === null) continue
      if (typeof val === 'string' && val.trim() === '') {
        cleanPayload[key] = null
      } else {
        cleanPayload[key] = val
      }
    }

    const row: SalaryMonthRow = {
      company_id: DEFAULT_COMPANY_ID,
      month: monthNum as any, // Supabase schema requires smallint (1-12)
      year: yearVal,
      notes: JSON.stringify(cleanPayload),
      status: 'active',
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
