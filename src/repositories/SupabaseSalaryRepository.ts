import { supabase } from '../lib/supabase'
import { Employee } from '../types/employee'
import { RepositoryResult, successResult, errorResult } from './base.repository'

export interface SalaryItemType {
  id: string
  name: string
  category: 'addition' | 'deduction'
}

export class SupabaseSalaryRepository {
  // ✅ Correct table: salary_months (stores per-employee salary records per month)
  private tableName = 'salary_months'

  async getMonths(): Promise<RepositoryResult<string[]>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('month')

      if (error) {
        console.error('[SalaryRepo] getMonths error:', error)
        return errorResult(error)
      }
      const months = Array.from(new Set((data || []).map((item: { month: string }) => item.month))).sort().reverse()
      return successResult(months)
    } catch (err) {
      console.error('[SalaryRepo] getMonths exception:', err)
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

  async updateMonth(oldMonthKey: string, newMonthKey: string): Promise<RepositoryResult<boolean>> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .update({ month: newMonthKey, updatedAt: new Date().toISOString() })
        .eq('month', oldMonthKey)

      if (error) {
        console.error('[SalaryRepo] updateMonth error:', error)
        return errorResult(error)
      }
      return successResult(true)
    } catch (err) {
      console.error('[SalaryRepo] updateMonth exception:', err)
      return errorResult(err)
    }
  }

  async deleteMonth(monthKey: string): Promise<RepositoryResult<boolean>> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('month', monthKey)

      if (error) {
        console.error('[SalaryRepo] deleteMonth error:', error)
        return errorResult(error)
      }
      return successResult(true)
    } catch (err) {
      console.error('[SalaryRepo] deleteMonth exception:', err)
      return errorResult(err)
    }
  }

  async getSalaryRecords(monthKey?: string): Promise<RepositoryResult<Employee[]>> {
    try {
      let query = supabase.from(this.tableName).select('*')
      if (monthKey) {
        query = query.eq('month', monthKey)
      }
      const { data, error } = await query.order('createdAt', { ascending: false })

      if (error) {
        console.error('[SalaryRepo] getSalaryRecords error:', error)
        return errorResult(error)
      }
      return successResult((data as Employee[]) || [])
    } catch (err) {
      console.error('[SalaryRepo] getSalaryRecords exception:', err)
      return errorResult(err)
    }
  }

  async getEmployees(monthKey: string): Promise<RepositoryResult<Employee[]>> {
    return this.getSalaryRecords(monthKey)
  }

  async saveSalary(salaryData: Partial<Employee>): Promise<RepositoryResult<Employee>> {
    try {
      const now = new Date().toISOString()
      const record = {
        id: salaryData.id || Math.random().toString(36).slice(2),
        updatedAt: now,
        createdAt: salaryData.createdAt || now,
        ...salaryData,
      }

      console.log('[SalaryRepo] Upserting into salary_months:', record.id)

      const { data, error } = await supabase
        .from(this.tableName)
        .upsert([record])
        .select()
        .single()

      if (error) {
        console.error('[SalaryRepo] saveSalary error:', error)
        return errorResult(error)
      }
      return successResult(data as Employee)
    } catch (err) {
      console.error('[SalaryRepo] saveSalary exception:', err)
      return errorResult(err)
    }
  }

  async deleteSalary(id: string): Promise<RepositoryResult<boolean>> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id)

      if (error) {
        console.error('[SalaryRepo] deleteSalary error:', error)
        return errorResult(error)
      }
      return successResult(true)
    } catch (err) {
      console.error('[SalaryRepo] deleteSalary exception:', err)
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

      if (error) {
        console.error('[SalaryRepo] getSalaryByEmployee error:', error)
        return errorResult(error)
      }
      return successResult((data as Employee[]) || [])
    } catch (err) {
      console.error('[SalaryRepo] getSalaryByEmployee exception:', err)
      return errorResult(err)
    }
  }

  async duplicateMonth(fromMonthKey: string, toMonthKey: string): Promise<RepositoryResult<Employee[]>> {
    try {
      const prevResult = await this.getEmployees(fromMonthKey)
      if (!prevResult.success || !prevResult.data) {
        return errorResult(prevResult.error || '無法取得前一月份資料')
      }

      const newRecords: Partial<Employee>[] = prevResult.data.map(prevEmp => ({
        id: Math.random().toString(36).slice(2),
        name: prevEmp.name,
        store: prevEmp.store,
        hireDate: prevEmp.hireDate || '',
        payDate: prevEmp.payDate || '',
        month: toMonthKey,
        baseSalary: 0,
        mealAllowance: 0,
        positionAllowance: 0,
        otherAllowance: 0,
        nightAllowance: 0,
        bonusItems: 0,
        profitSharing: 0,
        otherAdditions: 0,
        specialLeaveAllowance: 0,
        weekdayOT: 0,
        restDayOT: 0,
        holidayOT: 0,
        sickLeaveDeduction: 0,
        grossSalary: 0,
        isGrossManual: false,
        laborInsurance: 0,
        healthInsurance: 0,
        laborPension: 0,
        incomeTax: 0,
        otherDeductions: 0,
        totalDeductions: 0,
        isDeductionManual: false,
        annualLeaveRemaining: 0,
        carriedOverLeave: 0,
        companyPensionContribution: 0,
        monthlyPensionContribution: 0,
        netSalary: 0,
        isNetManual: false,
        remark: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }))

      const { data, error } = await supabase
        .from(this.tableName)
        .insert(newRecords)
        .select()

      if (error) {
        console.error('[SalaryRepo] duplicateMonth error:', error)
        return errorResult(error)
      }
      return successResult(data as Employee[])
    } catch (err) {
      console.error('[SalaryRepo] duplicateMonth exception:', err)
      return errorResult(err)
    }
  }

  async exportEmployee(id: string): Promise<RepositoryResult<Employee>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('[SalaryRepo] exportEmployee error:', error)
        return errorResult(error)
      }
      return successResult(data as Employee)
    } catch (err) {
      console.error('[SalaryRepo] exportEmployee exception:', err)
      return errorResult(err)
    }
  }

  async exportMonth(monthKey: string): Promise<RepositoryResult<Employee[]>> {
    return this.getEmployees(monthKey)
  }

  async getSalaryItemTypes(): Promise<RepositoryResult<SalaryItemType[]>> {
    try {
      // ✅ Correct table: salary_item_types
      const { data, error } = await supabase
        .from('salary_item_types')
        .select('*')

      if (error || !data) {
        console.warn('[SalaryRepo] salary_item_types not found, using defaults')
        return successResult([
          { id: '1', name: '本薪', category: 'addition' },
          { id: '2', name: '伙食津貼', category: 'addition' },
          { id: '3', name: '職務津貼', category: 'addition' },
          { id: '4', name: '大夜津貼', category: 'addition' },
          { id: '5', name: '勞保費', category: 'deduction' },
          { id: '6', name: '健保費', category: 'deduction' },
        ])
      }
      return successResult(data as SalaryItemType[])
    } catch (err) {
      console.error('[SalaryRepo] getSalaryItemTypes exception:', err)
      return errorResult(err)
    }
  }
}

export const supabaseSalaryRepository = new SupabaseSalaryRepository()
