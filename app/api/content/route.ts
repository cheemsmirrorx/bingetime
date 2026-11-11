import { NextRequest, NextResponse } from "next/server";
import { getCatalogContent } from "@/lib/db/repository";
import { handleRouteError } from "@/lib/api/http";
import type { ContentType } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const typeParam = sp.get("type");
    const type: ContentType | null =
      typeParam === "movie" || typeParam === "series" ? typeParam : null;
    const yearParam = sp.get("year");
    const year = yearParam ? parseInt(yearParam, 10) : null;
    const sortParam = sp.get("sort");
    const sort =
      sortParam === "rating" || sortParam === "title" || sortParam === "year" || sortParam === "latest"
        ? sortParam
        : "latest";

    const result = await getCatalogContent({
      type,
      category: sp.get("category"),
      genre: sp.get("genre"),
      platform: sp.get("platform"),
      year: Number.isFinite(year) ? year : null,
      featured: sp.get("featured") === "true" ? true : undefined,
      q: sp.get("q"),
      sort,
      page: parseInt(sp.get("page") || "1", 10) || 1,
      limit: parseInt(sp.get("limit") || "24", 10) || 24,
    });

    return NextResponse.json(result);
  } catch (err) {
    return handleRouteError(err);
  }
}

