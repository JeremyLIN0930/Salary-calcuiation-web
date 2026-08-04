import { supabase } from '../lib/supabase'
import { Employee, createEmptyEmployee } from '../types/employee'
import { SalaryMonthRow, SalaryItemTypeRow } from '../types/database'
import { DEFAULT_COMPANY_ID, isValidUuid } from '../mappers/EmployeeMapper'
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

      // Check if already exists first to satisfy unique constraint
      const { data: existingMonth } = await supabase
        .from(this.tableName)
        .select('id')
        .eq('company_id', DEFAULT_COMPANY_ID)
        .eq('year', yearVal)
        .eq('month', monthNum)
        .maybeSingle()

      if (existingMonth) {
        return successResult(monthKey)
      }

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
      let query = supabase
        .from(this.tableName)
        .select('id, company_id, year, month, payroll_date, status, notes, created_at, updated_at, salary_items(*)')

      if (monthKey) {
        const yr = parseInt(monthKey.slice(0, 4), 10) || new Date().getFullYear()
        const mo = parseInt(monthKey.slice(5, 7), 10) || 8
        query = query.eq('year', yr).eq('month', mo)
      }

      const { data, error } = await query.order('updated_at', { ascending: false })
      if (error) {
        return errorResult(error, this.tableName, 'getSalaryRecords')
      }

      const models: Employee[] = []
      const monthRows = (data || []) as Array<SalaryMonthRow & { salary_items?: Array<{ id?: string; employee_id?: string | null; employee_name?: string | null; notes?: string | null; base_salary?: number | null; net_salary?: number | null }> }>

      for (const monthRow of monthRows) {
        const monthKeyValue = `${monthRow.year || new Date().getFullYear()}-${String(monthRow.month).padStart(2, '0')}`
        const detailRows = monthRow.salary_items || []

        for (const detailRow of detailRows) {
          const parsedNotes = detailRow.notes ? (() => {
            try {
              return JSON.parse(detailRow.notes)
            } catch {
              return null
            }
          })() : null

          const base = createEmptyEmployee()
          const employeeModel: Employee = {
            ...base,
            ...(parsedNotes || {}),
            id: detailRow.id || parsedNotes?.id || base.id,
            employeeId: detailRow.employee_id || parsedNotes?.employeeId,
            name: parsedNotes?.name || detailRow.employee_name || base.name,
            month: monthKeyValue,
            baseSalary: detailRow.base_salary ?? parsedNotes?.baseSalary ?? base.baseSalary,
            netSalary: detailRow.net_salary ?? parsedNotes?.netSalary ?? base.netSalary,
          }

          models.push(employeeModel)
        }
      }

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
      const monthStr = salaryData.month || new Date().toISOString().slice(0, 7)
      const yearVal = parseInt(monthStr.slice(0, 4), 10) || new Date().getFullYear()
      const monthNum = parseInt(monthStr.slice(5, 7), 10) || 8

      let employeeId: string | null = salaryData.employeeId || null
      if (!employeeId || !isValidUuid(employeeId)) {
        const trimmedName = (salaryData.name || '').trim()
        const { data: matchedEmp } = await supabase
          .from('master_employees')
          .select('id')
          .eq('name', trimmedName)
          .maybeSingle()

        employeeId = matchedEmp?.id || null
      }

      const { data: existingMonth, error: findMonthErr } = await supabase
        .from(this.tableName)
        .select('id')
        .eq('company_id', DEFAULT_COMPANY_ID)
        .eq('year', yearVal)
        .eq('month', monthNum)
        .maybeSingle()

      if (findMonthErr) {
        console.error('========== salary_months lookup error ==========' )
        console.error(findMonthErr)
        console.error(JSON.stringify(findMonthErr, null, 2))
        throw findMonthErr
      }

      let salaryMonthId: string | null = existingMonth?.id || null
      if (!salaryMonthId) {
        const monthPayload: Record<string, any> = {
          company_id: DEFAULT_COMPANY_ID,
          year: yearVal,
          month: monthNum,
          payroll_date: salaryData.payDate || null,
          status: 'draft',
          notes: monthStr,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        const { data: insertedMonth, error: insertMonthErr } = await supabase
          .from(this.tableName)
          .insert([monthPayload])
          .select('id')
          .single()

        if (insertMonthErr || !insertedMonth) {
          console.error('========== salary_months insert error ==========' )
          console.error(insertMonthErr)
          console.error(JSON.stringify(insertMonthErr, null, 2))
          throw insertMonthErr || new Error('建立月份主檔失敗')
        }

        salaryMonthId = insertedMonth.id
      } else {
        const monthPayload: Record<string, any> = {
          company_id: DEFAULT_COMPANY_ID,
          year: yearVal,
          month: monthNum,
          payroll_date: salaryData.payDate || null,
          status: 'draft',
          notes: monthStr,
          updated_at: new Date().toISOString(),
        }

        const { error: updateMonthErr } = await supabase
          .from(this.tableName)
          .update(monthPayload)
          .eq('id', salaryMonthId)

        if (updateMonthErr) {
          console.error('========== salary_months update error ==========' )
          console.error(updateMonthErr)
          console.error(JSON.stringify(updateMonthErr, null, 2))
          throw updateMonthErr
        }
      }

      const normalizeStringValue = (value: unknown): string | null => {
        if (value === undefined || value === null) return null
        if (typeof value === 'string') {
          const trimmed = value.trim()
          return trimmed || null
        }
        return String(value)
      }

      const normalizeNumericValue = (value: unknown): number | null => {
        if (value === undefined || value === null || value === '') return null
        if (typeof value === 'number') return Number.isFinite(value) ? value : null
        const num = Number(value)
        return Number.isFinite(num) ? num : null
      }

      const normalizeDateValue = (value: unknown): string | null => {
        if (value === undefined || value === null || value === '') return null
        if (typeof value === 'string') {
          const trimmed = value.trim()
          if (!trimmed) return null
          if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed
          const date = new Date(trimmed)
          return Number.isNaN(date.getTime()) ? trimmed : date.toISOString().slice(0, 10)
        }
        if (value instanceof Date) return value.toISOString().slice(0, 10)
        return String(value)
      }

      const detailPayload: Record<string, any> = {
        salary_month_id: salaryMonthId ?? null,
        employee_id: employeeId || null,
        employee_name: employeeId ? null : normalizeStringValue(salaryData.name),
        base_salary: normalizeNumericValue(salaryData.baseSalary),
        attendance_days: normalizeNumericValue((salaryData as any).attendanceDays ?? (salaryData as any).attendance_days),
        overtime_hours: normalizeNumericValue((salaryData as any).overtimeHours ?? (salaryData as any).overtime_hours),
        labor_insurance: normalizeNumericValue(salaryData.laborInsurance),
        health_insurance: normalizeNumericValue(salaryData.healthInsurance),
        tax: normalizeNumericValue(salaryData.incomeTax),
        bonus: normalizeNumericValue(salaryData.bonusItems),
        allowance: normalizeNumericValue((salaryData as any).allowance ?? salaryData.otherAllowance),
        deduction: normalizeNumericValue(salaryData.otherDeductions),
        net_salary: normalizeNumericValue(salaryData.netSalary),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const payload = [detailPayload]
      console.log('========== salary_items payload ==========' )
      console.log(JSON.stringify(payload, null, 2))

      const debugFields = [
        'salary_month_id',
        'employee_id',
        'employee_name',
        'base_salary',
        'hourly_wage',
        'attendance_days',
        'attendance_hours',
        'overtime_hours',
        'gross_salary',
        'labor_insurance',
        'health_insurance',
        'labor_pension',
        'tax',
        'bonus',
        'allowance',
        'deduction',
        'net_salary',
      ]
      for (const field of debugFields) {
        console.log(`${field}:`, payload[0]?.[field] ?? null)
      }

      const { data: existingDetail, error: findDetailErr } = await supabase
        .from('salary_items')
        .select('id')
        .eq('salary_month_id', salaryMonthId)
        .eq(employeeId ? 'employee_id' : 'employee_name', employeeId || (salaryData.name || '').trim() || null)
        .maybeSingle()

      if (findDetailErr) {
        console.error('========== salary_items lookup error ==========' )
        console.error(findDetailErr)
        console.error(JSON.stringify(findDetailErr, null, 2))
        throw findDetailErr
      }

      let savedDetail: any = null
      if (existingDetail?.id) {
        const { data: updatedData, error: updateErr } = await supabase
          .from('salary_items')
          .update(detailPayload)
          .eq('id', existingDetail.id)
          .select('*')
          .single()

        if (updateErr) {
          console.error('========== Supabase Response ==========' )
          console.error(updateErr)
          console.error(JSON.stringify(updateErr, null, 2))
          throw updateErr
        }
        savedDetail = updatedData
      } else {
        const { data: insertedData, error: insertErr } = await supabase
          .from('salary_items')
          .insert([detailPayload])
          .select('*')
          .single()

        if (insertErr || !insertedData) {
          console.error('========== Supabase Response ==========' )
          console.error(insertErr)
          console.error(JSON.stringify(insertErr, null, 2))
          throw insertErr || new Error('建立薪資明細失敗')
        }
        savedDetail = insertedData
      }

      const savedModel: Employee = {
        ...createEmptyEmployee(),
        ...JSON.parse(savedDetail.notes || '{}'),
        id: savedDetail.id,
        employeeId: savedDetail.employee_id || undefined,
        month: monthStr,
      }

      return successResult(savedModel)
    } catch (err: unknown) {
      console.error('❌ Supabase saveSalary Exception:', err)
      console.error(JSON.stringify(err, null, 2))
      throw err
    }
  }

  async deleteSalary(id: string): Promise<RepositoryResult<boolean>> {
    try {
      const { data: detailRow, error: findDetailErr } = await supabase
        .from('salary_items')
        .select('id, salary_month_id')
        .eq('id', id)
        .maybeSingle()

      if (findDetailErr) {
        return errorResult(findDetailErr, 'salary_items', 'deleteSalary')
      }

      if (detailRow?.id) {
        const { error: deleteDetailErr } = await supabase
          .from('salary_items')
          .delete()
          .eq('id', detailRow.id)

        if (deleteDetailErr) {
          return errorResult(deleteDetailErr, 'salary_items', 'deleteSalary')
        }

        const { data: remainingItems, error: checkErr } = await supabase
          .from('salary_items')
          .select('id')
          .eq('salary_month_id', detailRow.salary_month_id)
          .maybeSingle()

        if (checkErr) {
          return errorResult(checkErr, 'salary_items', 'deleteSalary')
        }

        if (!remainingItems) {
          const { error: deleteMonthErr } = await supabase
            .from(this.tableName)
            .delete()
            .eq('id', detailRow.salary_month_id)

          if (deleteMonthErr) {
            return errorResult(deleteMonthErr, this.tableName, 'deleteSalary')
          }
        }
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
