import { supabase } from '../lib/supabase'
import { SystemSettings, DEFAULT_SETTINGS } from '../types/settings'
import { RepositoryResult, successResult, errorResult } from './base.repository'

export class SupabaseSettingsRepository {
  private tableName = 'settings'

  async getSettings(): Promise<RepositoryResult<SystemSettings>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .limit(1)

      if (error) return errorResult(error)
      if (!data || data.length === 0) {
        return successResult(DEFAULT_SETTINGS)
      }
      return successResult(data[0] as SystemSettings)
    } catch (err) {
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

      if (error) return errorResult(error)
      return successResult(data as SystemSettings)
    } catch (err) {
      return errorResult(err)
    }
  }
}

export const supabaseSettingsRepository = new SupabaseSettingsRepository()
