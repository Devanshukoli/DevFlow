/// <reference types="vite/client" />
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseConfigStatus } from './types.js';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseConfigStatus(): SupabaseConfigStatus {
  const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env;
  const url = process.env.SUPABASE_URL || metaEnv?.VITE_SUPABASE_URL || '';
  const key = process.env.SUPABASE_ANON_KEY || metaEnv?.VITE_SUPABASE_ANON_KEY || '';

  const urlProvided = Boolean(url && url !== 'https://your-project.supabase.co');
  const keyProvided = Boolean(key && key !== 'your-anon-key-here');
  const configured = urlProvided && keyProvided;

  return {
    configured,
    urlProvided,
    keyProvided,
    message: configured
      ? 'Supabase client initialized & connection configured'
      : 'Supabase credentials missing or set to placeholder in .env',
  };
}

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;

  const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env;
  const url = process.env.SUPABASE_URL || metaEnv?.VITE_SUPABASE_URL || '';
  const key = process.env.SUPABASE_ANON_KEY || metaEnv?.VITE_SUPABASE_ANON_KEY || '';

  if (!url || !key || url === 'https://your-project.supabase.co' || key === 'your-anon-key-here') {
    return null;
  }

  try {
    supabaseInstance = createClient(url, key);
    return supabaseInstance;
  } catch (error) {
    console.warn('Failed to initialize Supabase client:', error);
    return null;
  }
}
