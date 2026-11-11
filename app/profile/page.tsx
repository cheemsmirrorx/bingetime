import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserHistory, getUserWatchlist } from "@/lib/db/repository";
import { ProfileClient } from "@/components/content/ProfileClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Profile | RONIN X STREAM",
  description: "Manage your RONIN X STREAM account settings and continue watching history.",
};

export default async function ProfilePage() {
  const user = await getCurrentUser();
  const [history, watchlist] = user
    ? await Promise.all([getUserHistory(user.id), getUserWatchlist(user.id)])
    : [[], []];

  return (
    <ProfileClient
      initialHistory={history}
      initialWatchlistCount={watchlist.length}
    />
  );
}

