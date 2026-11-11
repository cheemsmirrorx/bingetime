import { NextRequest, NextResponse } from "next/server";
import { getCatalogContent } from "@/lib/db/repository";
import { handleRouteError } from "@/lib/api/http";
import type { ContentType } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const q = sp.get("q")?.trim() || "";
    const typeParam = sp.get("type");
    const type: ContentType | null =
      typeParam === "movie" || typeParam === "series" ? typeParam : null;
    const yearParam = sp.get("year");
    const year = yearParam ? parseInt(yearParam, 10) : null;

    const results = await getCatalogContent({
      q: q || null,
      type,
      category: sp.get("category"),
      genre: sp.get("genre"),
      platform: sp.get("platform"),
      year: Number.isFinite(year) ? year : null,
      page: parseInt(sp.get("page") || "1", 10) || 1,
      limit: parseInt(sp.get("limit") || "30", 10) || 30,
    });

    const suggestions = results.items.slice(0, 6).map((item) => ({
      id: item.id,
      slug: item.slug,
      title: item.title,
      content_type: item.content_type,
      release_year: item.release_year,
      rating: item.rating,
      poster: item.poster,
    }));

    return NextResponse.json({
      ...results,
      query: q,
      suggestions,
    });
  } catch (err) {
    return handleRouteError(err);
  }
}

