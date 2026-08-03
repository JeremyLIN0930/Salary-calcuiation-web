import { supabase } from '../lib/supabase'
import { Employee } from '../types/employee'
import { RepositoryResult, successResult, errorResult } from './base.repository'

export class SupabaseEmployeeRepository {
  private tableName = 'employees'

  async getAll(): Promise<RepositoryResult<Employee[]>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .order('createdAt', { ascending: false })

      if (error) return errorResult(error)
      return successResult((data as Employee[]) || [])
    } catch (err) {
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

      if (error) return errorResult(error)
      return successResult(data as Employee)
    } catch (err) {
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

      const { data, error } = await supabase
        .from(this.tableName)
        .insert([newEmp])
        .select()
        .single()

      if (error) return errorResult(error)
      return successResult(data as Employee)
    } catch (err) {
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

      if (error) return errorResult(error)
      return successResult(result as Employee)
    } catch (err) {
      return errorResult(err)
    }
  }

  async delete(id: string): Promise<RepositoryResult<boolean>> {
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

  async search(keyword: string): Promise<RepositoryResult<Employee[]>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .or(`name.ilike.%${keyword}%,store.ilike.%${keyword}%`)
        .order('createdAt', { ascending: false })

      if (error) return errorResult(error)
      return successResult((data as Employee[]) || [])
    } catch (err) {
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

      if (error) return errorResult(error)
      return successResult((data as Employee[]) || [])
    } catch (err) {
      return errorResult(err)
    }
  }
}

export const supabaseEmployeeRepository = new SupabaseEmployeeRepository()
