"use client";

import React, { useEffect, useState } from "react";
import type { ContentItem, ContentType } from "@/types";
import { HeroCarousel } from "./HeroCarousel";
import { PlatformStrip } from "./PlatformStrip";
import { GenreStrip } from "./GenreStrip";
import { Top10Row } from "./Top10Row";
import { ContentRow } from "./ContentRow";
import { ContentCard } from "./ContentCard";
import { GridSkeleton } from "./Skeletons";

interface RowDefinition {
  title: string;
  slug: string;
  items: ContentItem[];
}

interface HomeBrowserProps {
  mode?: "home" | "movies" | "series";
  featuredItems: ContentItem[];
  top10Items: ContentItem[];
  rows: RowDefinition[];
}

export function HomeBrowser({
  mode = "home",
  featuredItems,
  top10Items,
  rows,
}: HomeBrowserProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [filterResult, setFilterResult] = useState<{
    key: string;
    items: ContentItem[];
  } | null>(null);

  const typeFilter: ContentType | null =
    mode === "movies" ? "movie" : mode === "series" ? "series" : null;

  const activeFilterKey =
    selectedPlatform || selectedGenre
      ? `${typeFilter ?? "all"}|${selectedPlatform ?? ""}|${selectedGenre ?? ""}`
      : "";

  const loadingFilter = Boolean(activeFilterKey) && filterResult?.key !== activeFilterKey;
  const filteredItems =
    activeFilterKey && filterResult?.key === activeFilterKey ? filterResult.items : null;

  useEffect(() => {
    if (!activeFilterKey) return;

    let cancelled = false;
    const params = new URLSearchParams();
    if (typeFilter) params.set("type", typeFilter);
    if (selectedPlatform) params.set("platform", selectedPlatform);
    if (selectedGenre) params.set("genre", selectedGenre);
    params.set("limit", "48");

    fetch(`/api/content?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setFilterResult({ key: activeFilterKey, items: data.items ?? [] });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFilterResult({ key: activeFilterKey, items: [] });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeFilterKey, selectedPlatform, selectedGenre, typeFilter]);

  const filterLabel = [selectedPlatform, selectedGenre].filter(Boolean).join(" • ");

  return (
    <div className="min-h-screen pb-8">
      <HeroCarousel items={featuredItems} />

      <div className="pt-6 md:pt-8 max-w-[1600px] mx-auto">
        <PlatformStrip
          selectedPlatform={selectedPlatform}
          onSelectPlatform={setSelectedPlatform}
        />
        <GenreStrip
          selectedGenre={selectedGenre}
          onSelectGenre={setSelectedGenre}
        />

        {filterLabel ? (
          <section className="px-4 md:px-12 mt-4">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <h2 className="text-lg md:text-2xl font-medium text-zinc-400">
                Showing <span className="text-white font-black">{filterLabel}</span> Content
              </h2>
              <button
                type="button"
                onClick={() => {
                  setSelectedPlatform(null);
                  setSelectedGenre(null);
                }}
                className="text-xs font-bold text-emerald-500 hover:text-emerald-400 cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>

            {loadingFilter ? (
              <GridSkeleton count={12} />
            ) : filteredItems && filteredItems.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {filteredItems.map((item) => (
                  <ContentCard key={item.id} item={item} fluid />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl bg-zinc-900/50 border border-white/5 p-12 text-center">
                <p className="text-base font-bold text-white mb-1">
                  No titles match &ldquo;{filterLabel}&rdquo;
                </p>
                <p className="text-xs text-zinc-400 mb-4">
                  Try clearing one of the active filters to browse more titles.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPlatform(null);
                    setSelectedGenre(null);
                  }}
                  className="px-5 py-2 rounded-lg bg-emerald-500 text-black font-bold text-xs cursor-pointer"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </section>
        ) : (
          <div className="space-y-4">
            {rows.slice(0, 1).map((row) => (
              <ContentRow
                key={row.slug}
                title={row.title}
                items={row.items}
                viewAllHref={`/browse/${row.slug}${typeFilter ? `?type=${typeFilter}` : ""}`}
              />
            ))}

            {top10Items.length > 0 && <Top10Row items={top10Items} />}

            {rows.slice(1).map((row) => (
              <ContentRow
                key={row.slug}
                title={row.title}
                items={row.items}
                viewAllHref={`/browse/${row.slug}${typeFilter ? `?type=${typeFilter}` : ""}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
