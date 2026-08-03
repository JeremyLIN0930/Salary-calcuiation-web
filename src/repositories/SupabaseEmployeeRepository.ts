import { supabase } from '../lib/supabase'
import { Employee } from '../types/employee'
import { RepositoryResult, successResult, errorResult } from './base.repository'

export class SupabaseEmployeeRepository {
  // ✅ Correct table: master_employees
  private tableName = 'master_employees'

  async getAll(): Promise<RepositoryResult<Employee[]>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .order('createdAt', { ascending: false })

      if (error) {
        console.error('[EmployeeRepo] getAll error:', error)
        return errorResult(error)
      }
      return successResult((data as Employee[]) || [])
    } catch (err) {
      console.error('[EmployeeRepo] getAll exception:', err)
      return errorResult(err)
    }
  }

  async getById(id: string): Promise<RepositoryResult<Employee>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('[EmployeeRepo] getById error:', error)
        return errorResult(error)
      }
      return successResult(data as Employee)
    } catch (err) {
      console.error('[EmployeeRepo] getById exception:', err)
      return errorResult(err)
    }
  }

  async create(employee: Partial<Employee>): Promise<RepositoryResult<Employee>> {
    try {
      const newEmp = {
        id: employee.id || Math.random().toString(36).slice(2),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...employee,
      }

      console.log('[EmployeeRepo] Inserting into master_employees:', newEmp)

      const { data, error } = await supabase
        .from(this.tableName)
        .insert([newEmp])
        .select()
        .single()

      if (error) {
        console.error('[EmployeeRepo] create error:', error)
        return errorResult(error)
      }
      console.log('[EmployeeRepo] Insert success:', data)
      return successResult(data as Employee)
    } catch (err) {
      console.error('[EmployeeRepo] create exception:', err)
      return errorResult(err)
    }
  }

  async update(id: string, data: Partial<Employee>): Promise<RepositoryResult<Employee>> {
    try {
      const updateData = {
        ...data,
        updatedAt: new Date().toISOString(),
      }

      const { data: result, error } = await supabase
        .from(this.tableName)
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('[EmployeeRepo] update error:', error)
        return errorResult(error)
      }
      return successResult(result as Employee)
    } catch (err) {
      console.error('[EmployeeRepo] update exception:', err)
      return errorResult(err)
    }
  }

  async delete(id: string): Promise<RepositoryResult<boolean>> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id)

      if (error) {
        console.error('[EmployeeRepo] delete error:', error)
        return errorResult(error)
      }
      return successResult(true)
    } catch (err) {
      console.error('[EmployeeRepo] delete exception:', err)
      return errorResult(err)
    }
  }

  async search(keyword: string): Promise<RepositoryResult<Employee[]>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .or(`name.ilike.%${keyword}%,store.ilike.%${keyword}%`)
        .order('createdAt', { ascending: false })

      if (error) {
        console.error('[EmployeeRepo] search error:', error)
        return errorResult(error)
      }
      return successResult((data as Employee[]) || [])
    } catch (err) {
      console.error('[EmployeeRepo] search exception:', err)
      return errorResult(err)
    }
  }

  async getByStore(storeId: string): Promise<RepositoryResult<Employee[]>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('store', storeId)
        .order('name', { ascending: true })

      if (error) {
        console.error('[EmployeeRepo] getByStore error:', error)
        return errorResult(error)
      }
      return successResult((data as Employee[]) || [])
    } catch (err) {
      console.error('[EmployeeRepo] getByStore exception:', err)
      return errorResult(err)
    }
  }
}

export const supabaseEmployeeRepository = new SupabaseEmployeeRepository()
