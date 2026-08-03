import { supabase } from '../lib/supabase'
import { Employee } from '../types/employee'
import { SalaryMapper, SalaryMonthDbRow } from '../mappers/SalaryMapper'
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
        console.error('[SalaryRepo] DB error on getMonths:', error.message)
        return errorResult(error.message)
      }
      const months = Array.from(new Set((data || []).map((item: { month: string }) => item.month))).sort().reverse()
      return successResult(months)
    } catch (err: any) {
      console.error('[SalaryRepo] Exception on getMonths:', err)
      return errorResult(err.message || String(err))
    }
  }

  async createMonth(monthKey: string): Promise<RepositoryResult<string>> {
    try {
      const dbRow: SalaryMonthDbRow = {
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
        console.error('[SalaryRepo] DB error on createMonth:', error.message)
        return errorResult(error.message)
      }
      return successResult(monthKey)
    } catch (err: any) {
      console.error('[SalaryRepo] Exception on createMonth:', err)
      return errorResult(err.message || String(err))
    }
  }

  async updateMonth(oldMonthKey: string, newMonthKey: string): Promise<RepositoryResult<boolean>> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .update({ month: newMonthKey, updated_at: new Date().toISOString() })
        .eq('month', oldMonthKey)

      if (error) {
        console.error('[SalaryRepo] DB error on updateMonth:', error.message)
        return errorResult(error.message)
      }
      return successResult(true)
    } catch (err: any) {
      console.error('[SalaryRepo] Exception on updateMonth:', err)
      return errorResult(err.message || String(err))
    }
  }

  async deleteMonth(monthKey: string): Promise<RepositoryResult<boolean>> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('month', monthKey)

      if (error) {
        console.error('[SalaryRepo] DB error on deleteMonth:', error.message)
        return errorResult(error.message)
      }
      return successResult(true)
    } catch (err: any) {
      console.error('[SalaryRepo] Exception on deleteMonth:', err)
      return errorResult(err.message || String(err))
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
        console.error('[SalaryRepo] DB error on getSalaryRecords:', error.message)
        return errorResult(error.message)
      }
      const models = (data || []).map((row: SalaryMonthDbRow) => SalaryMapper.toModel(row))
      return successResult(models)
    } catch (err: any) {
      console.error('[SalaryRepo] Exception on getSalaryRecords:', err)
      return errorResult(err.message || String(err))
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
        console.error('[SalaryRepo] DB error on saveSalary:', error.message)
        return errorResult(error.message)
      }
      return successResult(SalaryMapper.toModel(data as SalaryMonthDbRow))
    } catch (err: any) {
      console.error('[SalaryRepo] Exception on saveSalary:', err)
      return errorResult(err.message || String(err))
    }
  }

  async deleteSalary(id: string): Promise<RepositoryResult<boolean>> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id)

      if (error) {
        console.error('[SalaryRepo] DB error on deleteSalary:', error.message)
        return errorResult(error.message)
      }
      return successResult(true)
    } catch (err: any) {
      console.error('[SalaryRepo] Exception on deleteSalary:', err)
      return errorResult(err.message || String(err))
    }
  }

  async getSalaryItemTypes(): Promise<RepositoryResult<SalaryItemType[]>> {
    try {
      const { data, error } = await supabase
        .from('salary_item_types')
        .select('*')
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('[SalaryRepo] DB error on getSalaryItemTypes:', error.message)
        return errorResult(error.message)
      }
      const itemTypes = (data || []).map((row: any) => ({
        id: row.id,
        name: row.item_name || row.item_code || '',
        category: (row.category === 'deduction' ? 'deduction' : 'addition') as 'addition' | 'deduction',
      }))
      return successResult(itemTypes)
    } catch (err: any) {
      console.error('[SalaryRepo] Exception on getSalaryItemTypes:', err)
      return errorResult(err.message || String(err))
    }
  }
}

export const supabaseSalaryRepository = new SupabaseSalaryRepository()
