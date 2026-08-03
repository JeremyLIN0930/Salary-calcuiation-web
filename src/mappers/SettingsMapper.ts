/**
 * SettingsMapper.ts
 * Maps between React Settings Model and Supabase AppSettingRow.
 * Strictly validates UUIDs to avoid "invalid input syntax for type uuid".
 */

import { AppSettingRow } from '../types/database'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isValidUuid(val?: string | null): boolean {
  return typeof val === 'string' && UUID_REGEX.test(val)
}

export class SettingsMapper {
  static toModel(row: AppSettingRow): Record<string, unknown> {
    return {
      id: row.id,
      companyId: row.company_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }

  static toDbRow(model: Record<string, unknown>): AppSettingRow {
    const now = new Date().toISOString()
    const row: AppSettingRow = {
      company_id: isValidUuid(model.companyId as string) ? (model.companyId as string) : null,
      updated_at: (model.updatedAt as string) || now,
    }

    if (isValidUuid(model.id as string)) {
      row.id = model.id as string
    }

    return row
  }
}
