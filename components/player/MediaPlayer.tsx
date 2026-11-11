"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  Pause,
  Play,
  RotateCcw,
  Server,
  Subtitles,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import type { ContentItem, EpisodeItem, MediaSourceItem } from "@/types";
import { cn, formatDuration } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface MediaPlayerProps {
  content: ContentItem;
  episode?: EpisodeItem | null;
  sources: MediaSourceItem[];
  onClose: () => void;
  onNextEpisode?: () => void;
  hasNextEpisode?: boolean;
}

export function MediaPlayer({
  content,
  episode = null,
  sources,
  onClose,
  onNextEpisode,
  hasNextEpisode = false,
}: MediaPlayerProps) {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const effectiveSources: MediaSourceItem[] =
    sources.length > 0
      ? sources
      : episode?.media_url
      ? [
          {
            id: `${episode.id}-default`,
            content_id: content.id,
            episode_id: episode.id,
            label: "Primary Episode Stream",
            url: episode.media_url,
            quality: content.quality || "1080p",
            format: "mp4",
            subtitle_url: episode.subtitle_url ?? "/subtitles/sample-en.vtt",
            subtitle_lang: "English",
            is_active: true,
            sort_order: 1,
          },
        ]
      : [];

  const [activeSourceIdx, setActiveSourceIdx] = useState(0);
  const [showSourcesDrawer, setShowSourcesDrawer] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.9);
  const [muted, setMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [captionsEnabled, setCaptionsEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [resumeToast, setResumeToast] = useState<string | null>(null);
  const hasAttemptedResume = useRef(false);
  const lastSavedSec = useRef(0);

  const activeSource = effectiveSources[activeSourceIdx] ?? effectiveSources[0];
  const episodeId = episode?.id ?? null;
  const streamUrl = episode?.media_url && activeSourceIdx === 0 ? episode.media_url : activeSource?.url;
  const subtitleUrl = episode?.subtitle_url || activeSource?.subtitle_url || "/subtitles/sample-en.vtt";
  const localResumeKey = `ronin_resume_${content.id}_${episodeId ?? "movie"}`;

  const persistProgress = useCallback(
    async (sec: number, dur: number) => {
      if (!dur || dur <= 0 || sec <= 0) return;
      const pct = Math.min(100, Math.round((sec / dur) * 1000) / 10);
      try {
        localStorage.setItem(localResumeKey, JSON.stringify({ sec: Math.floor(sec), dur: Math.floor(dur) }));
      } catch {
        // ignore storage quota errors
      }
      if (!user) return;
      try {
        await fetch("/api/user/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content_id: content.id,
            episode_id: episodeId,
            progress: pct,
            progress_seconds: Math.floor(sec),
            duration_seconds: Math.floor(dur),
          }),
        });
      } catch {
        // ignore transient network failures while tracking progress
      }
    },
    [content.id, episodeId, localResumeKey, user]
  );

  useEffect(() => {
    hasAttemptedResume.current = false;
  }, [streamUrl, episodeId]);

  const handleLoadedMetadata = useCallback(async () => {
    const vid = videoRef.current;
    if (!vid) return;
    setDuration(vid.duration || 0);

    // Sync subtitle track mode
    if (vid.textTracks && vid.textTracks[0]) {
      vid.textTracks[0].mode = captionsEnabled ? "showing" : "hidden";
    }

    if (hasAttemptedResume.current) return;
    hasAttemptedResume.current = true;

    let resumeAt = 0;
    if (user) {
      try {
        const res = await fetch("/api/user/history");
        if (res.ok) {
          const data = await res.json();
          const match = (data.items ?? []).find(
            (h: { content_id: string; episode_id: string | null; progress_seconds: number; progress: number }) =>
              h.content_id === content.id &&
              (h.episode_id ?? null) === (episode?.id ?? null)
          );
          if (match && match.progress_seconds > 3 && match.progress < 95) {
            resumeAt = match.progress_seconds;
          }
        }
      } catch {
        // fallback to localStorage below
      }
    }
    if (resumeAt === 0) {
      try {
        const saved = localStorage.getItem(localResumeKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.sec > 3 && parsed.dur > 0 && parsed.sec / parsed.dur < 0.95) {
            resumeAt = parsed.sec;
          }
        }
      } catch {
        // ignore
      }
    }

    if (resumeAt > 3 && vid.duration > resumeAt + 2) {
      vid.currentTime = resumeAt;
      setCurrentTime(resumeAt);
      setResumeToast(`Resumed from ${formatDuration(resumeAt)}`);
      setTimeout(() => setResumeToast(null), 3500);
    }
  }, [captionsEnabled, content.id, episode?.id, localResumeKey, user]);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.volume = muted ? 0 : volume;
  }, [volume, muted]);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.playbackRate = playbackRate;
  }, [playbackRate]);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid || !vid.textTracks || !vid.textTracks[0]) return;
    vid.textTracks[0].mode = captionsEnabled ? "showing" : "hidden";
  }, [captionsEnabled]);

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const togglePlay = useCallback(async () => {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused) {
      try {
        await vid.play();
        setPlaying(true);
      } catch {
        setPlaying(false);
      }
    } else {
      vid.pause();
      setPlaying(false);
      persistProgress(vid.currentTime, vid.duration);
    }
  }, [persistProgress]);

  const toggleFullscreen = useCallback(async () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      await el.requestFullscreen().catch(() => {});
    } else {
      await document.exitFullscreen().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === " " || e.key.toLowerCase() === "k") {
        e.preventDefault();
        togglePlay();
      } else if (e.key.toLowerCase() === "m") {
        setMuted((m) => !m);
      } else if (e.key.toLowerCase() === "f") {
        toggleFullscreen();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePlay, toggleFullscreen]);

  const headerLabel = episode
    ? `${content.title} - S${episode.season_number}E${episode.episode_number}: ${episode.title}`
    : content.title;

  return (
    <div className="pt-20 pb-6 bg-black border-b border-white/10">
      {/* Top Player Control Bar matching 14-player-view.png */}
      <div className="max-w-[1440px] mx-auto px-4 md:px-10 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onClose}
            aria-label="Exit player"
            className="p-2 rounded-full hover:bg-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-sm md:text-base font-bold text-white truncate">{headerLabel}</h2>
          {hasNextEpisode && onNextEpisode && (
            <button
              type="button"
              onClick={onNextEpisode}
              className="px-3 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black inline-flex items-center gap-1 cursor-pointer shrink-0"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSourcesDrawer((v) => !v)}
            className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-semibold text-zinc-200 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Server className="w-3.5 h-3.5 text-emerald-500" />
            Sources
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close player"
            className="p-2 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Video Canvas */}
      <div className="max-w-[1440px] mx-auto px-4 md:px-10">
        <div
          ref={containerRef}
          className="relative aspect-video w-full rounded-xl overflow-hidden bg-zinc-950 border border-white/10 shadow-2xl group"
        >
          {streamUrl ? (
            <video
              ref={videoRef}
              src={streamUrl}
              poster={content.backdrop || content.poster}
              playsInline
              crossOrigin="anonymous"
              onClick={togglePlay}
              onLoadStart={() => setMediaError(null)}
              onLoadedMetadata={handleLoadedMetadata}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onTimeUpdate={() => {
                const vid = videoRef.current;
                if (!vid) return;
                setCurrentTime(vid.currentTime);
                if (Math.abs(vid.currentTime - lastSavedSec.current) >= 5) {
                  lastSavedSec.current = vid.currentTime;
                  persistProgress(vid.currentTime, vid.duration);
                }
              }}
              onEnded={() => {
                setPlaying(false);
                if (videoRef.current) {
                  persistProgress(videoRef.current.duration, videoRef.current.duration);
                }
              }}
              onError={() =>
                setMediaError(
                  "This authorized media stream failed to load. Try retrying or switching to an alternative source."
                )
              }
              className="w-full h-full object-contain bg-black cursor-pointer"
            >
              {subtitleUrl && (
                <track
                  kind="subtitles"
                  src={subtitleUrl}
                  srcLang="en"
                  label={activeSource?.subtitle_lang || "English"}
                  default
                />
              )}
            </video>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
              <AlertTriangle className="w-10 h-10 text-amber-400 mb-3" />
              <p className="text-sm font-bold text-white">No authorized media source configured</p>
              <p className="text-xs text-zinc-400 mt-1">
                Administrators can assign an authorized MP4/WebM stream from the Admin Dashboard.
              </p>
            </div>
          )}

          {/* Resume Toast */}
          {resumeToast && (
            <div className="absolute top-4 left-4 z-30 bg-emerald-500 text-black text-xs font-black px-3 py-1.5 rounded-full shadow-lg">
              {resumeToast}
            </div>
          )}

          {/* Error Recovery Overlay */}
          {mediaError && (
            <div className="absolute inset-0 z-30 bg-black/90 flex flex-col items-center justify-center p-6 text-center">
              <AlertTriangle className="w-10 h-10 text-red-400 mb-3" />
              <h3 className="text-base font-bold text-white mb-1">Stream Playback Error</h3>
              <p className="text-xs text-zinc-400 max-w-md mb-4">{mediaError}</p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setMediaError(null);
                    videoRef.current?.load();
                  }}
                  className="px-4 py-2 rounded-lg bg-emerald-500 text-black text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Retry
                </button>
                {effectiveSources.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      setMediaError(null);
                      setActiveSourceIdx((i) => (i + 1) % effectiveSources.length);
                    }}
                    className="px-4 py-2 rounded-lg bg-white/10 text-white text-xs font-semibold cursor-pointer"
                  >
                    Switch Source
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Custom Center Play Overlay when Paused */}
          {!playing && !mediaError && streamUrl && (
            <button
              type="button"
              onClick={togglePlay}
              aria-label="Play video"
              className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-emerald-500/95 hover:bg-emerald-400 text-black flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.5)] transition-transform hover:scale-105 cursor-pointer z-20"
            >
              <Play className="w-7 h-7 fill-black ml-1" />
            </button>
          )}

          {/* Bottom Controls Bar */}
          {streamUrl && (
            <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/95 via-black/75 to-transparent pt-8 pb-3 px-4 space-y-2.5">
              {/* Seek Bar */}
              <input
                type="range"
                aria-label="Seek playback position"
                min={0}
                max={duration || 100}
                step={0.5}
                value={currentTime}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  setCurrentTime(next);
                  if (videoRef.current) videoRef.current.currentTime = next;
                }}
                className="w-full h-1.5 accent-emerald-500 cursor-pointer rounded-full bg-white/20"
              />

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={togglePlay}
                    aria-label={playing ? "Pause" : "Play"}
                    className="p-1.5 rounded hover:bg-white/10 text-white cursor-pointer"
                  >
                    {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setMuted((m) => !m)}
                      aria-label={muted ? "Unmute" : "Mute"}
                      className="p-1.5 rounded hover:bg-white/10 text-white cursor-pointer"
                    >
                      {muted || volume === 0 ? (
                        <VolumeX className="w-4 h-4 text-red-400" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                    </button>
                    <input
                      type="range"
                      aria-label="Volume"
                      min={0}
                      max={1}
                      step={0.05}
                      value={muted ? 0 : volume}
                      onChange={(e) => {
                        setMuted(false);
                        setVolume(Number(e.target.value));
                      }}
                      className="w-20 h-1 accent-emerald-500 cursor-pointer"
                    />
                  </div>

                  <span className="font-mono-code text-[11px] text-zinc-300">
                    {formatDuration(currentTime)} / {formatDuration(duration)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCaptionsEnabled((c) => !c)}
                    aria-label="Toggle subtitles"
                    className={cn(
                      "px-2 py-1 rounded text-[11px] font-bold inline-flex items-center gap-1 border cursor-pointer",
                      captionsEnabled
                        ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                        : "bg-white/5 border-white/10 text-zinc-400"
                    )}
                  >
                    <Subtitles className="w-3.5 h-3.5" />
                    CC
                  </button>

                  <select
                    aria-label="Playback speed"
                    value={playbackRate}
                    onChange={(e) => setPlaybackRate(Number(e.target.value))}
                    className="bg-zinc-900 border border-white/10 rounded px-2 py-1 text-[11px] font-bold text-zinc-200 outline-none cursor-pointer"
                  >
                    {[0.75, 1, 1.25, 1.5, 2].map((r) => (
                      <option key={r} value={r}>
                        {r}x
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={toggleFullscreen}
                    aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                    className="p-1.5 rounded hover:bg-white/10 text-white cursor-pointer"
                  >
                    {isFullscreen ? (
                      <Minimize className="w-4 h-4" />
                    ) : (
                      <Maximize className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Alternative Authorized Sources Bar matching 14-player-view.png */}
      {showSourcesDrawer && effectiveSources.length > 0 && (
        <div className="max-w-[1440px] mx-auto px-4 md:px-10 mt-5">
          <div className="rounded-xl bg-[#111113] border border-white/10 px-4 py-3 flex flex-wrap items-center gap-2.5">
            <span className="text-[11px] font-black tracking-wider uppercase text-zinc-400 mr-2">
              AUTHORIZED MEDIA SOURCES:
            </span>
            {effectiveSources.map((src, idx) => {
              const active = idx === activeSourceIdx;
              return (
                <button
                  key={src.id}
                  type="button"
                  onClick={() => {
                    setActiveSourceIdx(idx);
                    setMediaError(null);
                  }}
                  className={cn(
                    "px-3.5 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 border transition-colors cursor-pointer",
                    active
                      ? "bg-emerald-500 border-emerald-500 text-black"
                      : "bg-zinc-900 border-white/10 text-zinc-300 hover:border-white/25"
                  )}
                >
                  <Play className="w-3 h-3" />
                  <span>{src.label}</span>
                  <span className={cn("text-[10px]", active ? "text-black/75" : "text-zinc-500")}>
                    ({src.quality})
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
