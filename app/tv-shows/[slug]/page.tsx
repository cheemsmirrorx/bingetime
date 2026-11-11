import type { Metadata } from "next";
import { ContentDetailRoute, generateContentDetailMetadata } from "@/lib/catalog-detail";

export const dynamic = "force-dynamic";

export async function generateMetadata(context: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await context.params;
  return generateContentDetailMetadata(slug);
}

export default async function TvShowDetailPage(context: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await context.params;
  return <ContentDetailRoute slug={slug} />;
}

