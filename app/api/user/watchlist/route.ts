import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/http";
import { watchlistPostSchema } from "@/lib/api/validation";
import { addToUserWatchlist, getUserWatchlist } from "@/lib/db/repository";

export async function GET() {
  return withAuth(async (user) => {
    const items = await getUserWatchlist(user.id);
    return NextResponse.json({ items });
  });
}

export async function POST(req: NextRequest) {
  return withAuth(async (user) => {
    const body = await req.json();
    const { content_id } = watchlistPostSchema.parse(body);
    const entry = await addToUserWatchlist(user.id, content_id);
    return NextResponse.json({ item: entry }, { status: 201 });
  });
}

