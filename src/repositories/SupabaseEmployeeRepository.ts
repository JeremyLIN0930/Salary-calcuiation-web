import { supabase } from '../lib/supabase'
import { MasterEmployee } from '../types/masterEmployee'
import { MasterEmployeeRow } from '../types/database'
import { EmployeeMapper } from '../mappers/EmployeeMapper'
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
        return errorResult(error, this.tableName, 'getAll')
      }
      const rows = (data || []) as MasterEmployeeRow[]
      const models = rows.map(row => EmployeeMapper.toModel(row))
      return successResult(models)
    } catch (err: unknown) {
      return errorResult(err, this.tableName, 'getAll')
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
        return errorResult(error, this.tableName, 'getById')
      }
      if (!data) return successResult(null)
      return successResult(EmployeeMapper.toModel(data as MasterEmployeeRow))
    } catch (err: unknown) {
      return errorResult(err, this.tableName, 'getById')
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
        return errorResult(error, this.tableName, 'create')
      }
      return successResult(EmployeeMapper.toModel(data as MasterEmployeeRow))
    } catch (err: unknown) {
      return errorResult(err, this.tableName, 'create')
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
        return errorResult(error, this.tableName, 'update')
      }
      return successResult(EmployeeMapper.toModel(resultData as MasterEmployeeRow))
    } catch (err: unknown) {
      return errorResult(err, this.tableName, 'update')
    }
  }

  async delete(id: string): Promise<RepositoryResult<boolean>> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id)

      if (error) {
        return errorResult(error, this.tableName, 'delete')
      }
      return successResult(true)
    } catch (err: unknown) {
      return errorResult(err, this.tableName, 'delete')
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
        return errorResult(error, this.tableName, 'search')
      }
      const rows = (data || []) as MasterEmployeeRow[]
      const models = rows.map(row => EmployeeMapper.toModel(row))
      return successResult(models)
    } catch (err: unknown) {
      return errorResult(err, this.tableName, 'search')
    }
  }
}

export const supabaseEmployeeRepository = new SupabaseEmployeeRepository()
