/**
 * StoreMapper.ts
 * Maps between React Store Model and Supabase stores DB Row.
 */

import { Store } from '../types/store'

export interface StoreDbRow {
  id: string
  store_code?: string | null
  store_name: string
  phone?: string | null
  address?: string | null
  manager_name?: string | null
  is_active?: boolean | null
  company_id?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export class StoreMapper {
  static toModel(row: StoreDbRow): Store {
    return {
      id: row.id,
      name: row.store_name || '',
      address: row.address || '',
      phone: row.phone || '',
    }
  }

  static toDbRow(model: Partial<Store>): StoreDbRow {
    const now = new Date().toISOString()
    return {
      id: model.id || Math.random().toString(36).slice(2),
      store_code: model.id || null,
      store_name: model.name || '',
      address: model.address || null,
      phone: model.phone || null,
      is_active: true,
      updated_at: now,
      created_at: now,
    }
  }
}
