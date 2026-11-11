import { NextRequest, NextResponse } from "next/server";
import { apiError, withAuth } from "@/lib/api/http";
import { toggleCommunityRequestVote } from "@/lib/db/repository";

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return withAuth(async (user) => {
    const { id } = await context.params;
    const updated = await toggleCommunityRequestVote(id, user.id);
    if (!updated) {
      return apiError("Request not found", 404);
    }
    return NextResponse.json({ item: updated });
  });
}

