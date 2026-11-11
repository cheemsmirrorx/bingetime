import type { Metadata } from "next";
import { getCatalogContent, getCategories } from "@/lib/db/repository";
import { resolveBrowseHeading } from "@/lib/catalog";
import { BrowseGridClient } from "@/components/content/BrowseGridClient";
import type { ContentType } from "@/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(context: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await context.params;
  const categories = await getCategories();
  const resolved = resolveBrowseHeading(slug, categories);

  return {
    title: `${resolved.title} | RONIN X STREAM`,
    description: `Browse ${resolved.title} movies and series in HD on RONIN X STREAM.`,
  };
}

export default async function BrowseCategoryPage(context: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const [{ slug }, sp, categories, allCatalog] = await Promise.all([
    context.params,
    context.searchParams,
    getCategories(),
    getCatalogContent({ limit: 100 }),
  ]);

  const resolved = resolveBrowseHeading(slug, categories);
  const typeParam: ContentType | null =
    sp.type === "movie" || sp.type === "series" ? sp.type : null;

  const initialData = await getCatalogContent({
    type: typeParam,
    category: resolved.filterType === "category" ? resolved.value : null,
    genre: resolved.filterType === "genre" ? resolved.value : null,
    limit: 24,
    page: 1,
  });

  const availableYears = Array.from(
    new Set(allCatalog.items.map((item) => item.release_year))
  ).sort((a, b) => b - a);

  return (
    <BrowseGridClient
      heading={resolved.title}
      filterType={resolved.filterType}
      filterValue={resolved.value}
      initialType={typeParam}
      initialItems={initialData.items}
      initialTotal={initialData.total}
      initialHasMore={initialData.hasMore}
      availableYears={availableYears}
    />
  );
}

