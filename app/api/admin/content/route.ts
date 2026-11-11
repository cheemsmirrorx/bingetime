import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/lib/api/http";
import { adminContentSchema } from "@/lib/api/validation";
import { createOrUpdateContent, getCatalogContent } from "@/lib/db/repository";

export async function GET(req: NextRequest) {
  return withAdmin(async () => {
    const q = req.nextUrl.searchParams.get("q");
    const data = await getCatalogContent({ q, limit: 100 });
    return NextResponse.json(data);
  });
}

export async function POST(req: NextRequest) {
  return withAdmin(async () => {
    const body = await req.json();
    const parsed = adminContentSchema.parse(body);
    const created = await createOrUpdateContent(parsed);
    return NextResponse.json({ item: created }, { status: 201 });
  });
}

