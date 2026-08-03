import { supabase } from '../lib/supabase'
import { Employee } from '../types/employee'
import { SalaryMonthRow, SalaryItemTypeRow } from '../types/database'
import { SalaryMapper } from '../mappers/SalaryMapper'
import { RepositoryResult, successResult, errorResult } from './base.repository'

export interface SalaryItemType {
  id: string
  name: string
  category: 'addition' | 'deduction'
}

export class SupabaseSalaryRepository {
  private tableName = 'salary_months'

  async getMonths(): Promise<RepositoryResult<string[]>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('month')

      if (error) {
        return errorResult(error, this.tableName, 'getMonths')
      }
      const rows = (data || []) as { month: string }[]
      const months = Array.from(new Set(rows.map(item => item.month))).sort().reverse()
      return successResult(months)
    } catch (err: unknown) {
      return errorResult(err, this.tableName, 'getMonths')
    }
  }

  async createMonth(monthKey: string): Promise<RepositoryResult<string>> {
    try {
      const dbRow: SalaryMonthRow = {
        id: Math.random().toString(36).slice(2),
        month: monthKey,
        year: parseInt(monthKey.slice(0, 4), 10) || new Date().getFullYear(),
        notes: monthKey,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      const { error } = await supabase.from(this.tableName).insert([dbRow])
      if (error) {
        return errorResult(error, this.tableName, 'createMonth')
      }
      return successResult(monthKey)
    } catch (err: unknown) {
      return errorResult(err, this.tableName, 'createMonth')
    }
  }

  async updateMonth(oldMonthKey: string, newMonthKey: string): Promise<RepositoryResult<boolean>> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .update({ month: newMonthKey, updated_at: new Date().toISOString() })
        .eq('month', oldMonthKey)

      if (error) {
        return errorResult(error, this.tableName, 'updateMonth')
      }
      return successResult(true)
    } catch (err: unknown) {
      return errorResult(err, this.tableName, 'updateMonth')
    }
  }

  async deleteMonth(monthKey: string): Promise<RepositoryResult<boolean>> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('month', monthKey)

      if (error) {
        return errorResult(error, this.tableName, 'deleteMonth')
      }
      return successResult(true)
    } catch (err: unknown) {
      return errorResult(err, this.tableName, 'deleteMonth')
    }
  }

  async getSalaryRecords(monthKey?: string): Promise<RepositoryResult<Employee[]>> {
    try {
      let query = supabase.from(this.tableName).select('*')
      if (monthKey) {
        query = query.eq('month', monthKey)
      }
      const { data, error } = await query.order('updated_at', { ascending: false })

      if (error) {
        return errorResult(error, this.tableName, 'getSalaryRecords')
      }
      const rows = (data || []) as SalaryMonthRow[]
      const models = rows.map(row => SalaryMapper.toModel(row))
      return successResult(models)
    } catch (err: unknown) {
      return errorResult(err, this.tableName, 'getSalaryRecords')
    }
  }

  async getEmployees(monthKey: string): Promise<RepositoryResult<Employee[]>> {
    return this.getSalaryRecords(monthKey)
  }

  async saveSalary(salaryData: Partial<Employee>): Promise<RepositoryResult<Employee>> {
    try {
      const dbRow = SalaryMapper.toDbRow(salaryData)
      const { data, error } = await supabase
        .from(this.tableName)
        .upsert([dbRow])
        .select('*')
        .single()

      if (error) {
        return errorResult(error, this.tableName, 'saveSalary')
      }
      return successResult(SalaryMapper.toModel(data as SalaryMonthRow))
    } catch (err: unknown) {
      return errorResult(err, this.tableName, 'saveSalary')
    }
  }

  async deleteSalary(id: string): Promise<RepositoryResult<boolean>> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id)

      if (error) {
        return errorResult(error, this.tableName, 'deleteSalary')
      }
      return successResult(true)
    } catch (err: unknown) {
      return errorResult(err, this.tableName, 'deleteSalary')
    }
  }

  async getSalaryItemTypes(): Promise<RepositoryResult<SalaryItemType[]>> {
    try {
      const { data, error } = await supabase
        .from('salary_item_types')
        .select('*')
        .order('updated_at', { ascending: false })

      if (error) {
        return errorResult(error, 'salary_item_types', 'getSalaryItemTypes')
      }
      const rows = (data || []) as SalaryItemTypeRow[]
      const itemTypes: SalaryItemType[] = rows.map(row => ({
        id: row.id,
        name: row.item_name || row.item_code || '',
        category: (row.category === 'deduction' ? 'deduction' : 'addition') as 'addition' | 'deduction',
      }))
      return successResult(itemTypes)
    } catch (err: unknown) {
      return errorResult(err, 'salary_item_types', 'getSalaryItemTypes')
    }
  }
}

export const supabaseSalaryRepository = new SupabaseSalaryRepository()
