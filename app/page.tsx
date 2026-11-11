import type { Metadata } from "next";
import { buildBrowseSections } from "@/lib/catalog";
import { HomeBrowser } from "@/components/content/HomeBrowser";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "RONIN X STREAM | Home",
  description:
    "Browse featured movies, series, Top 10 trending releases, streaming platforms, and curated collections on RONIN X STREAM.",
};

export default async function HomePage() {
  const { featuredItems, top10Items, rows } = await buildBrowseSections();

  return (
    <HomeBrowser
      mode="home"
      featuredItems={featuredItems}
      top10Items={top10Items}
      rows={rows}
    />
  );
}

