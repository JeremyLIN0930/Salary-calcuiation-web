/**
 * StoreMapper.ts
 * Maps between React Store Model and Supabase StoreRow.
 */

import { Store } from '../types/store'
import { StoreRow } from '../types/database'

export class StoreMapper {
  static toModel(row: StoreRow): Store {
    return {
      id: row.id,
      name: row.store_name || '',
      address: row.address || '',
      phone: row.phone || '',
    }
  }

  static toDbRow(model: Partial<Store>): StoreRow {
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
