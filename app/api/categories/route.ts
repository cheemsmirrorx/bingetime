import { NextResponse } from "next/server";
import { getCategories } from "@/lib/db/repository";
import { handleRouteError } from "@/lib/api/http";
import { GENRE_LIST, PLATFORM_LIST } from "@/database/seed-data";

export async function GET() {
  try {
    const categories = await getCategories();
    return NextResponse.json({
      categories,
      genres: GENRE_LIST,
      platforms: PLATFORM_LIST,
    });
  } catch (err) {
    return handleRouteError(err);
  }
}

