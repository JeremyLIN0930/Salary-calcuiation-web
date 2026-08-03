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
      console.log('🚀 [SupabaseEmployeeRepository.create] INSERT Payload:', JSON.stringify(dbRow, null, 2))

      const { data, error } = await supabase
        .from(this.tableName)
        .insert([dbRow])
        .select('*')
        .single()

      if (error) {
        console.error('❌ [SupabaseEmployeeRepository.create] Error:', error)
        return errorResult(error, this.tableName, 'create')
      }
      console.log('✅ [SupabaseEmployeeRepository.create] Success:', data)
      return successResult(EmployeeMapper.toModel(data as MasterEmployeeRow))
    } catch (err: unknown) {
      console.error('❌ [SupabaseEmployeeRepository.create] Exception:', err)
      return errorResult(err, this.tableName, 'create')
    }
  }

  async update(id: string, data: Partial<MasterEmployee>): Promise<RepositoryResult<MasterEmployee>> {
    try {
      const dbRow = EmployeeMapper.toDbRow({ ...data, id })
      console.log('🚀 [SupabaseEmployeeRepository.update] UPDATE Payload:', JSON.stringify(dbRow, null, 2))

      const { data: resultData, error } = await supabase
        .from(this.tableName)
        .update(dbRow)
        .eq('id', id)
        .select('*')
        .single()

      if (error) {
        console.error('❌ [SupabaseEmployeeRepository.update] Error:', error)
        return errorResult(error, this.tableName, 'update')
      }
      console.log('✅ [SupabaseEmployeeRepository.update] Success:', resultData)
      return successResult(EmployeeMapper.toModel(resultData as MasterEmployeeRow))
    } catch (err: unknown) {
      console.error('❌ [SupabaseEmployeeRepository.update] Exception:', err)
      return errorResult(err, this.tableName, 'update')
    }
  }

  async delete(id: string): Promise<RepositoryResult<boolean>> {
    try {
      console.log('🚀 [SupabaseEmployeeRepository.delete] Target ID:', id)
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id)

      if (error) {
        console.error('❌ [SupabaseEmployeeRepository.delete] Error:', error)
        return errorResult(error, this.tableName, 'delete')
      }
      console.log('✅ [SupabaseEmployeeRepository.delete] Success')
      return successResult(true)
    } catch (err: unknown) {
      console.error('❌ [SupabaseEmployeeRepository.delete] Exception:', err)
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
