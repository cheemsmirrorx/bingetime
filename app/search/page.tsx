import type { Metadata } from "next";
import { Suspense } from "react";
import { getCatalogContent, getCategories } from "@/lib/db/repository";
import { SearchClient } from "@/components/content/SearchClient";
import { GridSkeleton } from "@/components/content/Skeletons";
import type { ContentType } from "@/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Search | RONIN X STREAM",
  description: "Search and filter movies and TV series by title, genre, category, platform, and release year.",
};

export default async function SearchPage(context: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await context.searchParams;
  const pick = (key: string) => (typeof sp[key] === "string" ? sp[key] : "");
  const q = pick("q");
  const typeStr = pick("type");
  const type: ContentType | null = typeStr === "movie" || typeStr === "series" ? typeStr : null;
  const category = pick("category") || null;
  const genre = pick("genre") || null;
  const platform = pick("platform") || null;
  const yearNum = pick("year") ? parseInt(pick("year"), 10) : null;

  const [initialData, categories, allCatalog] = await Promise.all([
    getCatalogContent({
      q: q || null,
      type,
      category,
      genre,
      platform,
      year: Number.isFinite(yearNum) ? yearNum : null,
      page: 1,
      limit: 24,
    }),
    getCategories(),
    getCatalogContent({ limit: 100 }),
  ]);

  const availableYears = Array.from(
    new Set(allCatalog.items.map((item) => item.release_year))
  ).sort((a, b) => b - a);

  return (
    <Suspense
      fallback={
        <div className="min-h-screen pt-24 pb-16 px-4 md:px-12 max-w-[1600px] mx-auto">
          <GridSkeleton count={12} />
        </div>
      }
    >
      <SearchClient
        categories={categories}
        availableYears={availableYears}
        initialItems={initialData.items}
        initialTotal={initialData.total}
        initialHasMore={initialData.hasMore}
      />
    </Suspense>
  );
}

