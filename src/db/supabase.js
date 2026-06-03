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
  const { url, anonKey, configured } = getSupabaseConfigInfo();

  if (!configured) {
    return null;
  }

  if (!client) {
    client = createClient(url, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  }

  return client;
}
