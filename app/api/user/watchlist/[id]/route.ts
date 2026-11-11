import { NextRequest, NextResponse } from "next/server";
import { apiError, withAuth } from "@/lib/api/http";
import { removeFromUserWatchlist } from "@/lib/db/repository";

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return withAuth(async (user) => {
    const { id } = await context.params;
    const removed = await removeFromUserWatchlist(user.id, id);
    if (!removed) {
      return apiError("Watchlist entry not found", 404);
    }
    return NextResponse.json({ success: true });
  });
}

