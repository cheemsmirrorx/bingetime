import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/session";
import { getCommunityRequests } from "@/lib/db/repository";
import { RequestsClient } from "@/components/content/RequestsClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Community Requests | RONIN X STREAM",
  description: "Request upcoming movies and TV series or vote on existing community requests.",
};

export default async function RequestsPage() {
  const user = await getCurrentUser();
  const requests = await getCommunityRequests(user?.id ?? null);

  return <RequestsClient initialRequests={requests} />;
}

