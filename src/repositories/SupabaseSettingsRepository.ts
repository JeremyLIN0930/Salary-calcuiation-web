import { supabase } from '../lib/supabase'
import { AppSettingRow } from '../types/database'
import { SettingsMapper } from '../mappers/SettingsMapper'
import { RepositoryResult, successResult, errorResult } from './base.repository'

export class SupabaseSettingsRepository {
  private tableName = 'app_settings'

  async getSettings(): Promise<RepositoryResult<Record<string, unknown>>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .order('updated_at', { ascending: false })

      if (error) {
        return errorResult(error, this.tableName, 'getSettings')
      }
      if (!data || data.length === 0) {
        return successResult({})
      }
      const rows = data as AppSettingRow[]
      return successResult(SettingsMapper.toModel(rows[0]))
    } catch (err: unknown) {
      return errorResult(err, this.tableName, 'getSettings')
    }
  }

  async saveSettings(settings: Record<string, unknown>): Promise<RepositoryResult<Record<string, unknown>>> {
    try {
      const dbRow = SettingsMapper.toDbRow(settings)
      const { data, error } = await supabase
        .from(this.tableName)
        .upsert([dbRow])
        .select('*')
        .single()

      if (error) {
        return errorResult(error, this.tableName, 'saveSettings')
      }
      return successResult(SettingsMapper.toModel(data as AppSettingRow))
    } catch (err: unknown) {
      return errorResult(err, this.tableName, 'saveSettings')
    }
  }
}

export const supabaseSettingsRepository = new SupabaseSettingsRepository()
