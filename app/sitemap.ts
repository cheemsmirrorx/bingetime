import type { MetadataRoute } from "next";
import { getCatalogContent } from "@/lib/db/repository";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const staticPaths = [
    "",
    "/movies",
    "/series",
    "/search",
    "/requests",
    "/privacy-policy",
    "/dmca",
    "/credits",
  ];

  const entries: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
  }));

  try {
    const { items } = await getCatalogContent({ limit: 100 });
    for (const item of items) {
      const prefix = item.content_type === "series" ? "/tv-shows" : "/movie";
      entries.push({
        url: `${baseUrl}${prefix}/${item.slug}`,
        lastModified: new Date(item.created_at),
      });
    }
  } catch {
    // fallback gracefully to static routes only
  }

  return entries;
}

