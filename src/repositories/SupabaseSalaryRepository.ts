import { supabase } from '../lib/supabase'
import { Employee } from '../types/employee'
import { SalaryMonthRow, SalaryItemTypeRow } from '../types/database'
import { SalaryMapper } from '../mappers/SalaryMapper'
import { DEFAULT_COMPANY_ID } from '../mappers/EmployeeMapper'
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
      const result = await supabase
        .from(this.tableName)
        .select('month, year')

      if (result.error) {
        console.error('code:', result.error.code)
        console.error('message:', result.error.message)
        console.error('details:', result.error.details)
        console.error('hint:', result.error.hint)
        console.error('status:', (result.error as any).status || 'N/A')
        return errorResult(result.error, this.tableName, 'getMonths')
      }
      const rows = (result.data || []) as { month: number | string; year?: number }[]
      const monthKeys = rows.map(item => {
        const yr = item.year || new Date().getFullYear()
        const mo = typeof item.month === 'number' ? item.month : parseInt(String(item.month).slice(5, 7), 10) || 8
        return `${yr}-${String(mo).padStart(2, '0')}`
      })
      const uniqueMonths = Array.from(new Set(monthKeys)).sort().reverse()
      return successResult(uniqueMonths)
    } catch (err: unknown) {
      return errorResult(err, this.tableName, 'getMonths')
    }
  }

  async createMonth(monthKey: string): Promise<RepositoryResult<string>> {
    try {
      const yearVal  = parseInt(monthKey.slice(0, 4), 10) || new Date().getFullYear()
      const monthNum = parseInt(monthKey.slice(5, 7), 10) || 8

      const dbRow: SalaryMonthRow = {
        company_id: DEFAULT_COMPANY_ID,
        month: monthNum as any,
        year: yearVal,
        notes: monthKey,
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      console.log('🚀 [SupabaseSalaryRepository.createMonth] INSERT Payload:\n' + JSON.stringify(dbRow, null, 2))
      
      const result = await supabase.from(this.tableName).insert([dbRow]).select('*').single()
      console.log('④ Supabase createMonth Result:', result)

      if (result.error) {
        console.error('code:', result.error.code)
        console.error('message:', result.error.message)
        console.error('details:', result.error.details)
        console.error('hint:', result.error.hint)
        console.error('status:', (result.error as any).status || 'N/A')
        return errorResult(result.error, this.tableName, 'createMonth')
      }
      return successResult(monthKey)
    } catch (err: unknown) {
      return errorResult(err, this.tableName, 'createMonth')
    }
  }

  async updateMonth(oldMonthKey: string, newMonthKey: string): Promise<RepositoryResult<boolean>> {
    try {
      const oldYear  = parseInt(oldMonthKey.slice(0, 4), 10) || new Date().getFullYear()
      const oldMonth = parseInt(oldMonthKey.slice(5, 7), 10) || 8
      const newYear  = parseInt(newMonthKey.slice(0, 4), 10) || new Date().getFullYear()
      const newMonth = parseInt(newMonthKey.slice(5, 7), 10) || 8

      const result = await supabase
        .from(this.tableName)
        .update({ year: newYear, month: newMonth as any, updated_at: new Date().toISOString() })
        .eq('year', oldYear)
        .eq('month', oldMonth)

      if (result.error) {
        console.error('code:', result.error.code)
        console.error('message:', result.error.message)
        console.error('details:', result.error.details)
        console.error('hint:', result.error.hint)
        console.error('status:', (result.error as any).status || 'N/A')
        return errorResult(result.error, this.tableName, 'updateMonth')
      }
      return successResult(true)
    } catch (err: unknown) {
      return errorResult(err, this.tableName, 'updateMonth')
    }
  }

  async deleteMonth(monthKey: string): Promise<RepositoryResult<boolean>> {
    try {
      const yr = parseInt(monthKey.slice(0, 4), 10) || new Date().getFullYear()
      const mo = parseInt(monthKey.slice(5, 7), 10) || 8

      const result = await supabase
        .from(this.tableName)
        .delete()
        .eq('year', yr)
        .eq('month', mo)

      if (result.error) {
        console.error('code:', result.error.code)
        console.error('message:', result.error.message)
        console.error('details:', result.error.details)
        console.error('hint:', result.error.hint)
        console.error('status:', (result.error as any).status || 'N/A')
        return errorResult(result.error, this.tableName, 'deleteMonth')
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
        const yr = parseInt(monthKey.slice(0, 4), 10) || new Date().getFullYear()
        const mo = parseInt(monthKey.slice(5, 7), 10) || 8
        query = query.eq('year', yr).eq('month', mo)
      }
      const result = await query.order('updated_at', { ascending: false })

      if (result.error) {
        console.error('code:', result.error.code)
        console.error('message:', result.error.message)
        console.error('details:', result.error.details)
        console.error('hint:', result.error.hint)
        console.error('status:', (result.error as any).status || 'N/A')
        return errorResult(result.error, this.tableName, 'getSalaryRecords')
      }
      console.log('⑥ SELECT Query Result:', result)
      const rows = (result.data || []) as SalaryMonthRow[]
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
      console.log('Salary INSERT Payload', dbRow)
      console.log('③ Repository Payload (JSON):\n' + JSON.stringify(dbRow, null, 2))

      const result = dbRow.id
        ? await supabase.from(this.tableName).upsert([dbRow]).select('*').single()
        : await supabase.from(this.tableName).insert([dbRow]).select('*').single()

      console.log('④ Supabase Result:', result)

      const { data, error } = result

      if (error) {
        console.error('code:', error.code)
        console.error('message:', error.message)
        console.error('details:', error.details)
        console.error('hint:', error.hint)
        console.error('status:', (error as any).status || (error as any).statusCode || 'N/A')
        return errorResult(error, this.tableName, 'saveSalary')
      }

      console.log('④ Supabase INSERT Success Data:\n' + JSON.stringify(data, null, 2))
      return successResult(SalaryMapper.toModel(data as SalaryMonthRow))
    } catch (err: unknown) {
      console.error('❌ Supabase INSERT Exception:', err)
      return errorResult(err, this.tableName, 'saveSalary')
    }
  }

  async deleteSalary(id: string): Promise<RepositoryResult<boolean>> {
    try {
      const result = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id)

      if (result.error) {
        console.error('code:', result.error.code)
        console.error('message:', result.error.message)
        console.error('details:', result.error.details)
        console.error('hint:', result.error.hint)
        console.error('status:', (result.error as any).status || 'N/A')
        return errorResult(result.error, this.tableName, 'deleteSalary')
      }
      return successResult(true)
    } catch (err: unknown) {
      return errorResult(err, this.tableName, 'deleteSalary')
    }
  }

  async getSalaryItemTypes(): Promise<RepositoryResult<SalaryItemType[]>> {
    try {
      const result = await supabase
        .from('salary_item_types')
        .select('*')
        .order('updated_at', { ascending: false })

      if (result.error) {
        console.error('code:', result.error.code)
        console.error('message:', result.error.message)
        console.error('details:', result.error.details)
        console.error('hint:', result.error.hint)
        console.error('status:', (result.error as any).status || 'N/A')
        return errorResult(result.error, 'salary_item_types', 'getSalaryItemTypes')
      }
      const rows = (result.data || []) as SalaryItemTypeRow[]
      const itemTypes: SalaryItemType[] = rows.map(row => ({
        id: row.id || '',
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
