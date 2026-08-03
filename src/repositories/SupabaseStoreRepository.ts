import { supabase } from '../lib/supabase'
import { Store } from '../types/store'
import { StoreRow } from '../types/database'
import { StoreMapper } from '../mappers/StoreMapper'
import { RepositoryResult, successResult, errorResult } from './base.repository'

export class SupabaseStoreRepository {
  private tableName = 'stores'

  async getAll(): Promise<RepositoryResult<Store[]>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .order('updated_at', { ascending: false })

      if (error) {
        return errorResult(error, this.tableName, 'getAll')
      }
      const rows = (data || []) as StoreRow[]
      const models = rows.map(row => StoreMapper.toModel(row))
      return successResult(models)
    } catch (err: unknown) {
      return errorResult(err, this.tableName, 'getAll')
    }
  }

  async getStores(): Promise<RepositoryResult<Store[]>> {
    return this.getAll()
  }

  async getById(id: string): Promise<RepositoryResult<Store | null>> {
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
      return successResult(StoreMapper.toModel(data as StoreRow))
    } catch (err: unknown) {
      return errorResult(err, this.tableName, 'getById')
    }
  }

  async create(store: Partial<Store>): Promise<RepositoryResult<Store>> {
    try {
      const dbRow = StoreMapper.toDbRow(store)
      const { data, error } = await supabase
        .from(this.tableName)
        .insert([dbRow])
        .select('*')
        .single()

      if (error) {
        return errorResult(error, this.tableName, 'create')
      }
      return successResult(StoreMapper.toModel(data as StoreRow))
    } catch (err: unknown) {
      return errorResult(err, this.tableName, 'create')
    }
  }

  async update(id: string, store: Partial<Store>): Promise<RepositoryResult<Store>> {
    try {
      const dbRow = StoreMapper.toDbRow({ ...store, id })
      const { data, error } = await supabase
        .from(this.tableName)
        .update(dbRow)
        .eq('id', id)
        .select('*')
        .single()

      if (error) {
        return errorResult(error, this.tableName, 'update')
      }
      return successResult(StoreMapper.toModel(data as StoreRow))
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
}

export const supabaseStoreRepository = new SupabaseStoreRepository()
