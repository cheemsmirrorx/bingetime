import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { handleRouteError, withAuth } from "@/lib/api/http";
import { requestPostSchema } from "@/lib/api/validation";
import { createCommunityRequest, getCommunityRequests } from "@/lib/db/repository";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const statusFilter = req.nextUrl.searchParams.get("status");
    let items = await getCommunityRequests(user?.id ?? null);
    if (statusFilter && statusFilter !== "all") {
      items = items.filter((r) => r.status === statusFilter);
    }
    return NextResponse.json({ items });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(req: NextRequest) {
  return withAuth(async (user) => {
    const body = await req.json();
    const parsed = requestPostSchema.parse(body);
    const created = await createCommunityRequest({
      userId: user.id,
      username: user.username,
      title: parsed.title,
      contentType: parsed.content_type,
      releaseYear: parsed.release_year ?? null,
      notes: parsed.notes ?? null,
    });
    return NextResponse.json({ item: created }, { status: 201 });
  });
}

