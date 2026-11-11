"use client";

import React, { useCallback, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Loader2, SlidersHorizontal, X } from "lucide-react";
import { GENRE_LIST } from "@/database/seed-data";
import { ContentCard } from "./ContentCard";
import { GridSkeleton } from "./Skeletons";
import type { ContentItem, ContentType } from "@/types";

interface BrowseGridClientProps {
  heading: string;
  filterType: "category" | "genre" | "all";
  filterValue: string;
  initialType: ContentType | null;
  initialItems: ContentItem[];
  initialTotal: number;
  initialHasMore: boolean;
  availableYears: number[];
}

export function BrowseGridClient({
  heading,
  filterType,
  filterValue,
  initialType,
  initialItems,
  initialTotal,
  initialHasMore,
  availableYears,
}: BrowseGridClientProps) {
  const [items, setItems] = useState<ContentItem[]>(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [page, setPage] = useState(1);

  const [typeFilter, setTypeFilter] = useState<string>(initialType ?? "");
  const [genreFilter, setGenreFilter] = useState<string>(
    filterType === "genre" ? filterValue : ""
  );
  const [yearFilter, setYearFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("latest");

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchResults = useCallback(
    async (opts: {
      nextPage: number;
      append: boolean;
      type: string;
      genre: string;
      year: string;
      sort: string;
    }) => {
      if (opts.append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const params = new URLSearchParams();
        if (filterType === "category" && filterValue) params.set("category", filterValue);
        if (opts.type) params.set("type", opts.type);
        if (opts.genre) params.set("genre", opts.genre);
        if (opts.year) params.set("year", opts.year);
        if (opts.sort) params.set("sort", opts.sort);
        params.set("page", String(opts.nextPage));
        params.set("limit", "24");

        const res = await fetch(`/api/content?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to load titles");
        const data = await res.json();

        setItems((prev) => (opts.append ? [...prev, ...(data.items ?? [])] : data.items ?? []));
        setTotal(data.total ?? 0);
        setHasMore(Boolean(data.hasMore));
        setPage(opts.nextPage);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not fetch catalog items.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [filterType, filterValue]
  );

  const applyFilterChange = (next: {
    type?: string;
    genre?: string;
    year?: string;
    sort?: string;
  }) => {
    const resolved = {
      type: next.type !== undefined ? next.type : typeFilter,
      genre: next.genre !== undefined ? next.genre : genreFilter,
      year: next.year !== undefined ? next.year : yearFilter,
      sort: next.sort !== undefined ? next.sort : sortBy,
    };
    setTypeFilter(resolved.type);
    setGenreFilter(resolved.genre);
    setYearFilter(resolved.year);
    setSortBy(resolved.sort);
    void fetchResults({ nextPage: 1, append: false, ...resolved });
  };

  const resetFilters = () => {
    const baseGenre = filterType === "genre" ? filterValue : "";
    const baseType = initialType ?? "";
    setTypeFilter(baseType);
    setGenreFilter(baseGenre);
    setYearFilter("");
    setSortBy("latest");
    void fetchResults({
      nextPage: 1,
      append: false,
      type: baseType,
      genre: baseGenre,
      year: "",
      sort: "latest",
    });
  };

  const hasCustomFilters =
    typeFilter !== (initialType ?? "") ||
    genreFilter !== (filterType === "genre" ? filterValue : "") ||
    yearFilter !== "" ||
    sortBy !== "latest";

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 md:px-12 max-w-[1600px] mx-auto">
      {/* Header matching view-all.png */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-5 border-b border-white/10">
        <div className="flex items-center gap-3.5">
          <Link
            href={initialType === "movie" ? "/movies" : initialType === "series" ? "/series" : "/"}
            aria-label="Back to catalog"
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-emerald-500 hover:text-black border border-white/10 flex items-center justify-center transition-colors shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-white">
              {heading}
            </h1>
            <p className="text-xs text-zinc-400 font-medium mt-0.5">
              {total} {total === 1 ? "title" : "titles"} available
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider inline-flex items-center gap-1.5 mr-1">
            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-500" />
            Filter
          </span>

          <select
            aria-label="Filter by content type"
            value={typeFilter}
            onChange={(e) => applyFilterChange({ type: e.target.value })}
            className="h-9 px-3 rounded-lg bg-zinc-900 border border-white/10 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Types</option>
            <option value="movie">Movies</option>
            <option value="series">TV Shows</option>
          </select>

          <select
            aria-label="Filter by genre"
            value={genreFilter}
            onChange={(e) => applyFilterChange({ genre: e.target.value })}
            className="h-9 px-3 rounded-lg bg-zinc-900 border border-white/10 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Genres</option>
            {GENRE_LIST.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by release year"
            value={yearFilter}
            onChange={(e) => applyFilterChange({ year: e.target.value })}
            className="h-9 px-3 rounded-lg bg-zinc-900 border border-white/10 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Years</option>
            {availableYears.map((yr) => (
              <option key={yr} value={String(yr)}>
                {yr}
              </option>
            ))}
          </select>

          <select
            aria-label="Sort titles"
            value={sortBy}
            onChange={(e) => applyFilterChange({ sort: e.target.value })}
            className="h-9 px-3 rounded-lg bg-zinc-900 border border-white/10 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="latest">Latest Release</option>
            <option value="rating">Top Rated</option>
            <option value="year">Release Year</option>
            <option value="title">Title (A-Z)</option>
          </select>

          {hasCustomFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="h-9 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-emerald-400 inline-flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Reset
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 flex items-center justify-between gap-4">
          <p className="text-xs text-red-200">{error}</p>
          <button
            type="button"
            onClick={() =>
              void fetchResults({
                nextPage: 1,
                append: false,
                type: typeFilter,
                genre: genreFilter,
                year: yearFilter,
                sort: sortBy,
              })
            }
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
          <h2 className="text-lg font-bold text-white mb-2">No Titles Match These Filters</h2>
          <p className="text-sm text-zinc-400 mb-5">
            Try clearing a genre, year, or content-type filter to explore the collection.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs uppercase tracking-wider cursor-pointer"
          >
            Clear Filters
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
                onClick={() =>
                  void fetchResults({
                    nextPage: page + 1,
                    append: true,
                    type: typeFilter,
                    genre: genreFilter,
                    year: yearFilter,
                    sort: sortBy,
                  })
                }
                className="px-7 py-3 rounded-xl bg-white/5 hover:bg-emerald-500 hover:text-black border border-white/10 text-white font-bold text-xs uppercase tracking-wider transition-colors inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loadingMore && <Loader2 className="w-4 h-4 animate-spin" />}
                {loadingMore ? "Loading More..." : "Load More"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

