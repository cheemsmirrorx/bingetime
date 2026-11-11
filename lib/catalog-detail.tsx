import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getContentByIdOrSlug, getRelatedContent } from "@/lib/db/repository";
import { ContentDetailView } from "@/components/content/ContentDetailView";
import { DetailSkeleton } from "@/components/content/Skeletons";

export async function generateContentDetailMetadata(slug: string): Promise<Metadata> {
  const item = await getContentByIdOrSlug(slug);
  if (!item) {
    return { title: "Title Not Found | RONIN X STREAM" };
  }
  return {
    title: `${item.title} (${item.release_year}) | RONIN X STREAM`,
    description: item.description.slice(0, 160),
    openGraph: {
      title: `${item.title} | RONIN X STREAM`,
      description: item.description.slice(0, 160),
      images: item.backdrop ? [{ url: item.backdrop }] : item.poster ? [{ url: item.poster }] : undefined,
    },
  };
}

export async function ContentDetailRoute({ slug }: { slug: string }) {
  const item = await getContentByIdOrSlug(slug);
  if (!item) {
    notFound();
  }
  const related = await getRelatedContent(item, 6);

  return (
    <Suspense fallback={<DetailSkeleton />}>
      <ContentDetailView content={item} related={related} />
    </Suspense>
  );
}

