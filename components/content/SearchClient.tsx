"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Search, SlidersHorizontal, X } from "lucide-react";
import { GENRE_LIST, PLATFORM_LIST } from "@/database/seed-data";
import { ContentCard } from "./ContentCard";
import { GridSkeleton } from "./Skeletons";
import type { Category, ContentItem } from "@/types";

interface SearchClientProps {
  categories: Category[];
  availableYears: number[];
  initialItems: ContentItem[];
  initialTotal: number;
  initialHasMore: boolean;
}

export function SearchClient({
  categories,
  availableYears,
  initialItems,
  initialTotal,
  initialHasMore,
}: SearchClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlQ = searchParams.get("q") ?? "";
  const typeFilter = searchParams.get("type") ?? "";
  const categoryFilter = searchParams.get("category") ?? "";
  const genreFilter = searchParams.get("genre") ?? "";
  const platformFilter = searchParams.get("platform") ?? "";
  const yearFilter = searchParams.get("year") ?? "";
  const urlKey = searchParams.toString();

  const [draftQuery, setDraftQuery] = useState(urlQ);
  const [items, setItems] = useState<ContentItem[]>(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [page, setPage] = useState(1);
  const [loadedKey, setLoadedKey] = useState<string>(urlKey);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loading = loadedKey !== urlKey;

  useEffect(() => {
    const onNavbarSearch = (ev: Event) => {
      const detail = (ev as CustomEvent<string>).detail;
      if (typeof detail === "string") {
        setDraftQuery(detail);
      }
    };
    window.addEventListener("ronin:search-query", onNavbarSearch);
    return () => window.removeEventListener("ronin:search-query", onNavbarSearch);
  }, []);

  const fetchSearchResults = useCallback(
    async (qs: string, nextPage: number, append: boolean) => {
      if (append) {
        setLoadingMore(true);
      }
      setError(null);

      try {
        const params = new URLSearchParams(qs);
        params.set("page", String(nextPage));
        params.set("limit", "24");

        const res = await fetch(`/api/search?${params.toString()}`);
        if (!res.ok) throw new Error("Search request failed");
        const data = await res.json();

        setItems((prev) => (append ? [...prev, ...(data.items ?? [])] : data.items ?? []));
        setTotal(data.total ?? 0);
        setHasMore(Boolean(data.hasMore));
        setPage(nextPage);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch search results.");
      } finally {
        setLoadedKey(qs);
        setLoadingMore(false);
      }
    },
    []
  );

  // Sync URL filter changes to /api/search
  useEffect(() => {
    if (loadedKey === urlKey) return;
    let active = true;
    const params = new URLSearchParams(urlKey);
    params.set("page", "1");
    params.set("limit", "24");

    fetch(`/api/search?${params.toString()}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Search request failed");
        return res.json();
      })
      .then((data) => {
        if (!active) return;
        setItems(data.items ?? []);
        setTotal(data.total ?? 0);
        setHasMore(Boolean(data.hasMore));
        setPage(1);
        setError(null);
        setLoadedKey(urlKey);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to fetch search results.");
        setLoadedKey(urlKey);
      });

    return () => {
      active = false;
    };
  }, [urlKey, loadedKey]);

  const pushFilterChange = useCallback(
    (updates: Record<string, string>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (v.trim()) next.set(k, v.trim());
        else next.delete(k);
      }
      const qs = next.toString();
      router.replace(qs ? `/search?${qs}` : "/search", { scroll: false });
    },
    [router, searchParams]
  );

  // Debounce text input changes into URL search query
  useEffect(() => {
    if (draftQuery.trim() === urlQ.trim()) return;
    const timer = setTimeout(() => {
      pushFilterChange({ q: draftQuery });
    }, 240);
    return () => clearTimeout(timer);
  }, [draftQuery, urlQ, pushFilterChange]);

  const clearAll = () => {
    setDraftQuery("");
    router.replace("/search", { scroll: false });
  };

  const hasActiveFilters = Boolean(
    draftQuery.trim() || typeFilter || categoryFilter || genreFilter || platformFilter || yearFilter
  );

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 md:px-12 max-w-[1600px] mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tighter text-white mb-2">
          Search <span className="text-emerald-500">Catalog</span>
        </h1>
        <p className="text-xs md:text-sm text-zinc-400">
          Filter movies, TV shows, anime, genres, streaming platforms, and release years.
        </p>
      </div>

      {/* Search & Filter Panel */}
      <div className="rounded-2xl bg-zinc-900/70 border border-white/10 p-4 md:p-5 mb-8 space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            pushFilterChange({ q: draftQuery });
          }}
          className="relative flex items-center gap-2"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={draftQuery}
              onChange={(e) => setDraftQuery(e.target.value)}
              placeholder="Search by title, description, genre, or platform..."
              className="w-full h-11 pl-11 pr-10 rounded-xl bg-black/70 border border-white/10 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            {draftQuery && (
              <button
                type="button"
                aria-label="Clear search text"
                onClick={() => {
                  setDraftQuery("");
                  pushFilterChange({ q: "" });
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="h-11 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs uppercase tracking-wider cursor-pointer shrink-0 transition-colors"
          >
            Search
          </button>
        </form>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <select
            aria-label="Filter by type"
            value={typeFilter}
            onChange={(e) => pushFilterChange({ type: e.target.value })}
            className="h-10 px-3 rounded-lg bg-black/60 border border-white/10 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Types</option>
            <option value="movie">Movies Only</option>
            <option value="series">TV Shows Only</option>
          </select>

          <select
            aria-label="Filter by category"
            value={categoryFilter}
            onChange={(e) => pushFilterChange({ category: e.target.value })}
            className="h-10 px-3 rounded-lg bg-black/60 border border-white/10 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by genre"
            value={genreFilter}
            onChange={(e) => pushFilterChange({ genre: e.target.value })}
            className="h-10 px-3 rounded-lg bg-black/60 border border-white/10 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Genres</option>
            {GENRE_LIST.map((genre) => (
              <option key={genre} value={genre}>
                {genre}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by platform"
            value={platformFilter}
            onChange={(e) => pushFilterChange({ platform: e.target.value })}
            className="h-10 px-3 rounded-lg bg-black/60 border border-white/10 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Platforms</option>
            {PLATFORM_LIST.map((p) => (
              <option key={p.slug} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by release year"
            value={yearFilter}
            onChange={(e) => pushFilterChange({ year: e.target.value })}
            className="h-10 px-3 rounded-lg bg-black/60 border border-white/10 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="">Any Year</option>
            {availableYears.map((yr) => (
              <option key={yr} value={String(yr)}>
                {yr}
              </option>
            ))}
          </select>

          <button
            type="button"
            disabled={!hasActiveFilters}
            onClick={clearAll}
            className="h-10 px-3 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40 border border-white/10 text-xs font-bold text-zinc-200 inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-500" />
            Reset Filters
          </button>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-xs md:text-sm text-zinc-400">
          {urlQ.trim() ? (
            <>
              Showing <span className="text-white font-bold">{total}</span> results for{" "}
              <span className="text-emerald-400 font-bold">&ldquo;{urlQ.trim()}&rdquo;</span>
            </>
          ) : (
            <>
              Showing <span className="text-white font-bold">{total}</span> matching titles
            </>
          )}
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 flex items-center justify-between gap-4">
          <p className="text-xs text-red-200">{error}</p>
          <button
            type="button"
            onClick={() => void fetchSearchResults(urlKey, 1, false)}
            className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-bold cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <GridSkeleton count={12} />
      ) : items.length === 0 ? (
        <div className="rounded-2xl bg-zinc-900/50 border border-white/10 p-14 text-center">
          <p className="text-lg font-bold text-white mb-2">No Results Found</p>
          <p className="text-sm text-zinc-400 mb-6 max-w-md mx-auto">
            We could not find any titles matching your current query or filter combination.
          </p>
          <button
            type="button"
            onClick={clearAll}
            className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs uppercase tracking-wider cursor-pointer"
          >
            Clear Search & Filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {items.map((item) => (
              <ContentCard key={item.id} item={item} fluid />
            ))}
          </div>

          {hasMore && (
            <div className="mt-10 flex justify-center">
              <button
                type="button"
                disabled={loadingMore}
                onClick={() => void fetchSearchResults(urlKey, page + 1, true)}
                className="px-7 py-3 rounded-xl bg-white/5 hover:bg-emerald-500 hover:text-black border border-white/10 text-white font-bold text-xs uppercase tracking-wider transition-colors inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loadingMore && <Loader2 className="w-4 h-4 animate-spin" />}
                {loadingMore ? "Loading..." : "Load More Results"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
