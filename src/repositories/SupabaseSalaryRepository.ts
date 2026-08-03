import { supabase } from '../lib/supabase'
import { Employee, createEmptyEmployee } from '../types/employee'
import { SalaryMonthRow, SalaryItemTypeRow } from '../types/database'
import { SalaryMapper } from '../mappers/SalaryMapper'
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
      // 1. Get salaryMonthId(s) for the month
      let query = supabase.from(this.tableName).select('id, year, month')
      if (monthKey) {
        const yr = parseInt(monthKey.slice(0, 4), 10) || new Date().getFullYear()
        const mo = parseInt(monthKey.slice(5, 7), 10) || 8
        query = query.eq('year', yr).eq('month', mo)
      }
      const monthRes = await query
      if (monthRes.error) {
        return errorResult(monthRes.error, 'salary_months', 'getSalaryRecords')
      }
      const monthIds = (monthRes.data || []).map(m => m.id)

      if (monthIds.length === 0) {
        return successResult([])
      }

      // 2. Fetch all salary_items for these month ids
      const itemsRes = await supabase
        .from('salary_items')
        .select('*')
        .in('salary_month_id', monthIds)

      if (itemsRes.error) {
        // Fallback to legacy structure if table salary_items is missing
        if (itemsRes.error.code === 'PGRST205') {
          console.warn('⚠️ Table salary_items does not exist. Falling back to legacy salary_months notes.')
          return this.getLegacySalaryRecords(monthKey)
        }
        return errorResult(itemsRes.error, 'salary_items', 'getSalaryRecords')
      }

      const rows = itemsRes.data || []
      const models: Employee[] = []
      for (const row of rows) {
        if (row.notes) {
          try {
            const parsed = JSON.parse(row.notes)
            const base = createEmptyEmployee()
            models.push({
              ...base,
              ...parsed,
              id: row.id || parsed.id || base.id,
              employeeId: row.employee_id || parsed.employeeId,
              month: monthKey || parsed.month || `${row.year}-${String(row.month).padStart(2, '0')}`
            })
          } catch (e) {
            console.error('Failed to parse salary_item notes:', e)
          }
        }
      }
      return successResult(models)
    } catch (err: unknown) {
      return errorResult(err, 'salary_items', 'getSalaryRecords')
    }
  }

  private async getLegacySalaryRecords(monthKey?: string): Promise<RepositoryResult<Employee[]>> {
    let query = supabase.from(this.tableName).select('*')
    if (monthKey) {
      const yr = parseInt(monthKey.slice(0, 4), 10) || new Date().getFullYear()
      const mo = parseInt(monthKey.slice(5, 7), 10) || 8
      query = query.eq('year', yr).eq('month', mo)
    }
    const result = await query.order('updated_at', { ascending: false })
    if (result.error) {
      return errorResult(result.error, this.tableName, 'getSalaryRecords')
    }
    const rows = (result.data || []) as SalaryMonthRow[]
    const models = rows.map(row => SalaryMapper.toModel(row))
    return successResult(models)
  }

  async getEmployees(monthKey: string): Promise<RepositoryResult<Employee[]>> {
    return this.getSalaryRecords(monthKey)
  }

  async saveSalary(salaryData: Partial<Employee>): Promise<RepositoryResult<Employee>> {
    try {
      const monthStr = salaryData.month || new Date().toISOString().slice(0, 7)
      const yearVal  = parseInt(monthStr.slice(0, 4), 10) || new Date().getFullYear()
      const monthNum = parseInt(monthStr.slice(5, 7), 10) || 8

      // 1. Find or create parent month row in salary_months
      let salaryMonthId: string | null = null
      const { data: existingMonth, error: findMonthErr } = await supabase
        .from('salary_months')
        .select('id')
        .eq('company_id', DEFAULT_COMPANY_ID)
        .eq('year', yearVal)
        .eq('month', monthNum)
        .maybeSingle()

      if (findMonthErr) {
        console.warn('⚠️ Query salary_months warning:', findMonthErr.message)
      }

      if (existingMonth) {
        salaryMonthId = existingMonth.id
        console.log('✅ Found existing salary_months ID:', salaryMonthId)
      } else {
        // Create new salary_months row
        const monthPayload = {
          company_id: DEFAULT_COMPANY_ID,
          year: yearVal,
          month: monthNum,
          status: 'draft',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        console.log('🚀 [SupabaseSalaryRepository] Creating salary_months parent row:', monthPayload)
        const { data: newMonth, error: createMonthErr } = await supabase
          .from('salary_months')
          .insert([monthPayload])
          .select('id')
          .single()

        if (createMonthErr) {
          console.error('Failed to create salary_month:', createMonthErr)
          return errorResult(createMonthErr, 'salary_months', 'saveSalary')
        }
        salaryMonthId = newMonth.id
        console.log('✅ Created new salary_months ID:', salaryMonthId)
      }

      // 2. Resolve employeeId UUID
      let employeeId = salaryData.employeeId
      if (!employeeId || !isValidUuid(employeeId)) {
        const trimmedName = (salaryData.name || '').trim()
        const { data: matchedEmp } = await supabase
          .from('master_employees')
          .select('id')
          .eq('name', trimmedName)
          .maybeSingle()

        if (matchedEmp) {
          employeeId = matchedEmp.id
        } else {
          console.log(`🚀 [SupabaseSalaryRepository] Auto-creating master employee: ${trimmedName}`)
          const { data: newEmp, error: createEmpErr } = await supabase
            .from('master_employees')
            .insert([{
              name: trimmedName,
              company_id: DEFAULT_COMPANY_ID,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }])
            .select('id')
            .single()

          if (createEmpErr) {
            console.error('Failed to create master employee:', createEmpErr)
            return errorResult(createEmpErr, 'master_employees', 'saveSalary')
          }
          employeeId = newEmp.id
        }
      }

      // 3. Prepare payload JSON string
      const cleanPayload: Record<string, unknown> = {}
      for (const [key, val] of Object.entries(salaryData)) {
        if (val === undefined || val === null) continue
        if (typeof val === 'string' && val.trim() === '') {
          cleanPayload[key] = null
        } else {
          cleanPayload[key] = val
        }
      }
      cleanPayload.employeeId = employeeId

      const itemPayload = {
        salary_month_id: salaryMonthId,
        employee_id: employeeId,
        notes: JSON.stringify(cleanPayload),
        updated_at: new Date().toISOString()
      }

      if (isValidUuid(salaryData.id)) {
        (itemPayload as any).id = salaryData.id
      }

      // 4. SELECT first to prevent duplicate key constraint on (salary_month_id, employee_id)
      let savedItem: any = null
      let queryItems = supabase.from('salary_items').select('*')
      if (isValidUuid(salaryData.id)) {
        queryItems = queryItems.eq('id', salaryData.id)
      } else {
        queryItems = queryItems.eq('salary_month_id', salaryMonthId).eq('employee_id', employeeId)
      }

      const { data: existingItem } = await queryItems.maybeSingle()

      if (existingItem) {
        console.log('🚀 [SupabaseSalaryRepository] Updating existing salary_item:', existingItem.id)
        const { data: updatedData, error: updateErr } = await supabase
          .from('salary_items')
          .update(itemPayload)
          .eq('id', existingItem.id)
          .select('*')
          .single()

        if (updateErr) {
          console.error('Failed to update salary_item:', updateErr)
          return errorResult(updateErr, 'salary_items', 'saveSalary')
        }
        savedItem = updatedData
      } else {
        console.log('🚀 [SupabaseSalaryRepository] Inserting new salary_item')
        const { data: insertedData, error: insertErr } = await supabase
          .from('salary_items')
          .insert([itemPayload])
          .select('*')
          .single()

        if (insertErr) {
          // Fallback if salary_items does not exist yet (legacy compatibility)
          if (insertErr.code === 'PGRST205') {
            console.warn('⚠️ Table salary_items does not exist. Falling back to legacy insert in salary_months.')
            return this.saveLegacySalary(salaryData)
          }
          console.error('Failed to insert salary_item:', insertErr)
          return errorResult(insertErr, 'salary_items', 'saveSalary')
        }
        savedItem = insertedData
      }

      const returnedModel = {
        ...createEmptyEmployee(),
        ...JSON.parse(savedItem.notes),
        id: savedItem.id,
        employeeId: savedItem.employee_id,
        month: monthStr
      }
      return successResult(returnedModel)
    } catch (err: unknown) {
      console.error('❌ Supabase saveSalary Exception:', err)
      return errorResult(err, 'salary_items', 'saveSalary')
    }
  }

  private async saveLegacySalary(salaryData: Partial<Employee>): Promise<RepositoryResult<Employee>> {
    const dbRow = SalaryMapper.toDbRow(salaryData)
    const result = dbRow.id
      ? await supabase.from(this.tableName).upsert([dbRow]).select('*').single()
      : await supabase.from(this.tableName).insert([dbRow]).select('*').single()

    const { data, error } = result
    if (error) {
      return errorResult(error, this.tableName, 'saveSalary')
    }
    return successResult(SalaryMapper.toModel(data as SalaryMonthRow))
  }

  async deleteSalary(id: string): Promise<RepositoryResult<boolean>> {
    try {
      const { error: itemErr } = await supabase
        .from('salary_items')
        .delete()
        .eq('id', id)

      const { error: monthErr } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id)

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
