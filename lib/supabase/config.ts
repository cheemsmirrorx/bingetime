export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  return Boolean(url && anonKey && url.startsWith("http"));
}

export function isSupabaseAdminConfigured(): boolean {
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return isSupabaseConfigured() && Boolean(serviceRole);
}

export function getSupabasePublicConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "",
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ?? "",
  };
}

