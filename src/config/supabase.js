import { createClient } from '@supabase/supabase-js';
import env from './env.js';

let supabase = null;
let supabaseAdmin = null;

export function getSupabaseClient() {
  if (!env.supabase.url || !env.supabase.anonKey) {
    return null;
  }

  if (!supabase) {
    supabase = createClient(env.supabase.url, env.supabase.anonKey);
  }

  return supabase;
}

export function getSupabaseAdminClient() {
  if (!env.supabase.url || !env.supabase.serviceRoleKey) {
    return null;
  }

  if (!supabaseAdmin) {
    supabaseAdmin = createClient(env.supabase.url, env.supabase.serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return supabaseAdmin;
}

export default getSupabaseClient;
