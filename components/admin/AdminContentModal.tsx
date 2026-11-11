"use client";

import React, { useState } from "react";
import { Loader2, Plus, Search, Trash2, Upload, X } from "lucide-react";
import { GENRE_LIST, PLATFORM_LIST, STREAM_SAMPLES } from "@/database/seed-data";
import { cn } from "@/lib/utils";
import type { Category, ContentItem, ContentType } from "@/types";

interface TmdbSearchCandidate {
  tmdb_id: number;
  title: string;
  description: string;
  poster: string | null;
  backdrop: string | null;
  release_year: number;
  rating: number;
  content_type: ContentType;
}

interface SourceDraft {
  label: string;
  url: string;
  quality: string;
  format: "mp4" | "webm" | "hls";
  subtitle_url: string;
  subtitle_lang: string;
  is_active: boolean;
}

interface AdminContentModalProps {
  initialItem: ContentItem | null;
  categories: Category[];
  onClose: () => void;
  onSaved: (item: ContentItem, isEdit: boolean) => void;
}

export function AdminContentModal({
  initialItem,
  categories,
  onClose,
  onSaved,
}: AdminContentModalProps) {
  const isEdit = Boolean(initialItem);

  const [title, setTitle] = useState(initialItem?.title ?? "");
  const [slug, setSlug] = useState(initialItem?.slug ?? "");
  const [description, setDescription] = useState(initialItem?.description ?? "");
  const [poster, setPoster] = useState(initialItem?.poster ?? "");
  const [backdrop, setBackdrop] = useState(initialItem?.backdrop ?? "");
  const [releaseYear, setReleaseYear] = useState(String(initialItem?.release_year ?? 2026));
  const [rating, setRating] = useState(String(initialItem?.rating ?? 8.0));
  const [category, setCategory] = useState(
    initialItem?.category ?? categories[0]?.slug ?? "trending-now"
  );
  const [contentType, setContentType] = useState<ContentType>(
    initialItem?.content_type ?? "movie"
  );
  const [platform, setPlatform] = useState(initialItem?.platform ?? "");
  const [genres, setGenres] = useState<string[]>(initialItem?.genres ?? ["Action"]);
  const [featured, setFeatured] = useState(initialItem?.featured ?? false);
  const [featuredBadge, setFeaturedBadge] = useState(
    initialItem?.featured_badge ?? "FEATURED"
  );
  const [badgeText, setBadgeText] = useState(initialItem?.badge_text ?? "HD");
  const [ageRating, setAgeRating] = useState(initialItem?.age_rating ?? "PG-13");
  const [quality, setQuality] = useState(initialItem?.quality ?? "4K");
  const [runtimeMinutes, setRuntimeMinutes] = useState(
    initialItem?.runtime_minutes ? String(initialItem.runtime_minutes) : "120"
  );
  const [language, setLanguage] = useState(initialItem?.language ?? "English");
  const [status, setStatus] = useState(initialItem?.status ?? "Released");
  const [network, setNetwork] = useState(initialItem?.network ?? "");
  const [tmdbId, setTmdbId] = useState(initialItem?.tmdb_id ? String(initialItem.tmdb_id) : "");

  const [sources, setSources] = useState<SourceDraft[]>(
    initialItem?.sources && initialItem.sources.length > 0
      ? initialItem.sources.map((s) => ({
          label: s.label,
          url: s.url,
          quality: s.quality,
          format: s.format,
          subtitle_url: s.subtitle_url ?? "",
          subtitle_lang: s.subtitle_lang ?? "",
          is_active: s.is_active,
        }))
      : [
          {
            label: "Primary Authorized HD",
            url: STREAM_SAMPLES.sintel,
            quality: "1080p",
            format: "mp4",
            subtitle_url: "/subtitles/sample-en.vtt",
            subtitle_lang: "English",
            is_active: true,
          },
        ]
  );

  const [tmdbQuery, setTmdbQuery] = useState("");
  const [tmdbResults, setTmdbResults] = useState<TmdbSearchCandidate[]>([]);
  const [tmdbMessage, setTmdbMessage] = useState<string | null>(null);
  const [tmdbLoading, setTmdbLoading] = useState(false);

  const [uploadingField, setUploadingField] = useState<"poster" | "backdrop" | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleGenre = (g: string) => {
    setGenres((prev) =>
      prev.includes(g) ? prev.filter((item) => item !== g) : [...prev, g]
    );
  };

  const handleTmdbLookup = async () => {
    if (!tmdbQuery.trim()) return;
    setTmdbLoading(true);
    setTmdbMessage(null);
    setTmdbResults([]);

    try {
      const res = await fetch(`/api/admin/tmdb?q=${encodeURIComponent(tmdbQuery.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "TMDB lookup failed");
      if (!data.configured) {
        setTmdbMessage(data.message || "TMDB_API_KEY is not configured.");
      } else if ((data.results ?? []).length === 0) {
        setTmdbMessage("No TMDB titles matched that search.");
      } else {
        setTmdbResults(data.results);
      }
    } catch (err) {
      setTmdbMessage(err instanceof Error ? err.message : "TMDB request failed");
    } finally {
      setTmdbLoading(false);
    }
  };

  const applyTmdbCandidate = (candidate: TmdbSearchCandidate) => {
    setTitle(candidate.title);
    setDescription(candidate.description || description);
    if (candidate.poster) setPoster(candidate.poster);
    if (candidate.backdrop) setBackdrop(candidate.backdrop);
    setReleaseYear(String(candidate.release_year));
    setRating(String(candidate.rating));
    setContentType(candidate.content_type);
    setTmdbId(String(candidate.tmdb_id));
    setTmdbResults([]);
  };

  const handleUploadAsset = async (
    field: "poster" | "backdrop",
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingField(field);
    setError(null);

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", field === "poster" ? "posters" : "backdrops");
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Asset upload failed");
      if (field === "poster") setPoster(data.url);
      else setBackdrop(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingField(null);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (genres.length === 0) {
      setError("Select at least one genre.");
      return;
    }
    setSaving(true);
    setError(null);

    try {
      const payload = {
        title: title.trim(),
        slug: slug.trim() || undefined,
        description: description.trim(),
        poster: poster.trim(),
        backdrop: backdrop.trim(),
        release_year: parseInt(releaseYear, 10) || 2026,
        rating: parseFloat(rating) || 7.5,
        category,
        genres,
        platform: platform || null,
        content_type: contentType,
        featured,
        featured_badge: featuredBadge.trim() || null,
        badge_text: badgeText.trim() || null,
        age_rating: ageRating.trim() || null,
        quality: quality.trim() || null,
        runtime_minutes: runtimeMinutes.trim() ? parseInt(runtimeMinutes, 10) : null,
        language: language.trim() || null,
        status: status.trim() || null,
        network: network.trim() || null,
        tmdb_id: tmdbId.trim() ? parseInt(tmdbId, 10) : null,
        sources: sources
          .filter((s) => s.label.trim() && s.url.trim())
          .map((s) => ({
            label: s.label.trim(),
            url: s.url.trim(),
            quality: s.quality.trim() || "1080p",
            format: s.format,
            subtitle_url: s.subtitle_url.trim() || null,
            subtitle_lang: s.subtitle_lang.trim() || null,
            is_active: s.is_active,
          })),
      };

      const url = initialItem
        ? `/api/admin/content/${initialItem.id}`
        : "/api/admin/content";
      const res = await fetch(url, {
        method: initialItem ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Could not save content item");
      }

      onSaved(data.item, isEdit);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save title");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#141414] border border-white/10 p-6 md:p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
          <h2 className="text-lg md:text-xl font-black uppercase tracking-tight text-white">
            {isEdit ? `Edit: ${initialItem?.title}` : "Add New Catalog Title"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close content modal"
            className="text-zinc-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Server TMDB Import */}
        <div className="mb-6 rounded-xl bg-black/50 border border-white/10 p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={tmdbQuery}
              onChange={(e) => setTmdbQuery(e.target.value)}
              placeholder="Lookup official metadata from TMDB (e.g., Dune, Inception)..."
              className="flex-1 h-10 px-3.5 rounded-lg bg-zinc-900 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="button"
              disabled={tmdbLoading}
              onClick={() => void handleTmdbLookup()}
              className="h-10 px-4 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-bold text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              {tmdbLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              Search TMDB
            </button>
          </div>
          {tmdbMessage && <p className="text-xs text-amber-300">{tmdbMessage}</p>}
          {tmdbResults.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pt-1">
              {tmdbResults.map((cand) => (
                <button
                  key={`${cand.content_type}-${cand.tmdb_id}`}
                  type="button"
                  onClick={() => applyTmdbCandidate(cand)}
                  className="text-left p-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/10 hover:border-emerald-500/40 transition-colors cursor-pointer"
                >
                  <p className="text-xs font-bold text-white truncate">{cand.title}</p>
                  <p className="text-[11px] text-zinc-400 uppercase">
                    {cand.content_type} • {cand.release_year} • ★ {cand.rating}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="mb-5 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-xs text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-black/60 border border-white/10 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                URL Slug (auto if blank)
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="iron-man"
                className="w-full h-10 px-3 rounded-lg bg-black/60 border border-white/10 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
              Description *
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 rounded-lg bg-black/60 border border-white/10 text-sm text-white focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          {/* Artwork URLs + Upload */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                Poster Image URL *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={poster}
                  onChange={(e) => setPoster(e.target.value)}
                  placeholder="https://image.tmdb.org/t/p/w500/..."
                  className="flex-1 h-10 px-3 rounded-lg bg-black/60 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
                <label className="h-10 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-zinc-200 inline-flex items-center gap-1 cursor-pointer shrink-0">
                  {uploadingField === "poster" ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  Upload
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => void handleUploadAsset("poster", e)}
                  />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                Backdrop Image URL *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={backdrop}
                  onChange={(e) => setBackdrop(e.target.value)}
                  placeholder="https://image.tmdb.org/t/p/original/..."
                  className="flex-1 h-10 px-3 rounded-lg bg-black/60 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
                <label className="h-10 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-zinc-200 inline-flex items-center gap-1 cursor-pointer shrink-0">
                  {uploadingField === "backdrop" ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  Upload
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => void handleUploadAsset("backdrop", e)}
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Type *</label>
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value as ContentType)}
                className="w-full h-10 px-3 rounded-lg bg-black/60 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="movie">Movie</option>
                <option value="series">TV Series</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-black/60 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Year *</label>
              <input
                type="number"
                required
                min={1888}
                max={2100}
                value={releaseYear}
                onChange={(e) => setReleaseYear(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-black/60 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Rating (0–10)</label>
              <input
                type="number"
                step="0.1"
                min={0}
                max={10}
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-black/60 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Platform</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-black/60 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">None</option>
                {PLATFORM_LIST.map((p) => (
                  <option key={p.slug} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Quality</label>
              <input
                type="text"
                value={quality}
                onChange={(e) => setQuality(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-black/60 border border-white/10 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Age Rating</label>
              <input
                type="text"
                value={ageRating}
                onChange={(e) => setAgeRating(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-black/60 border border-white/10 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Runtime (min)</label>
              <input
                type="number"
                min={1}
                value={runtimeMinutes}
                onChange={(e) => setRuntimeMinutes(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-black/60 border border-white/10 text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Badge Text</label>
              <input
                type="text"
                value={badgeText}
                onChange={(e) => setBadgeText(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-black/60 border border-white/10 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Language</label>
              <input
                type="text"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-black/60 border border-white/10 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Status</label>
              <input
                type="text"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-black/60 border border-white/10 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Network</label>
              <input
                type="text"
                value={network}
                onChange={(e) => setNetwork(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-black/60 border border-white/10 text-xs text-white"
              />
            </div>
          </div>

          {/* Featured Flag */}
          <div className="flex flex-wrap items-center gap-4 pt-1">
            <label className="inline-flex items-center gap-2 text-xs font-bold text-white cursor-pointer">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded"
              />
              Featured in Hero Carousel
            </label>
            {featured && (
              <input
                type="text"
                value={featuredBadge}
                onChange={(e) => setFeaturedBadge(e.target.value)}
                placeholder="FEATURED MOVIE"
                className="h-9 px-3 rounded-lg bg-black/60 border border-white/10 text-xs text-white"
              />
            )}
          </div>

          {/* Genres Multi-select */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-2">Genres *</label>
            <div className="flex flex-wrap gap-1.5">
              {GENRE_LIST.map((g) => {
                const active = genres.includes(g);
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => toggleGenre(g)}
                    className={cn(
                      "px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors cursor-pointer",
                      active
                        ? "bg-emerald-500 text-black border-emerald-500"
                        : "bg-zinc-900 text-zinc-400 border-white/10 hover:text-white"
                    )}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Authorized Media Sources */}
          <div className="rounded-xl bg-black/40 border border-white/10 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-white">
                Authorized Media Sources
              </h3>
              <button
                type="button"
                onClick={() =>
                  setSources((prev) => [
                    ...prev,
                    {
                      label: `Stream ${prev.length + 1}`,
                      url: STREAM_SAMPLES.bunny,
                      quality: "720p",
                      format: "mp4",
                      subtitle_url: "/subtitles/sample-en.vtt",
                      subtitle_lang: "English",
                      is_active: true,
                    },
                  ])
                }
                className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Source
              </button>
            </div>

            {sources.map((src, index) => (
              <div
                key={index}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-3 rounded-lg bg-zinc-900/70 border border-white/5 items-center"
              >
                <input
                  type="text"
                  value={src.label}
                  onChange={(e) =>
                    setSources((prev) =>
                      prev.map((s, i) => (i === index ? { ...s, label: e.target.value } : s))
                    )
                  }
                  placeholder="Label"
                  className="sm:col-span-3 h-9 px-2.5 rounded bg-black/60 border border-white/10 text-xs text-white"
                />
                <input
                  type="text"
                  value={src.url}
                  onChange={(e) =>
                    setSources((prev) =>
                      prev.map((s, i) => (i === index ? { ...s, url: e.target.value } : s))
                    )
                  }
                  placeholder="https://...mp4"
                  className="sm:col-span-5 h-9 px-2.5 rounded bg-black/60 border border-white/10 text-xs text-white"
                />
                <input
                  type="text"
                  value={src.quality}
                  onChange={(e) =>
                    setSources((prev) =>
                      prev.map((s, i) => (i === index ? { ...s, quality: e.target.value } : s))
                    )
                  }
                  placeholder="1080p"
                  className="sm:col-span-2 h-9 px-2.5 rounded bg-black/60 border border-white/10 text-xs text-white"
                />
                <select
                  value={src.format}
                  onChange={(e) =>
                    setSources((prev) =>
                      prev.map((s, i) =>
                        i === index
                          ? { ...s, format: e.target.value as "mp4" | "webm" | "hls" }
                          : s
                      )
                    )
                  }
                  className="sm:col-span-1 h-9 px-1.5 rounded bg-black/60 border border-white/10 text-xs text-white"
                >
                  <option value="mp4">MP4</option>
                  <option value="webm">WEBM</option>
                  <option value="hls">HLS</option>
                </select>
                <button
                  type="button"
                  aria-label="Remove media source"
                  onClick={() =>
                    setSources((prev) => prev.filter((_, i) => i !== index))
                  }
                  className="sm:col-span-1 h-9 flex items-center justify-center text-red-400 hover:text-red-300 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-zinc-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? "Saving..." : isEdit ? "Update Title" : "Create Title"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

