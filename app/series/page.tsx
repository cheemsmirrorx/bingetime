import type { Metadata } from "next";
import { buildBrowseSections } from "@/lib/catalog";
import { HomeBrowser } from "@/components/content/HomeBrowser";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "TV Shows & Series | RONIN X STREAM",
  description: "Stream curated TV shows, limited series, and anime seasons on RONIN X STREAM.",
};

export default async function SeriesPage() {
  const { featuredItems, top10Items, rows } = await buildBrowseSections("series");

  return (
    <HomeBrowser
      mode="series"
      featuredItems={featuredItems}
      top10Items={top10Items}
      rows={rows}
    />
  );
}

