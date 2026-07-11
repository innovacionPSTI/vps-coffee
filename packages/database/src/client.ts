import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/** Cliente público (browser, anon key) */
export function createBrowserClient() {
  return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey)
}

/** Cliente de servidor con service role (solo en Server Components / API routes) */
export function createServerClient() {
  return createSupabaseClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  })
}
