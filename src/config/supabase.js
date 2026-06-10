import { createClient } from '@supabase/supabase-js';
import env from './env.js';

let supabase = null;
let supabaseAdmin = null;
let warnedMissingAnon = false;
let warnedMissingAdmin = false;

function warnMissingAnonClient() {
  if (!warnedMissingAnon) {
    console.warn('Supabase client not initialized: missing SUPABASE_URL or SUPABASE_ANON_KEY');
    warnedMissingAnon = true;
  }
}

function warnMissingAdminClient() {
  if (!warnedMissingAdmin) {
    console.warn(
      'Supabase admin client not initialized: missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY',
    );
    warnedMissingAdmin = true;
  }
}

export function getSupabaseClient() {
  if (!env.supabase.url || !env.supabase.anonKey) {
    warnMissingAnonClient();
    return null;
  }

  if (!supabase) {
    supabase = createClient(env.supabase.url, env.supabase.anonKey);
  }

  return supabase;
}

export function getSupabaseAdminClient() {
  if (!env.supabase.url || !env.supabase.serviceRoleKey) {
    warnMissingAdminClient();
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
