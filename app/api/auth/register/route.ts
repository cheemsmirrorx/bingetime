import { NextRequest, NextResponse } from "next/server";
import { registerSchema } from "@/lib/api/validation";
import { apiError, handleRouteError } from "@/lib/api/http";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createLocalUser } from "@/lib/db/local-store";
import {
  hashPassword,
  LOCAL_SESSION_COOKIE,
  signSessionToken,
} from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, email, password } = registerSchema.parse(body);

    if (isSupabaseConfigured()) {
      const supabase = await createServerSupabaseClient();
      if (!supabase) return apiError("Supabase unavailable", 500);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username },
        },
      });
      if (error) {
        return apiError(error.message, 400);
      }
      if (!data.user) {
        return apiError("Registration failed", 400);
      }

      return NextResponse.json(
        {
          user: {
            id: data.user.id,
            username,
            email: data.user.email,
            avatar: null,
            role: "user",
            created_at: data.user.created_at,
          },
          requiresEmailConfirmation: !data.session,
        },
        { status: 201 }
      );
    }

    const user = createLocalUser({
      username,
      email,
      passwordHash: hashPassword(password),
    });

    const maxAge = 60 * 60 * 24 * 7;
    const token = signSessionToken(user.id, maxAge);
    const res = NextResponse.json({ user }, { status: 201 });
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

