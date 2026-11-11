"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, Loader2, LogIn, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ContentCard } from "./ContentCard";
import { GridSkeleton } from "./Skeletons";
import type { WatchlistEntry } from "@/types";

interface WatchlistClientProps {
  initialItems: WatchlistEntry[];
}

export function WatchlistClient({ initialItems }: WatchlistClientProps) {
  const { user, loading: authLoading, openAuthModal } = useAuth();
  const [items, setItems] = useState<WatchlistEntry[]>(initialItems);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(
    user ? user.id : null
  );
  const [removingId, setRemovingId] = useState<string | null>(null);

  const loading = Boolean(user && loadedUserId !== user.id);
  const visibleItems = user ? items : [];

  useEffect(() => {
    if (authLoading || !user) return;
    let active = true;
    fetch("/api/user/watchlist")
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data) => {
        if (!active) return;
        setItems(data.items ?? []);
        setLoadedUserId(user.id);
      })
      .catch(() => {
        if (active) setLoadedUserId(user.id);
      });
    return () => {
      active = false;
    };
  }, [user, authLoading]);

  const handleRemove = async (entry: WatchlistEntry) => {
    setRemovingId(entry.id);
    try {
      const res = await fetch(`/api/user/watchlist/${entry.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setItems((prev) => prev.filter((item) => item.id !== entry.id));
      }
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 md:px-12 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pb-5 border-b border-white/10">
        <div>
          <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tighter text-white">
            My <span className="text-emerald-500">Watchlist</span>
          </h1>
          <p className="text-xs md:text-sm text-zinc-400 mt-1">
            Saved movies and TV series synced across your sessions.
          </p>
        </div>
        {user && (
          <p className="text-xs font-mono text-zinc-400">
            {visibleItems.length} saved {visibleItems.length === 1 ? "title" : "titles"}
          </p>
        )}
      </div>

      {!user && !authLoading ? (
        <div className="rounded-2xl bg-[#141414] border border-white/10 p-12 text-center max-w-lg mx-auto my-12">
          <Bookmark className="w-11 h-11 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Sign In to View Your Watchlist</h2>
          <p className="text-sm text-zinc-400 mb-6">
            Save movies and series to watch later and keep them synced across devices.
          </p>
          <button
            type="button"
            onClick={() => openAuthModal("signin")}
            className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            Sign In / Create Account
          </button>
        </div>
      ) : loading ? (
        <GridSkeleton count={6} />
      ) : visibleItems.length === 0 ? (
        <div className="rounded-2xl bg-zinc-900/50 border border-white/10 p-14 text-center">
          <Bookmark className="w-10 h-10 text-zinc-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-white mb-2">Your Watchlist Is Empty</h2>
          <p className="text-sm text-zinc-400 mb-6">
            Open any movie or series and tap &ldquo;Watchlist&rdquo; to bookmark it here.
          </p>
          <Link
            href="/"
            className="inline-flex px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs uppercase tracking-wider"
          >
            Browse Catalog
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {visibleItems.map((entry) =>
            entry.content ? (
              <div key={entry.id} className="space-y-2">
                <ContentCard item={entry.content} fluid />
                <button
                  type="button"
                  disabled={removingId === entry.id}
                  onClick={() => void handleRemove(entry)}
                  className="w-full py-2 rounded-lg bg-zinc-900 hover:bg-red-500/15 border border-white/10 hover:border-red-500/40 text-zinc-300 hover:text-red-300 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {removingId === entry.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  Remove
                </button>
              </div>
            ) : null
          )}
        </div>
      )}
    </div>
  );
}
