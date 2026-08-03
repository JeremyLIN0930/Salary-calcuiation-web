/**
 * SettingsMapper.ts
 * Maps between React Settings Model and Supabase AppSettingRow.
 */

import { AppSettingRow } from '../types/database'

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
    return {
      id: (model.id as string) || Math.random().toString(36).slice(2),
      company_id: (model.companyId as string) || null,
      updated_at: (model.updatedAt as string) || now,
    }
  }
}
