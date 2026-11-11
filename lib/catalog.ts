import { getCatalogContent, getCategories } from "@/lib/db/repository";
import type { Category, ContentItem, ContentType } from "@/types";

export interface CatalogRow {
  title: string;
  slug: string;
  items: ContentItem[];
}

export interface BrowseSectionsData {
  featuredItems: ContentItem[];
  top10Items: ContentItem[];
  rows: CatalogRow[];
}

function matchesCategorySlug(item: ContentItem, slug: string): boolean {
  const lower = slug.toLowerCase();
  if (item.category.toLowerCase() === lower) return true;
  if ((item.metadata?.collections ?? []).some((col) => col.toLowerCase() === lower)) return true;
  if (lower === "action") return item.genres.some((g) => g.toLowerCase() === "action");
  if (lower === "science-fiction" || lower === "sci-fi") {
    return item.genres.some((g) => g.toLowerCase() === "sci-fi" || g.toLowerCase() === "science fiction");
  }
  return false;
}

/**
 * Builds the featured hero slides, Top 10 list, and horizontal category rows
 * for the Home, Movies, and Series views using a single catalog query.
 */
export async function buildBrowseSections(type?: ContentType): Promise<BrowseSectionsData> {
  const [{ items }, categories] = await Promise.all([
    getCatalogContent({ type: type ?? null, limit: 100 }),
    getCategories(),
  ]);

  const featuredPrimary = items.filter((item) => item.featured);
  const featuredItems =
    featuredPrimary.length >= 3
      ? featuredPrimary.slice(0, 8)
      : [
          ...featuredPrimary,
          ...items.filter((i) => !i.featured).sort((a, b) => b.rating - a.rating),
        ].slice(0, 8);

  const rankedTop10 = items
    .filter((item) => matchesCategorySlug(item, "top-10") || item.metadata?.top10_rank != null)
    .sort((a, b) => (a.metadata?.top10_rank ?? 99) - (b.metadata?.top10_rank ?? 99));

  const top10Items =
    rankedTop10.length >= 5
      ? rankedTop10.slice(0, 10)
      : [...rankedTop10, ...items.filter((i) => !rankedTop10.some((t) => t.id === i.id)).sort((a, b) => b.rating - a.rating)].slice(0, 10);

  const rows: CatalogRow[] = [];
  for (const cat of categories) {
    if (cat.slug === "top-10") continue;
    if (type === "movie" && cat.slug === "latest-series") continue;
    if (type === "series" && cat.slug === "latest-movies") continue;

    const matched = items.filter((item) => matchesCategorySlug(item, cat.slug));
    if (matched.length > 0) {
      rows.push({
        title: cat.name,
        slug: cat.slug,
        items: matched.slice(0, 18),
      });
    }
  }

  // On Series view, append genre-based rows when franchise movie collections do not apply
  if (type === "series") {
    const extraGenres = ["Animation", "Crime", "Drama", "Fantasy"];
    for (const genre of extraGenres) {
      const slug = genre.toLowerCase();
      if (rows.some((r) => r.slug === slug)) continue;
      const matched = items.filter((i) => i.genres.some((g) => g.toLowerCase() === slug));
      if (matched.length >= 2) {
        rows.push({ title: `${genre} Series`, slug, items: matched.slice(0, 18) });
      }
    }
  }

  return { featuredItems, top10Items, rows };
}

export function resolveBrowseHeading(
  slug: string,
  categories: Category[]
): { title: string; filterType: "category" | "genre" | "all"; value: string } {
  const normalized = slug.toLowerCase();
  const matchedCat = categories.find((c) => c.slug.toLowerCase() === normalized);
  if (matchedCat) {
    return { title: matchedCat.name, filterType: "category", value: matchedCat.slug };
  }
  if (normalized === "all" || normalized === "catalog") {
    return { title: "All Titles", filterType: "all", value: "" };
  }
  if (normalized === "sci-fi" || normalized === "science-fiction") {
    return { title: "Sci-Fi", filterType: "genre", value: "Sci-Fi" };
  }
  const formatted = slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
  return { title: formatted, filterType: "genre", value: formatted };
}

