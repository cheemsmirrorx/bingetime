import { NextRequest, NextResponse } from "next/server";
import { apiError, withAdmin } from "@/lib/api/http";
import { isTmdbConfigured, searchTmdbTitles } from "@/lib/api/tmdb";

export async function GET(req: NextRequest) {
  return withAdmin(async () => {
    const q = req.nextUrl.searchParams.get("q")?.trim();
    if (!q) return apiError("Query parameter q is required", 400);
    if (!isTmdbConfigured()) {
      return NextResponse.json({
        configured: false,
        results: [],
        message: "TMDB_API_KEY is not configured in environment variables.",
      });
    }
    const results = await searchTmdbTitles(q);
    return NextResponse.json({ configured: true, results });
  });
}

