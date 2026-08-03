import { supabase } from '../lib/supabase'
import { SystemSettings, DEFAULT_SETTINGS } from '../types/settings'
import { RepositoryResult, successResult, errorResult } from './base.repository'

export class SupabaseSettingsRepository {
  // ✅ Correct table: app_settings
  private tableName = 'app_settings'

  async getSettings(): Promise<RepositoryResult<SystemSettings>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .limit(1)

      if (error) {
        console.error('[SettingsRepo] getSettings error:', error)
        return errorResult(error)
      }
      if (!data || data.length === 0) {
        return successResult(DEFAULT_SETTINGS)
      }
      return successResult(data[0] as SystemSettings)
    } catch (err) {
      console.error('[SettingsRepo] getSettings exception:', err)
      return errorResult(err)
    }
  }

  async saveSettings(settingsData: Partial<SystemSettings>): Promise<RepositoryResult<SystemSettings>> {
    try {
      const record = {
        id: '1',
        ...settingsData,
        updatedAt: new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from(this.tableName)
        .upsert([record])
        .select()
        .single()

      if (error) {
        console.error('[SettingsRepo] saveSettings error:', error)
        return errorResult(error)
      }
      return successResult(data as SystemSettings)
    } catch (err) {
      console.error('[SettingsRepo] saveSettings exception:', err)
      return errorResult(err)
    }
  }
}

export const supabaseSettingsRepository = new SupabaseSettingsRepository()
