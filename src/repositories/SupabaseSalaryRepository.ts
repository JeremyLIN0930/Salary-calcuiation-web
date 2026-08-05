import { supabase } from '../lib/supabase'
import { Employee, createEmptyEmployee } from '../types/employee'
import { SalaryMonthRow, SalaryItemTypeRow } from '../types/database'
import { DEFAULT_COMPANY_ID, isValidUuid, NAN_YI_STORE_ID } from '../mappers/EmployeeMapper'
import { RepositoryResult, successResult, errorResult } from './base.repository'

export interface SalaryItemType {
  id: string
  name: string
  category: 'addition' | 'deduction'
}

export class SupabaseSalaryRepository {
  private tableName = 'salary_months'

  private normalizeStringValue(value: unknown): string | null {
    if (value === undefined || value === null) return null
    if (typeof value === 'string') {
      const trimmed = value.trim()
      return trimmed || null
    }
    return String(value)
  }

  private normalizeNumericValue(value: unknown): number | null {
    if (value === undefined || value === null || value === '') return null
    if (typeof value === 'number') return Number.isFinite(value) ? value : null
    const num = Number(value)
    return Number.isFinite(num) ? num : null
  }

  private normalizeDateValue(value: unknown): string | null {
    if (value === undefined || value === null || value === '') return null
    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (!trimmed) return null
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed
      const parsed = new Date(trimmed)
      return Number.isNaN(parsed.getTime()) ? trimmed : parsed.toISOString().slice(0, 10)
    }
    if (value instanceof Date) return value.toISOString().slice(0, 10)
    return String(value)
  }

  private async findSalaryMonthId(monthKey: string): Promise<string | null> {
    const yr = parseInt(monthKey.slice(0, 4), 10) || new Date().getFullYear()
    const mo = parseInt(monthKey.slice(5, 7), 10) || 8

    const { data, error } = await supabase
      .from(this.tableName)
      .select('id')
      .eq('year', yr)
      .eq('month', mo)
      .limit(1)

    if (error) {
      throw error
    }

    return data?.[0]?.id ?? null
  }

  private async resolveEmployeeName(salaryData: Partial<Employee>, employeeId: string | null): Promise<{ employeeId: string | null; employeeName: string }> {
    const candidateName = this.normalizeStringValue((salaryData as any).employee_name)
      || this.normalizeStringValue((salaryData as any).employeeName)
      || this.normalizeStringValue(salaryData.name)
      || this.normalizeStringValue((salaryData as any).fullName)
      || this.normalizeStringValue((salaryData as any).displayName)

    let resolvedEmployeeId = employeeId && isValidUuid(employeeId) ? employeeId : null
    let resolvedEmployeeName = candidateName

    if (!resolvedEmployeeName && resolvedEmployeeId) {
      const { data: matchedEmp, error } = await supabase
        .from('master_employees')
        .select('id, name')
        .eq('id', resolvedEmployeeId)
        .maybeSingle()

      if (error) {
        console.error('========== master_employees lookup error ==========' )
        console.error(error)
        console.error(JSON.stringify(error, null, 2))
        throw error
      }

      resolvedEmployeeName = this.normalizeStringValue(matchedEmp?.name)
    }

    if (!resolvedEmployeeName) {
      throw new Error('找不到員工姓名，請確認資料。')
    }

    return {
      employeeId: resolvedEmployeeId,
      employeeName: resolvedEmployeeName,
    }
  }

  private buildSalaryItemPayload(salaryMonthId: string | null, employeeId: string | null, employeeName: string | null, salaryData: Partial<Employee>): Record<string, any> {
    const fullJsonRemarks = JSON.stringify({
      ...salaryData,
      employeeId: employeeId || salaryData.employeeId,
      name: employeeName || salaryData.name,
    })

    const payload = {
      salary_month_id: salaryMonthId ?? null,
      employee_id: employeeId || null,
      employee_name: employeeName || null,
      base_salary: this.normalizeNumericValue(salaryData.baseSalary),
      attendance_days: this.normalizeNumericValue((salaryData as any).attendanceDays ?? (salaryData as any).attendance_days),
      overtime_hours: this.normalizeNumericValue((salaryData as any).overtimeHours ?? (salaryData as any).overtime_hours),
      labor_insurance: this.normalizeNumericValue(salaryData.laborInsurance),
      health_insurance: this.normalizeNumericValue(salaryData.healthInsurance),
      tax: this.normalizeNumericValue(salaryData.incomeTax),
      bonus: this.normalizeNumericValue(salaryData.bonusItems),
      allowance: this.normalizeNumericValue((salaryData as any).allowance ?? salaryData.otherAllowance),
      deduction: this.normalizeNumericValue(salaryData.otherDeductions),
      net_salary: this.normalizeNumericValue(salaryData.netSalary),
      remarks: fullJsonRemarks,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    console.log("=== Salary Save Payload ===")
    console.log(payload)

    return payload
  }

  async checkDuplicateSalary(salaryData: Partial<Employee>): Promise<RepositoryResult<{ duplicate: boolean; employeeName: string | null; monthLabel: string | null; existingId: string | null }>> {
    try {
      const monthStr = salaryData.month || new Date().toISOString().slice(0, 7)
      const yearVal = parseInt(monthStr.slice(0, 4), 10) || new Date().getFullYear()
      const monthNum = parseInt(monthStr.slice(5, 7), 10) || 8
      const employeeId = salaryData.employeeId && isValidUuid(salaryData.employeeId) ? salaryData.employeeId : null
      const { employeeName } = await this.resolveEmployeeName(salaryData, employeeId)

      const { data: existingMonth, error: findMonthErr } = await supabase
        .from(this.tableName)
        .select('id')
        .eq('company_id', DEFAULT_COMPANY_ID)
        .eq('year', yearVal)
        .eq('month', monthNum)
        .maybeSingle()

      if (findMonthErr) {
        console.error('========== salary_months duplicate-check lookup error ==========' )
        console.error(findMonthErr)
        console.error(JSON.stringify(findMonthErr, null, 2))
        return successResult({ duplicate: false, employeeName, monthLabel: monthStr, existingId: null })
      }

      if (!existingMonth?.id) {
        return successResult({ duplicate: false, employeeName, monthLabel: monthStr, existingId: null })
      }

      const { data: existingDetail, error: findDetailErr } = await supabase
        .from('salary_items')
        .select('id')
        .eq('salary_month_id', existingMonth.id)
        .eq(employeeId ? 'employee_id' : 'employee_name', employeeId || employeeName)
        .maybeSingle()

      if (findDetailErr) {
        console.error('========== salary_items duplicate-check lookup error ==========' )
        console.error(findDetailErr)
        console.error(JSON.stringify(findDetailErr, null, 2))
        return successResult({ duplicate: false, employeeName, monthLabel: monthStr, existingId: null })
      }

      return successResult({
        duplicate: Boolean(existingDetail?.id),
        employeeName,
        monthLabel: monthStr,
        existingId: existingDetail?.id || null,
      })
    } catch (err: unknown) {
      console.error('❌ checkDuplicateSalary Exception:', err)
      console.error(JSON.stringify(err, null, 2))
      return successResult({ duplicate: false, employeeName: null, monthLabel: null, existingId: null })
    }
  }

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
      const result = await supabase.from(this.tableName).insert([dbRow]).select('*').single()

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
      const salaryMonthId = await this.findSalaryMonthId(monthKey)

      if (!salaryMonthId) {
        return successResult(true)
      }

      const { error: deleteItemsErr } = await supabase
        .from('salary_items')
        .delete()
        .eq('salary_month_id', salaryMonthId)

      if (deleteItemsErr) {
        console.error('code:', deleteItemsErr.code)
        console.error('message:', deleteItemsErr.message)
        console.error('details:', deleteItemsErr.details)
        console.error('hint:', deleteItemsErr.hint)
        console.error('status:', (deleteItemsErr as any).status || 'N/A')
        return errorResult(deleteItemsErr, 'salary_items', 'deleteMonth')
      }

      const { error: deleteMonthErr } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', salaryMonthId)

      if (deleteMonthErr) {
        console.error('code:', deleteMonthErr.code)
        console.error('message:', deleteMonthErr.message)
        console.error('details:', deleteMonthErr.details)
        console.error('hint:', deleteMonthErr.hint)
        console.error('status:', (deleteMonthErr as any).status || 'N/A')
        return errorResult(deleteMonthErr, this.tableName, 'deleteMonth')
      }

      return successResult(true)
    } catch (err: unknown) {
      return errorResult(err, this.tableName, 'deleteMonth')
    }
  }

  async deleteSalaryMonth(monthKey: string): Promise<RepositoryResult<boolean>> {
    return this.deleteMonth(monthKey)
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

      // Pre-fetch master_employees mapping for store and hireDate fallback
      let masterById: Record<string, { store: string; hireDate: string }> = {}
      let masterByName: Record<string, { store: string; hireDate: string }> = {}
      try {
        const { data: masterRows } = await supabase
          .from('master_employees')
          .select('id, name, hire_date, store_id, stores(store_name)')

        if (masterRows) {
          for (const m of masterRows) {
            let resolvedStore = (m as any).stores?.store_name || ''
            if (!resolvedStore || resolvedStore === '總店') {
              if (m.store_id === NAN_YI_STORE_ID) resolvedStore = '南醫門市'
              else resolvedStore = '慶東門市'
            }
            const info = { store: resolvedStore, hireDate: m.hire_date || '' }
            if (m.id) masterById[m.id] = info
            if (m.name && m.name.trim()) masterByName[m.name.trim()] = info
          }
        }
      } catch (e) {
        console.warn('[getSalaryRecords] Master employee lookup failed:', e)
      }

      const models: Employee[] = []
      const monthRows = (data || []) as Array<SalaryMonthRow & { payroll_date?: string | null; notes?: string | null; salary_items?: Array<{ id?: string; employee_id?: string | null; employee_name?: string | null; remarks?: string | null; notes?: string | null; base_salary?: number | null; labor_insurance?: number | null; health_insurance?: number | null; tax?: number | null; bonus?: number | null; allowance?: number | null; deduction?: number | null; net_salary?: number | null }> }>

      for (const monthRow of monthRows) {
        const monthKeyValue = `${monthRow.year || new Date().getFullYear()}-${String(monthRow.month).padStart(2, '0')}`
        const detailRows = monthRow.salary_items || []

        for (const detailRow of detailRows) {
          const rawRemarks = detailRow.remarks || detailRow.notes
          const parsedRemarks = rawRemarks ? (() => {
            try {
              return JSON.parse(rawRemarks)
            } catch {
              return { remark: rawRemarks }
            }
          })() : null

          const base = createEmptyEmployee()
          const employeeModel: Employee = {
            ...base,
            ...(parsedRemarks || {}),
            id: detailRow.id || parsedRemarks?.id || base.id,
            employeeId: detailRow.employee_id || parsedRemarks?.employeeId,
            name: parsedRemarks?.name || detailRow.employee_name || base.name,
            month: monthKeyValue,
            baseSalary: detailRow.base_salary ?? parsedRemarks?.baseSalary ?? base.baseSalary,
            positionAllowance: parsedRemarks?.positionAllowance ?? base.positionAllowance,
            otherAllowance: detailRow.allowance ?? parsedRemarks?.otherAllowance ?? base.otherAllowance,
            nightAllowance: parsedRemarks?.nightAllowance ?? base.nightAllowance,
            bonusItems: detailRow.bonus ?? parsedRemarks?.bonusItems ?? base.bonusItems,
            otherAdditions: parsedRemarks?.otherAdditions ?? base.otherAdditions,
            specialLeaveAllowance: parsedRemarks?.specialLeaveAllowance ?? base.specialLeaveAllowance,
            weekdayOT: parsedRemarks?.weekdayOT ?? base.weekdayOT,
            restDayOT: parsedRemarks?.restDayOT ?? base.restDayOT,
            holidayOT: parsedRemarks?.holidayOT ?? base.holidayOT,
            sickLeaveDeduction: parsedRemarks?.sickLeaveDeduction ?? base.sickLeaveDeduction,
            laborInsurance: detailRow.labor_insurance ?? parsedRemarks?.laborInsurance ?? base.laborInsurance,
            healthInsurance: detailRow.health_insurance ?? parsedRemarks?.healthInsurance ?? base.healthInsurance,
            laborPension: parsedRemarks?.laborPension ?? base.laborPension,
            incomeTax: detailRow.tax ?? parsedRemarks?.incomeTax ?? base.incomeTax,
            otherDeductions: detailRow.deduction ?? parsedRemarks?.otherDeductions ?? base.otherDeductions,
            annualLeaveRemaining: parsedRemarks?.annualLeaveRemaining ?? base.annualLeaveRemaining,
            carriedOverLeave: parsedRemarks?.carriedOverLeave ?? base.carriedOverLeave,
            companyPensionContribution: parsedRemarks?.companyPensionContribution ?? base.companyPensionContribution,
            monthlyPensionContribution: parsedRemarks?.monthlyPensionContribution ?? base.monthlyPensionContribution,
            netSalary: detailRow.net_salary ?? parsedRemarks?.netSalary ?? base.netSalary,
            remark: parsedRemarks?.remark || monthRow.notes || '',
          }

          // Fallback payDate from month record if empty
          if (!employeeModel.payDate && monthRow.payroll_date) {
            employeeModel.payDate = monthRow.payroll_date
          }

          // Fallback store and hireDate from master_employees if empty
          const masterInfo: { store: string; hireDate: string } | undefined =
            (employeeModel.employeeId && masterById[employeeModel.employeeId]) ||
            (employeeModel.name && employeeModel.name.trim() ? masterByName[employeeModel.name.trim()] : undefined)

          if (!employeeModel.store && masterInfo?.store) {
            employeeModel.store = masterInfo.store as any
          }
          if (!employeeModel.hireDate && masterInfo?.hireDate) {
            employeeModel.hireDate = masterInfo.hireDate
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
      const normalizedPayrollDate = this.normalizeDateValue(salaryData.payDate)

      let employeeId: string | null = salaryData.employeeId && isValidUuid(salaryData.employeeId) ? salaryData.employeeId : null
      const { employeeId: resolvedEmployeeId, employeeName } = await this.resolveEmployeeName(salaryData, employeeId)
      employeeId = resolvedEmployeeId

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
          payroll_date: normalizedPayrollDate,
          status: 'draft',
          notes: salaryData.remark || monthStr,
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
          payroll_date: normalizedPayrollDate,
          status: 'draft',
          notes: salaryData.remark || monthStr,
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

      const employeeInputs: Partial<Employee>[] = Array.isArray((salaryData as any).employees)
        ? ((salaryData as any).employees as Partial<Employee>[])
        : [salaryData]

      const payloadDebugRows: Array<Record<string, any>> = []
      const insertPayloads: Array<Record<string, any>> = []
      const updateTargets: Array<{ id: string; payload: Record<string, any> }> = []
      const insertedRows: any[] = []

      for (const employeeInput of employeeInputs) {
        const { employeeId: resolvedEmployeeIdForRow, employeeName: resolvedEmployeeNameForRow } = await this.resolveEmployeeName(employeeInput, employeeId)
        const payload = this.buildSalaryItemPayload(salaryMonthId, resolvedEmployeeIdForRow, resolvedEmployeeNameForRow, employeeInput)

        payloadDebugRows.push({
          salary_month_id: payload.salary_month_id,
          employee_id: payload.employee_id,
          employee_name: payload.employee_name,
          base_salary: payload.base_salary,
          hourly_wage: this.normalizeNumericValue((employeeInput as any).hourlyWage ?? (employeeInput as any).hourly_wage),
          attendance_days: payload.attendance_days,
          attendance_hours: this.normalizeNumericValue((employeeInput as any).attendanceHours ?? (employeeInput as any).attendance_hours),
          overtime_hours: payload.overtime_hours,
          gross_salary: this.normalizeNumericValue((employeeInput as any).grossSalary ?? (employeeInput as any).gross_salary),
          labor_insurance: payload.labor_insurance,
          health_insurance: payload.health_insurance,
          labor_pension: this.normalizeNumericValue((employeeInput as any).laborPension ?? (employeeInput as any).labor_pension),
          tax: payload.tax,
          bonus: payload.bonus,
          allowance: payload.allowance,
          deduction: payload.deduction,
          net_salary: payload.net_salary,
        })

        const { data: existingDetail, error: findDetailErr } = await supabase
          .from('salary_items')
          .select('id')
          .eq('salary_month_id', salaryMonthId)
          .eq(resolvedEmployeeIdForRow ? 'employee_id' : 'employee_name', resolvedEmployeeIdForRow || resolvedEmployeeNameForRow)
          .maybeSingle()

        if (findDetailErr) {
          console.error('========== salary_items lookup error ==========' )
          console.error(findDetailErr)
          console.error(JSON.stringify(findDetailErr, null, 2))
          throw findDetailErr
        }

        if (existingDetail?.id) {
          updateTargets.push({ id: existingDetail.id, payload })
        } else {
          insertPayloads.push(payload)
        }
      }

      if (insertPayloads.length > 0) {
        const insertResult = await supabase
          .from('salary_items')
          .insert(insertPayloads)
          .select('*')

        console.error(insertResult)
        if (insertResult.error) {
          console.error(insertResult.error)
          console.error(JSON.stringify(insertResult.error, null, 2))
          throw insertResult.error
        }
        insertedRows.push(...(insertResult.data || []))
      }

      for (const target of updateTargets) {
        const updateResult = await supabase
          .from('salary_items')
          .update(target.payload)
          .eq('id', target.id)
          .select('*')
          .single()

        console.error(updateResult)
        if (updateResult.error) {
          console.error(updateResult.error)
          console.error(JSON.stringify(updateResult.error, null, 2))
          throw updateResult.error
        }
        insertedRows.push(updateResult.data)
      }

      const savedDetail = insertedRows[0] || null
      if (!savedDetail) {
        throw new Error('沒有建立任何 salary_items 資料。')
      }

      const savedModel: Employee = {
        ...createEmptyEmployee(),
        ...salaryData,
        id: savedDetail.id,
        employeeId: savedDetail.employee_id || salaryData.employeeId,
        name: savedDetail.employee_name || salaryData.name || '',
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
      const { data: detailRows, error: findDetailErr } = await supabase
        .from('salary_items')
        .select('id, salary_month_id')
        .eq('id', id)

      if (findDetailErr) {
        return errorResult(findDetailErr, 'salary_items', 'deleteSalary')
      }

      const detailRow = detailRows?.[0] ?? null

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

        if (checkErr) {
          return errorResult(checkErr, 'salary_items', 'deleteSalary')
        }

        if (!remainingItems || remainingItems.length === 0) {
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
