import { NextRequest, NextResponse } from "next/server";
import { getContentByIdOrSlug, getRelatedContent } from "@/lib/db/repository";
import { apiError, handleRouteError } from "@/lib/api/http";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const content = await getContentByIdOrSlug(id);
    if (!content) {
      return apiError("Content not found", 404);
    }
    const related = await getRelatedContent(content, 6);
    return NextResponse.json({ content, related });
  } catch (err) {
    return handleRouteError(err);
  }
}

