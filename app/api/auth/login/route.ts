import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/lib/api/validation";
import { apiError, handleRouteError } from "@/lib/api/http";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getLocalUserRecordByEmail } from "@/lib/db/local-store";
import {
  LOCAL_SESSION_COOKIE,
  signSessionToken,
  verifyPassword,
} from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, rememberMe } = loginSchema.parse(body);

    if (isSupabaseConfigured()) {
      const supabase = await createServerSupabaseClient();
      if (!supabase) return apiError("Supabase unavailable", 500);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.user) {
        return apiError(error?.message || "Invalid email or password", 401);
      }
      const { data: profile } = await supabase
        .from("users")
        .select("id, username, email, avatar, role, created_at")
        .eq("id", data.user.id)
        .single();
      return NextResponse.json({ user: profile ?? { id: data.user.id, email: data.user.email } });
    }

    const record = getLocalUserRecordByEmail(email);
    if (!record || !verifyPassword(password, record.passwordHash)) {
      return apiError("Invalid email or password", 401);
    }

    const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7;
    const token = signSessionToken(record.id, maxAge);
    const res = NextResponse.json({
      user: {
        id: record.id,
        username: record.username,
        email: record.email,
        avatar: record.avatar,
        role: record.role,
        created_at: record.created_at,
      },
    });

    res.cookies.set(LOCAL_SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge,
    });
    return res;
  } catch (err) {
    return handleRouteError(err);
  }
}

