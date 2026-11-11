import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserWatchlist } from "@/lib/db/repository";
import { WatchlistClient } from "@/components/content/WatchlistClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Watchlist | RONIN X STREAM",
  description: "Manage your saved movies and TV series watchlist on RONIN X STREAM.",
};

export default async function WatchlistPage() {
  const user = await getCurrentUser();
  const initialItems = user ? await getUserWatchlist(user.id) : [];

  return <WatchlistClient initialItems={initialItems} />;
}

