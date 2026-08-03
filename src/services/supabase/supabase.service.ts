import { supabase } from '../../lib/supabase'

export class SupabaseService {
  /**
   * Test connection to Supabase database.
   * Query 'companies' table and log connection status.
   */
  static async testConnection(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .limit(1)

      if (error) {
        console.error('Supabase Connection Error:', error.message || error)
        return false
      }

      console.log('Supabase Connected')
      if (data) {
        console.log('[Supabase Debug] Data query successful:', data)
      }
      return true
    } catch (err: any) {
      console.error('Supabase Connection Error:', err?.message || err)
      return false
    }
  }
}

// Auto-run connection test when SupabaseService is imported
SupabaseService.testConnection()
