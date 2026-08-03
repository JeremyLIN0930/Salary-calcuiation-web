import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

const PLACEHOLDER_URL = 'https://your-supabase-project.supabase.co'
const isValidUrl = supabaseUrl && supabaseUrl !== PLACEHOLDER_URL && supabaseUrl.includes('supabase.co')
const isValidKey = supabaseAnonKey && supabaseAnonKey !== 'your-anon-key-here' && supabaseAnonKey.length > 10

export const isSupabaseEnvConfigured = Boolean(isValidUrl && isValidKey)

if (!isSupabaseEnvConfigured) {
  console.warn('⚠️ Missing Supabase Environment Variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env')
} else {
  console.log('🔧 Supabase client initializing...', supabaseUrl)
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
