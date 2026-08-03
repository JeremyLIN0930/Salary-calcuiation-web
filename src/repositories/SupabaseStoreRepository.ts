import { supabase } from '../lib/supabase'
import { Store } from '../types/store'
import { StoreMapper, StoreDbRow } from '../mappers/StoreMapper'
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
        console.error('[StoreRepo] DB error on getAll:', error.message)
        return errorResult(error.message)
      }
      const models = (data || []).map((row: StoreDbRow) => StoreMapper.toModel(row))
      return successResult(models)
    } catch (err: any) {
      console.error('[StoreRepo] Exception on getAll:', err)
      return errorResult(err.message || String(err))
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
        console.error('[StoreRepo] DB error on getById:', error.message)
        return errorResult(error.message)
      }
      if (!data) return successResult(null)
      return successResult(StoreMapper.toModel(data as StoreDbRow))
    } catch (err: any) {
      console.error('[StoreRepo] Exception on getById:', err)
      return errorResult(err.message || String(err))
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
        console.error('[StoreRepo] DB error on create:', error.message)
        return errorResult(error.message)
      }
      return successResult(StoreMapper.toModel(data as StoreDbRow))
    } catch (err: any) {
      console.error('[StoreRepo] Exception on create:', err)
      return errorResult(err.message || String(err))
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
        console.error('[StoreRepo] DB error on update:', error.message)
        return errorResult(error.message)
      }
      return successResult(StoreMapper.toModel(data as StoreDbRow))
    } catch (err: any) {
      console.error('[StoreRepo] Exception on update:', err)
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
        console.error('[StoreRepo] DB error on delete:', error.message)
        return errorResult(error.message)
      }
      return successResult(true)
    } catch (err: any) {
      console.error('[StoreRepo] Exception on delete:', err)
      return errorResult(err.message || String(err))
    }
  }
}

export const supabaseStoreRepository = new SupabaseStoreRepository()
