import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

// Global singleton pattern to prevent multiple GoTrueClient instances during Turbopack HMR
const globalForSupabase = globalThis as unknown as {
  supabaseClient?: SupabaseClient;
};

export const supabase: SupabaseClient =
  globalForSupabase.supabaseClient ??
  createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'placely-auth-token',
    },
  });

if (process.env.NODE_ENV !== 'production') {
  globalForSupabase.supabaseClient = supabase;
}
