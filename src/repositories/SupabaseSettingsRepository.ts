import { supabase } from '../lib/supabase'
import { SettingsMapper, AppSettingsDbRow } from '../mappers/SettingsMapper'
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
        console.error('[SettingsRepo] DB error on getSettings:', error.message)
        return errorResult(error.message)
      }
      if (!data || data.length === 0) {
        return successResult({})
      }
      return successResult(SettingsMapper.toModel(data[0] as AppSettingsDbRow))
    } catch (err: any) {
      console.error('[SettingsRepo] Exception on getSettings:', err)
      return errorResult(err.message || String(err))
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
        console.error('[SettingsRepo] DB error on saveSettings:', error.message)
        return errorResult(error.message)
      }
      return successResult(SettingsMapper.toModel(data as AppSettingsDbRow))
    } catch (err: any) {
      console.error('[SettingsRepo] Exception on saveSettings:', err)
      return errorResult(err.message || String(err))
    }
  }
}

export const supabaseSettingsRepository = new SupabaseSettingsRepository()
