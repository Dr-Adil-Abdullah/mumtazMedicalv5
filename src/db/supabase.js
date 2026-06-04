import { createClient } from '@supabase/supabase-js';

let client;

export function getSupabaseConfigInfo() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  return {
    url,
    anonKey,
    configured: Boolean(url && anonKey)
  };
}

export function getSupabaseClient() {
  // Supabase sync is currently disabled to avoid IDBKeyRange errors
  return null;
}
