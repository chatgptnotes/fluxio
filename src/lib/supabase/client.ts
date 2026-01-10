import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Return null-like client if credentials not configured
  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase credentials not configured. Using mock client.')
    return createBrowserClient<Database>(
      'https://placeholder.supabase.co',
      'placeholder-key'
    )
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseKey)
}
