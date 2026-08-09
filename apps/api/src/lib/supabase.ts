import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseAdminInstance: SupabaseClient | null = null;

/**
 * Returns a server-side privileged Supabase client using the service role key.
 * Fails fast with a descriptive error if environment variables are missing.
 * MUST NEVER be called or imported on the client/browser side.
 */
export function getSupabaseAdminClient(): SupabaseClient {
  if (supabaseAdminInstance) {
    return supabaseAdminInstance;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing Supabase server configuration. Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are defined in your environment.'
    );
  }

  supabaseAdminInstance = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return supabaseAdminInstance;
}
