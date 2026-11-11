import { NextRequest, NextResponse } from "next/server";
import { apiError, withAdmin } from "@/lib/api/http";
import { categorySchema } from "@/lib/api/validation";
import { createCategory, removeCategory } from "@/lib/db/repository";

export async function POST(req: NextRequest) {
  return withAdmin(async () => {
    const body = await req.json();
    const parsed = categorySchema.parse(body);
    const created = await createCategory(parsed);
    return NextResponse.json({ category: created }, { status: 201 });
  });
}

export async function DELETE(req: NextRequest) {
  return withAdmin(async () => {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return apiError("Category id is required", 400);
    const ok = await removeCategory(id);
    if (!ok) return apiError("Category not found", 404);
    return NextResponse.json({ success: true });
  });
}

