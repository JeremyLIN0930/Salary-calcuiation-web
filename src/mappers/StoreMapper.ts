/**
 * StoreMapper.ts
 * Maps between React Store Model and Supabase StoreRow.
 * Strictly validates UUIDs to avoid "invalid input syntax for type uuid".
 */

import { Store } from '../types/store'
import { StoreRow } from '../types/database'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isValidUuid(val?: string | null): boolean {
  return typeof val === 'string' && UUID_REGEX.test(val)
}

export class StoreMapper {
  static toModel(row: StoreRow): Store {
    return {
      id: row.id || '',
      code: row.store_code || '',
      storeNo: row.store_no || (row.store_code === '001' ? '251732' : row.store_code === '002' ? '129213' : row.store_code || ''),
      name: row.store_name || '',
      address: row.address || '',
      phone: row.phone || '',
    }
  }

  static toDbRow(model: Partial<Store>): StoreRow {
    const now = new Date().toISOString()
    const row: StoreRow = {
      store_code: model.code || null,
      store_no: model.storeNo || null,
      store_name: model.name || '',
      address: model.address || null,
      phone: model.phone || null,
      is_active: true,
      updated_at: now,
      created_at: now,
    }

    if (isValidUuid(model.id)) {
      row.id = model.id!
    }

    return row
  }
}
