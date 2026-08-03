import { supabase } from '../lib/supabase'
import { MasterEmployee } from '../types/masterEmployee'
import { EmployeeMapper, MasterEmployeeDbRow } from '../mappers/EmployeeMapper'
import { RepositoryResult, successResult, errorResult } from './base.repository'

export class SupabaseEmployeeRepository {
  private tableName = 'master_employees'

  async getAll(): Promise<RepositoryResult<MasterEmployee[]>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('[EmployeeRepo] DB error on getAll:', error.message)
        return errorResult(error.message)
      }
      const models = (data || []).map((row: MasterEmployeeDbRow) => EmployeeMapper.toModel(row))
      return successResult(models)
    } catch (err: any) {
      console.error('[EmployeeRepo] Exception on getAll:', err)
      return errorResult(err.message || String(err))
    }
  }

  async getById(id: string): Promise<RepositoryResult<MasterEmployee | null>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('[EmployeeRepo] DB error on getById:', error.message)
        return errorResult(error.message)
      }
      if (!data) return successResult(null)
      return successResult(EmployeeMapper.toModel(data as MasterEmployeeDbRow))
    } catch (err: any) {
      console.error('[EmployeeRepo] Exception on getById:', err)
      return errorResult(err.message || String(err))
    }
  }

  async create(employee: Partial<MasterEmployee>): Promise<RepositoryResult<MasterEmployee>> {
    try {
      const dbRow = EmployeeMapper.toDbRow(employee)
      const { data, error } = await supabase
        .from(this.tableName)
        .insert([dbRow])
        .select('*')
        .single()

      if (error) {
        console.error('[EmployeeRepo] DB error on create:', error.message)
        return errorResult(error.message)
      }
      return successResult(EmployeeMapper.toModel(data as MasterEmployeeDbRow))
    } catch (err: any) {
      console.error('[EmployeeRepo] Exception on create:', err)
      return errorResult(err.message || String(err))
    }
  }

  async update(id: string, data: Partial<MasterEmployee>): Promise<RepositoryResult<MasterEmployee>> {
    try {
      const dbRow = EmployeeMapper.toDbRow({ ...data, id })
      const { data: resultData, error } = await supabase
        .from(this.tableName)
        .update(dbRow)
        .eq('id', id)
        .select('*')
        .single()

      if (error) {
        console.error('[EmployeeRepo] DB error on update:', error.message)
        return errorResult(error.message)
      }
      return successResult(EmployeeMapper.toModel(resultData as MasterEmployeeDbRow))
    } catch (err: any) {
      console.error('[EmployeeRepo] Exception on update:', err)
      return errorResult(err.message || String(err))
    }
  }

  async delete(id: string): Promise<RepositoryResult<boolean>> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id)

      if (error) {
        console.error('[EmployeeRepo] DB error on delete:', error.message)
        return errorResult(error.message)
      }
      return successResult(true)
    } catch (err: any) {
      console.error('[EmployeeRepo] Exception on delete:', err)
      return errorResult(err.message || String(err))
    }
  }

  async search(query: string): Promise<RepositoryResult<MasterEmployee[]>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .ilike('name', `%${query}%`)
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('[EmployeeRepo] DB error on search:', error.message)
        return errorResult(error.message)
      }
      const models = (data || []).map((row: MasterEmployeeDbRow) => EmployeeMapper.toModel(row))
      return successResult(models)
    } catch (err: any) {
      console.error('[EmployeeRepo] Exception on search:', err)
      return errorResult(err.message || String(err))
    }
  }
}

export const supabaseEmployeeRepository = new SupabaseEmployeeRepository()
