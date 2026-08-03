import { supabase } from '../../lib/supabase'

export async function checkSupabaseConnection(): Promise<{ success: boolean; error: any }> {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .limit(1)

    if (error && error.code !== 'PGRST116') {
      console.error('❌ Supabase Connection Failed')
      console.error('Connection Error Detail:', error)
      return { success: false, error }
    }

    console.log('✅ Supabase Connected')
    return { success: true, error: null }
  } catch (err: any) {
    console.error('❌ Supabase Connection Failed')
    console.error('Connection Catch Detail:', err)
    return { success: false, error: err }
  }
}

// Auto-run connection check on application launch
checkSupabaseConnection()
