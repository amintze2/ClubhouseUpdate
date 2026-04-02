import { createClient } from "@supabase/supabase-js";

// Fallbacks prevent build-time errors during static prerendering.
// At runtime the real env vars are always present.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://localhost:54321";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder";

/**
 * Creates a Supabase client. When a JWT is provided it is injected as the
 * Authorization header on every request, enabling Row Level Security to run
 * as that user. Without a JWT the anon key is used (pre-auth only).
 */
export function createSupabaseClient(jwt?: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: jwt
      ? { headers: { Authorization: `Bearer ${jwt}` } }
      : undefined,
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/** Anon client for use before authentication. */
export const supabaseAnon = createSupabaseClient();
