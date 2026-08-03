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
      name: row.store_name || '',
      address: row.address || '',
      phone: row.phone || '',
    }
  }

  static toDbRow(model: Partial<Store>): StoreRow {
    const now = new Date().toISOString()
    const row: StoreRow = {
      store_code: model.id || null,
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
