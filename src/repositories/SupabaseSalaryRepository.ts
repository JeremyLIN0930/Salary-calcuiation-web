import { supabase } from '../lib/supabase'
import { Employee } from '../types/employee'
import { RepositoryResult, successResult, errorResult } from './base.repository'

export class SupabaseSalaryRepository {
  private tableName = 'salaries'

  async getMonths(): Promise<RepositoryResult<string[]>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('month')

      if (error) return errorResult(error)
      const months = Array.from(new Set((data || []).map((item: { month: string }) => item.month))).sort().reverse()
      return successResult(months)
    } catch (err) {
      return errorResult(err)
    }
  }

  async createMonth(monthKey: string): Promise<RepositoryResult<string>> {
    try {
      return successResult(monthKey)
    } catch (err) {
      return errorResult(err)
    }
  }

  async deleteMonth(monthKey: string): Promise<RepositoryResult<boolean>> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('month', monthKey)

      if (error) return errorResult(error)
      return successResult(true)
    } catch (err) {
      return errorResult(err)
    }
  }

  async getEmployees(monthKey: string): Promise<RepositoryResult<Employee[]>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('month', monthKey)
        .order('name', { ascending: true })

      if (error) return errorResult(error)
      return successResult((data as Employee[]) || [])
    } catch (err) {
      return errorResult(err)
    }
  }

  async saveSalary(salaryData: Partial<Employee>): Promise<RepositoryResult<Employee>> {
    try {
      const now = new Date().toISOString()
      const record = {
        id: salaryData.id || Math.random().toString(36).slice(2),
        updatedAt: now,
        ...salaryData,
      }

      const { data, error } = await supabase
        .from(this.tableName)
        .upsert([record])
        .select()
        .single()

      if (error) return errorResult(error)
      return successResult(data as Employee)
    } catch (err) {
      return errorResult(err)
    }
  }

  async deleteSalary(id: string): Promise<RepositoryResult<boolean>> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id)

      if (error) return errorResult(error)
      return successResult(true)
    } catch (err) {
      return errorResult(err)
    }
  }

  async getSalaryByEmployee(empName: string): Promise<RepositoryResult<Employee[]>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('name', empName)
        .order('month', { ascending: false })

      if (error) return errorResult(error)
      return successResult((data as Employee[]) || [])
    } catch (err) {
      return errorResult(err)
    }
  }

  async exportMonth(monthKey: string): Promise<RepositoryResult<Employee[]>> {
    return this.getEmployees(monthKey)
  }
}

export const supabaseSalaryRepository = new SupabaseSalaryRepository()
