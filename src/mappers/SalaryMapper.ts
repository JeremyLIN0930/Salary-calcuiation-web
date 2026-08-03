/**
 * SalaryMapper.ts
 * Maps between React Employee Salary Model and Supabase SalaryMonthRow.
 * Strictly validates UUIDs to avoid "invalid input syntax for type uuid".
 */

import { Employee, createEmptyEmployee } from '../types/employee'
import { SalaryMonthRow } from '../types/database'
import { DEFAULT_COMPANY_ID, isValidUuid } from './EmployeeMapper'

export class SalaryMapper {
  static toModel(row: SalaryMonthRow): Employee {
    const base = createEmptyEmployee()
    const yearMonth = row.month ? String(row.month) : new Date().toISOString().slice(0, 7)
    return {
      ...base,
      id: row.id || '',
      name: row.notes || '未命名員工',
      month: yearMonth,
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || new Date().toISOString(),
    }
  }

  static toDbRow(model: Partial<Employee>): SalaryMonthRow {
    const now = new Date().toISOString()
    const monthStr = model.month || new Date().toISOString().slice(0, 7)
    const yearVal = parseInt(monthStr.slice(0, 4), 10) || new Date().getFullYear()

    const row: SalaryMonthRow = {
      company_id: DEFAULT_COMPANY_ID,
      month: monthStr,
      year: yearVal,
      notes: model.name || '',
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
