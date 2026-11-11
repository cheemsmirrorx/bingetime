"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Bookmark,
  Check,
  ChevronDown,
  ChevronLeft,
  Download,
  Play,
  Plus,
  Share2,
  Tv,
  User,
} from "lucide-react";
import type { ContentItem, EpisodeItem } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { MediaImage } from "./MediaImage";
import { MediaPlayer } from "@/components/player/MediaPlayer";
import { ContentCard } from "./ContentCard";
import { cn, formatRuntime } from "@/lib/utils";

interface ContentDetailViewProps {
  content: ContentItem;
  related: ContentItem[];
}

export function ContentDetailView({ content, related }: ContentDetailViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, openAuthModal } = useAuth();

  const autoplay = searchParams.get("autoplay") === "true";
  const episodes = useMemo(() => content.episodes ?? [], [content.episodes]);
  const seasons = useMemo(
    () => Array.from(new Set(episodes.map((e) => e.season_number))).sort((a, b) => a - b),
    [episodes]
  );

  const [playerOpen, setPlayerOpen] = useState(autoplay);
  const [selectedSeason, setSelectedSeason] = useState<number>(seasons[0] ?? 1);
  const [activeEpisode, setActiveEpisode] = useState<EpisodeItem | null>(episodes[0] ?? null);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [showAllCast, setShowAllCast] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showDownloads, setShowDownloads] = useState(false);

  const effectiveInWatchlist = Boolean(user) && inWatchlist;

  useEffect(() => {
    if (!user) return;
    let active = true;
    fetch("/api/user/watchlist")
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data) => {
        if (!active) return;
        const exists = (data.items ?? []).some(
          (w: { content_id: string }) => w.content_id === content.id
        );
        setInWatchlist(exists);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [user, content.id]);

  async function handleToggleWatchlist() {
    if (!user) {
      openAuthModal("signin");
      return;
    }
    setWatchlistLoading(true);
    try {
      if (effectiveInWatchlist) {
        const res = await fetch(`/api/user/watchlist/${content.id}`, { method: "DELETE" });
        if (res.ok) setInWatchlist(false);
      } else {
        const res = await fetch("/api/user/watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content_id: content.id }),
        });
        if (res.ok) setInWatchlist(true);
      }
    } finally {
      setWatchlistLoading(false);
    }
  }

  function handleShare() {
    const url = window.location.href;
    navigator.clipboard?.writeText(url).catch(() => {});
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  const seasonEpisodes = episodes.filter((e) => e.season_number === selectedSeason);
  const currentEpisodeIndex = activeEpisode
    ? episodes.findIndex((e) => e.id === activeEpisode.id)
    : -1;
  const hasNextEpisode =
    currentEpisodeIndex >= 0 && currentEpisodeIndex + 1 < episodes.length;

  const cast = content.metadata?.cast ?? [];
  const visibleCast = showAllCast ? cast : cast.slice(0, 6);
  const matchPercent = content.metadata?.match_percent ?? Math.round(content.rating * 10);
  const downloadOptions = content.metadata?.download_options ?? [];

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {playerOpen ? (
        <MediaPlayer
          content={content}
          episode={content.content_type === "series" ? activeEpisode : null}
          sources={content.sources ?? []}
          onClose={() => setPlayerOpen(false)}
          hasNextEpisode={hasNextEpisode}
          onNextEpisode={() => {
            if (hasNextEpisode) {
              const nextEp = episodes[currentEpisodeIndex + 1];
              setActiveEpisode(nextEp);
              setSelectedSeason(nextEp.season_number);
            }
          }}
        />
      ) : (
        /* Detail Hero Banner matching 12-detail-series-top.png */
        <section className="relative min-h-[65vh] md:min-h-[75vh] w-full overflow-hidden flex items-end">
          <MediaImage
            src={content.backdrop || content.poster}
            alt={content.title}
            eager
            aspect="backdrop"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-black/70 to-black/25" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-black/40" />

          <div className="relative z-10 max-w-[1440px] w-full mx-auto px-4 md:px-12 pt-28 pb-10">
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Go back"
              className="mb-8 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 border border-white/15 flex items-center justify-center text-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white mb-4">
              {content.title}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm font-semibold mb-4">
              <span className="text-emerald-400 font-bold">{matchPercent}% Match</span>
              <span className="text-zinc-300">{content.release_year}</span>
              <span className="text-zinc-300">
                {content.content_type === "series"
                  ? `${content.metadata?.total_seasons ?? seasons.length ?? 1} Seasons`
                  : formatRuntime(content.runtime_minutes)}
              </span>
              {content.age_rating && (
                <span className="px-2 py-0.5 rounded bg-white/10 border border-white/15 text-[11px] font-bold text-zinc-200">
                  {content.age_rating}
                </span>
              )}
              {content.quality && (
                <span className="px-2 py-0.5 rounded bg-white/10 border border-white/15 text-[11px] font-bold text-zinc-200">
                  {content.quality}
                </span>
              )}
              {content.platform && (
                <span className="px-2.5 py-0.5 rounded bg-white/10 border border-white/15 text-[11px] font-black uppercase text-white">
                  {content.platform}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-6">
              {content.genres.map((g) => (
                <span
                  key={g}
                  className="px-3 py-1 rounded-full bg-zinc-900/80 border border-white/10 text-xs font-medium text-zinc-300"
                >
                  {g}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setPlayerOpen(true)}
                className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs md:text-sm px-6 py-3 rounded-lg inline-flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                <Play className="w-4 h-4 fill-black" />
                Play Now
              </button>

              <button
                type="button"
                disabled={watchlistLoading}
                onClick={handleToggleWatchlist}
                className={cn(
                  "px-6 py-3 rounded-lg text-xs md:text-sm font-semibold inline-flex items-center gap-2 border transition-all cursor-pointer",
                  effectiveInWatchlist
                    ? "bg-emerald-500/15 border-emerald-500 text-emerald-400"
                    : "bg-zinc-900/80 hover:bg-zinc-800 border-white/15 text-white"
                )}
              >
                {effectiveInWatchlist ? (
                  <>
                    <Check className="w-4 h-4" />
                    In Watchlist
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Add to Watchlist
                  </>
                )}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Main Detail Body matching 13-detail-series-episodes.png & series-episodes-list.png */}
      <div className="max-w-[1440px] mx-auto px-4 md:px-12 py-8 space-y-10">
        {/* Authorized Sources Strip when Player is closed */}
        {!playerOpen && (content.sources ?? []).length > 0 && (
          <div className="rounded-xl bg-[#111113] border border-white/5 px-4 py-3.5 flex flex-wrap items-center gap-2.5">
            <span className="text-[11px] font-black tracking-wider uppercase text-zinc-500 mr-2">
              AUTHORIZED SOURCES:
            </span>
            {(content.sources ?? []).map((src) => (
              <button
                key={src.id}
                type="button"
                onClick={() => setPlayerOpen(true)}
                className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-semibold text-zinc-200 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3 h-3 text-emerald-500" />
                {src.label} ({src.quality})
              </button>
            ))}
          </div>
        )}

        {/* Overview + Share Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2">
            <h2 className="text-xs font-black tracking-widest uppercase text-zinc-500 mb-3">
              OVERVIEW
            </h2>
            <p className="text-sm md:text-base text-zinc-300 leading-relaxed">
              {content.description}
            </p>
          </div>

          <div className="rounded-xl bg-zinc-900/50 border border-white/5 px-5 py-4 flex items-center justify-between">
            <span className="text-xs font-black tracking-wider uppercase text-zinc-400">SHARE</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleShare}
                className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-zinc-300 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-500" />
                {copiedLink ? "Copied Link!" : "Copy Link"}
              </button>
              <button
                type="button"
                onClick={handleToggleWatchlist}
                aria-label="Bookmark"
                className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-zinc-300 cursor-pointer"
              >
                <Bookmark
                  className={cn("w-4 h-4", inWatchlist && "fill-emerald-500 text-emerald-500")}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Cast Section */}
        {cast.length > 0 && (
          <div className="border-t border-white/5 pt-8">
            <h2 className="text-xs font-black tracking-widest uppercase text-zinc-500 mb-5">
              CAST
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-5">
              {visibleCast.map((member) => (
                <div key={member.name} className="text-center">
                  <div className="w-20 h-20 mx-auto rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center mb-2.5 overflow-hidden">
                    {member.profile_path ? (
                      <MediaImage src={member.profile_path} alt={member.name} />
                    ) : (
                      <User className="w-8 h-8 text-zinc-600" />
                    )}
                  </div>
                  <div className="text-xs font-bold text-white line-clamp-1">{member.name}</div>
                  <div className="text-[11px] text-zinc-500 line-clamp-1">{member.character}</div>
                </div>
              ))}
            </div>
            {cast.length > 6 && (
              <button
                type="button"
                onClick={() => setShowAllCast((v) => !v)}
                className="mt-4 text-xs font-semibold text-zinc-400 hover:text-white inline-flex items-center gap-1 cursor-pointer"
              >
                <ChevronDown className={cn("w-4 h-4 transition-transform", showAllCast && "rotate-180")} />
                {showAllCast ? "Show Less" : "Show More"}
              </button>
            )}
          </div>
        )}

        {/* 4-column Metadata Grid */}
        <div className="border-t border-white/5 pt-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <div className="text-[10px] font-bold tracking-widest uppercase text-zinc-500 mb-1">
              STATUS
            </div>
            <div className="text-sm font-bold text-white">{content.status || "Released"}</div>
          </div>
          <div>
            <div className="text-[10px] font-bold tracking-widest uppercase text-zinc-500 mb-1">
              LANGUAGE
            </div>
            <div className="text-sm font-bold text-white">{content.language || "English"}</div>
          </div>
          {content.content_type === "series" ? (
            <>
              <div>
                <div className="text-[10px] font-bold tracking-widest uppercase text-zinc-500 mb-1">
                  NETWORK
                </div>
                <div className="text-sm font-bold text-white">
                  {content.network || content.platform || "N/A"}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold tracking-widest uppercase text-zinc-500 mb-1">
                  TOTAL EPISODES
                </div>
                <div className="text-sm font-bold text-white">
                  {content.metadata?.total_episodes ?? episodes.length}
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <div className="text-[10px] font-bold tracking-widest uppercase text-zinc-500 mb-1">
                  BUDGET
                </div>
                <div className="text-sm font-bold text-white">{content.budget || "N/A"}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold tracking-widest uppercase text-zinc-500 mb-1">
                  REVENUE
                </div>
                <div className="text-sm font-bold text-white">{content.revenue || "N/A"}</div>
              </div>
            </>
          )}
        </div>

        {/* Series Episodes List matching series-episodes-list.png */}
        {content.content_type === "series" && episodes.length > 0 && (
          <div className="border-t border-white/5 pt-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xs font-black tracking-widest uppercase text-zinc-400 flex items-center gap-2">
                <Tv className="w-4 h-4 text-zinc-400" />
                EPISODES
              </h2>

              <select
                aria-label="Select season"
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(Number(e.target.value))}
                className="bg-zinc-900 border border-white/10 rounded-lg px-3.5 py-2 text-xs font-bold text-white outline-none cursor-pointer"
              >
                {seasons.map((s) => (
                  <option key={s} value={s}>
                    Season {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-4">
              {seasonEpisodes.map((ep) => (
                <div
                  key={ep.id}
                  className="rounded-xl bg-zinc-900/50 border border-white/5 hover:border-white/15 p-4 flex flex-col sm:flex-row gap-4 transition-colors"
                >
                  <div className="w-full sm:w-44 aspect-video rounded-lg overflow-hidden bg-zinc-950 shrink-0">
                    <MediaImage
                      src={ep.still_path || content.backdrop || content.poster}
                      alt={ep.title}
                      aspect="backdrop"
                    />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-4 mb-1.5">
                        <h3 className="text-sm md:text-base font-bold text-white">
                          {ep.episode_number}. {ep.title}
                        </h3>
                        {ep.air_date && (
                          <span className="text-[11px] font-mono-code text-zinc-500 shrink-0">
                            {ep.air_date}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-3">
                        {ep.overview}
                      </p>
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveEpisode(ep);
                          setPlayerOpen(true);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="px-3.5 py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-black text-[11px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Play className="w-3 h-3 fill-black" />
                        STREAM
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Authorized Downloads Section (Movies) matching movie-detail-mid.png */}
        {content.content_type === "movie" && downloadOptions.length > 0 && (
          <div className="border-t border-white/5 pt-8">
            <h2 className="text-xs font-black tracking-widest uppercase text-zinc-500 flex items-center gap-2 mb-4">
              <Download className="w-4 h-4" />
              AUTHORIZED DOWNLOADS
            </h2>
            <button
              type="button"
              onClick={() => setShowDownloads((v) => !v)}
              className="px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              {showDownloads ? "Hide Download Options" : "View Download Options"}
            </button>

            {showDownloads && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {downloadOptions.map((opt) => (
                  <a
                    key={opt.label}
                    href={opt.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-zinc-900 border border-white/10 hover:border-emerald-500/50 px-4 py-3 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-white">{opt.label}</div>
                      <div className="text-zinc-400">
                        {opt.quality} • {opt.size}
                      </div>
                    </div>
                    <Download className="w-4 h-4 text-emerald-500" />
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MORE LIKE THIS */}
        {related.length > 0 && (
          <div className="border-t border-white/5 pt-8">
            <h2 className="text-xs font-black tracking-widest uppercase text-zinc-400 mb-5">
              MORE LIKE THIS
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {related.map((item) => (
                <ContentCard key={item.id} item={item} fluid />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
