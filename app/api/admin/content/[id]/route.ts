import { NextRequest, NextResponse } from "next/server";
import { apiError, withAdmin } from "@/lib/api/http";
import { adminContentSchema } from "@/lib/api/validation";
import { createOrUpdateContent, getContentByIdOrSlug, removeContent } from "@/lib/db/repository";

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return withAdmin(async () => {
    const { id } = await context.params;
    const existing = await getContentByIdOrSlug(id);
    if (!existing) {
      return apiError("Content item not found", 404);
    }
    const body = await req.json();
    const parsed = adminContentSchema.parse(body);
    const updated = await createOrUpdateContent({ ...parsed, id: existing.id });
    return NextResponse.json({ item: updated });
  });
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return withAdmin(async () => {
    const { id } = await context.params;
    const ok = await removeContent(id);
    if (!ok) {
      return apiError("Content item not found", 404);
    }
    return NextResponse.json({ success: true });
  });
}

