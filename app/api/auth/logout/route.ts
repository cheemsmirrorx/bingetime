import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { LOCAL_SESSION_COOKIE } from "@/lib/auth/session";

export async function POST() {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient();
    await supabase?.auth.signOut();
  }
  const res = NextResponse.json({ success: true });
  res.cookies.set(LOCAL_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}

