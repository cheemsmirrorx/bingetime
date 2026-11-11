import type { Metadata } from "next";
import { buildBrowseSections } from "@/lib/catalog";
import { HomeBrowser } from "@/components/content/HomeBrowser";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Movies | RONIN X STREAM",
  description: "Explore curated feature films across action, sci-fi, franchises, and latest arrivals.",
};

export default async function MoviesPage() {
  const { featuredItems, top10Items, rows } = await buildBrowseSections("movie");

  return (
    <HomeBrowser
      mode="movies"
      featuredItems={featuredItems}
      top10Items={top10Items}
      rows={rows}
    />
  );
}

