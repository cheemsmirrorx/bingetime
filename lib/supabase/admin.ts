import { createClient } from "@supabase/supabase-js";
import { getSupabasePublicConfig, isSupabaseAdminConfigured } from "./config";

/**
 * Server-only Supabase admin client using SUPABASE_SERVICE_ROLE_KEY.
 * Never import this file from client components.
 */
export function createAdminSupabaseClient() {
  if (!isSupabaseAdminConfigured()) {
    return null;
  }
  const { url } = getSupabasePublicConfig();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!.trim();

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

