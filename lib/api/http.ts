import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireAdmin, requireAuth } from "@/lib/auth/session";
import type { UserProfile } from "@/types";

export function apiError(message: string, status = 400, details?: unknown) {
  return NextResponse.json(
    { error: message, ...(details ? { details } : {}) },
    { status }
  );
}

export function handleRouteError(err: unknown) {
  if (err instanceof ZodError) {
    return apiError(err.issues[0]?.message || "Validation error", 400, err.issues);
  }
  if (err instanceof Error) {
    if (err.message === "UNAUTHORIZED") {
      return apiError("Authentication required", 401);
    }
    if (err.message === "FORBIDDEN") {
      return apiError("Administrator access required", 403);
    }
    if (err.message === "EMAIL_EXISTS") {
      return apiError("An account with this email already exists", 409);
    }
    if (err.message === "USERNAME_EXISTS") {
      return apiError("This username is already taken", 409);
    }
    if (err.message === "CONTENT_NOT_FOUND") {
      return apiError("Content item not found", 404);
    }
    if (err.message === "CATEGORY_EXISTS") {
      return apiError("Category already exists", 409);
    }
    return apiError(err.message || "Internal server error", 500);
  }
  return apiError("Internal server error", 500);
}

export async function withAuth(
  handler: (user: UserProfile) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const user = await requireAuth();
    return await handler(user);
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function withAdmin(
  handler: (admin: UserProfile) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const admin = await requireAdmin();
    return await handler(admin);
  } catch (err) {
    return handleRouteError(err);
  }
}

