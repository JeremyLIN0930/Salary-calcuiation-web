import { supabase } from '../lib/supabase'
import { Store, DEFAULT_STORES } from '../types/store'
import { RepositoryResult, successResult, errorResult } from './base.repository'

export class SupabaseStoreRepository {
  private tableName = 'stores'

  async getStores(): Promise<RepositoryResult<Store[]>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .order('id', { ascending: true })

      if (error) return errorResult(error)
      if (!data || data.length === 0) {
        return successResult(DEFAULT_STORES)
      }
      return successResult(data as Store[])
    } catch (err) {
      return errorResult(err)
    }
  }

  async createStore(storeData: Partial<Store>): Promise<RepositoryResult<Store>> {
    try {
      const newStore = {
        id: storeData.id || Math.random().toString(36).slice(2),
        ...storeData,
      }

      const { data, error } = await supabase
        .from(this.tableName)
        .insert([newStore])
        .select()
        .single()

      if (error) return errorResult(error)
      return successResult(data as Store)
    } catch (err) {
      return errorResult(err)
    }
  }

  async updateStore(id: string, data: Partial<Store>): Promise<RepositoryResult<Store>> {
    try {
      const { data: result, error } = await supabase
        .from(this.tableName)
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) return errorResult(error)
      return successResult(result as Store)
    } catch (err) {
      return errorResult(err)
    }
  }

  async deleteStore(id: string): Promise<RepositoryResult<boolean>> {
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
}

export const supabaseStoreRepository = new SupabaseStoreRepository()
