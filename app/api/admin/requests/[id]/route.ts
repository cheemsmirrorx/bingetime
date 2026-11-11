import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiError, withAdmin } from "@/lib/api/http";
import { updateCommunityRequestStatus } from "@/lib/db/repository";

const statusSchema = z.object({
  status: z.enum(["pending", "approved", "fulfilled", "rejected"]),
});

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return withAdmin(async () => {
    const { id } = await context.params;
    const body = await req.json();
    const { status } = statusSchema.parse(body);
    const updated = await updateCommunityRequestStatus(id, status);
    if (!updated) return apiError("Request not found", 404);
    return NextResponse.json({ item: updated });
  });
}

