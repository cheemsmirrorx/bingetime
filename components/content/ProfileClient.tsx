"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bookmark,
  Check,
  Clock,
  Loader2,
  LogIn,
  LogOut,
  Play,
  Shield,
  User as UserIcon,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { formatDate, formatDuration } from "@/lib/utils";
import { MediaImage } from "./MediaImage";
import type { WatchHistoryEntry } from "@/types";

interface ProfileClientProps {
  initialHistory: WatchHistoryEntry[];
  initialWatchlistCount: number;
}

export function ProfileClient({
  initialHistory,
  initialWatchlistCount,
}: ProfileClientProps) {
  const { user, loading: authLoading, openAuthModal, setUserDirect, logout } = useAuth();

  const [draftUsername, setDraftUsername] = useState<string | null>(null);
  const [draftAvatar, setDraftAvatar] = useState<string | null>(null);
  const [history, setHistory] = useState<WatchHistoryEntry[]>(initialHistory);
  const [watchlistCount, setWatchlistCount] = useState(initialWatchlistCount);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(user ? user.id : null);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const username = draftUsername ?? user?.username ?? "";
  const avatar = draftAvatar ?? user?.avatar ?? "";
  const loadingData = Boolean(user && loadedUserId !== user.id);
  const visibleHistory = user ? history : [];
  const visibleWatchlistCount = user ? watchlistCount : 0;

  useEffect(() => {
    if (authLoading || !user) return;
    let active = true;

    Promise.all([fetch("/api/user/history"), fetch("/api/user/watchlist")])
      .then(async ([histRes, wlRes]) => {
        if (!active) return;
        if (histRes.ok) {
          const hData = await histRes.json();
          setHistory(hData.items ?? []);
        }
        if (wlRes.ok) {
          const wData = await wlRes.json();
          setWatchlistCount((wData.items ?? []).length);
        }
        setLoadedUserId(user.id);
      })
      .catch(() => {
        if (active) setLoadedUserId(user.id);
      });

    return () => {
      active = false;
    };
  }, [user, authLoading]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          avatar: avatar.trim() ? avatar.trim() : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Could not update profile");
      }
      if (data.profile) {
        setUserDirect(data.profile);
        setDraftUsername(null);
        setDraftAvatar(null);
      }
      setMessage({ type: "success", text: "Profile updated successfully." });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to save profile",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!user && !authLoading) {
    return (
      <div className="min-h-screen pt-28 pb-16 px-4 flex items-center justify-center">
        <div className="rounded-2xl bg-[#141414] border border-white/10 p-10 text-center max-w-md w-full">
          <UserIcon className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
          <h1 className="text-2xl font-black uppercase tracking-tight text-white mb-2">
            Account Profile
          </h1>
          <p className="text-sm text-zinc-400 mb-6">
            Sign in to customize your profile, track watch history, and resume playback across devices.
          </p>
          <button
            type="button"
            onClick={() => openAuthModal("signin")}
            className="w-full h-11 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs uppercase tracking-wider inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            Sign In / Register
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 md:px-12 max-w-[1280px] mx-auto space-y-10">
      {/* Header Summary */}
      <div className="rounded-2xl bg-[#141414] border border-white/10 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500 text-black font-black text-2xl flex items-center justify-center uppercase overflow-hidden shrink-0">
            {user?.avatar ? (
              <MediaImage src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
            ) : (
              (user?.username ?? "R").slice(0, 1)
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-black text-white">{user?.username}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                {user?.role === "admin" ? "Administrator" : "Member"}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">{user?.email}</p>
            {user?.created_at && (
              <p className="text-[11px] text-zinc-500 mt-1">
                Joined {formatDate(user.created_at)}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {user?.role === "admin" && (
            <Link
              href="/admin"
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs uppercase tracking-wider inline-flex items-center gap-2"
            >
              <Shield className="w-4 h-4" />
              Admin Dashboard
            </Link>
          )}
          <Link
            href="/watchlist"
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold inline-flex items-center gap-2"
          >
            <Bookmark className="w-4 h-4 text-emerald-400" />
            Watchlist ({visibleWatchlistCount})
          </Link>
          <button
            type="button"
            onClick={() => void logout()}
            className="px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-300 text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Two-Column Grid: Account Settings + Watch History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Settings Form */}
        <section className="lg:col-span-5 rounded-2xl bg-[#141414] border border-white/10 p-6">
          <h2 className="text-base font-black uppercase tracking-wider text-white mb-4">
            Profile Settings
          </h2>

          {message && (
            <div
              className={`mb-4 rounded-xl border px-3.5 py-2.5 text-xs flex items-center gap-2 ${
                message.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                  : "bg-red-500/10 border-red-500/30 text-red-200"
              }`}
            >
              {message.type === "success" && <Check className="w-4 h-4 shrink-0" />}
              <span>{message.text}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                Display Username
              </label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={32}
                value={username}
                onChange={(e) => setDraftUsername(e.target.value)}
                className="w-full h-11 px-3.5 rounded-lg bg-black/60 border border-white/10 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                Avatar Image URL (Optional)
              </label>
              <input
                type="url"
                value={avatar}
                onChange={(e) => setDraftAvatar(e.target.value)}
                placeholder="https://example.com/avatar.png"
                className="w-full h-11 px-3.5 rounded-lg bg-black/60 border border-white/10 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                Account Email
              </label>
              <input
                type="email"
                disabled
                value={user?.email ?? ""}
                className="w-full h-11 px-3.5 rounded-lg bg-black/40 border border-white/5 text-sm text-zinc-500 cursor-not-allowed"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full h-11 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs uppercase tracking-wider inline-flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? "Saving Changes..." : "Save Profile"}
            </button>
          </form>
        </section>

        {/* Continue Watching / Watch History */}
        <section className="lg:col-span-7 rounded-2xl bg-[#141414] border border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-black uppercase tracking-wider text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-500" />
              Continue Watching &amp; History
            </h2>
            <span className="text-xs font-mono text-zinc-500">{visibleHistory.length} entries</span>
          </div>

          {loadingData ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
            </div>
          ) : visibleHistory.length === 0 ? (
            <div className="rounded-xl bg-black/40 border border-white/5 p-10 text-center">
              <p className="text-sm font-semibold text-zinc-300 mb-1">No Watch History Yet</p>
              <p className="text-xs text-zinc-500 mb-4">
                Start playing any title and your progress will automatically be saved here.
              </p>
              <Link
                href="/"
                className="inline-flex px-5 py-2 rounded-lg bg-emerald-500 text-black font-bold text-xs"
              >
                Explore Library
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleHistory.map((entry) => {
                const c = entry.content;
                if (!c) return null;
                const href =
                  c.content_type === "series" ? `/tv-shows/${c.slug}` : `/movie/${c.slug}`;
                const clampedPct = Math.min(100, Math.max(0, Math.round(entry.progress)));

                return (
                  <Link
                    key={entry.id}
                    href={href}
                    className="group flex items-center gap-4 p-3 rounded-xl bg-black/40 hover:bg-black/70 border border-white/5 hover:border-emerald-500/40 transition-colors"
                  >
                    <div className="w-24 aspect-video rounded-lg overflow-hidden bg-zinc-900 shrink-0 relative">
                      <MediaImage
                        src={c.backdrop || c.poster}
                        alt={c.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="w-5 h-5 fill-white text-white" />
                      </div>
                    </div>

                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-bold text-white truncate group-hover:text-emerald-400 transition-colors">
                          {c.title}
                        </h3>
                        <span className="text-[11px] font-mono text-zinc-400 shrink-0">
                          {clampedPct}%
                        </span>
                      </div>

                      <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${clampedPct}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-zinc-500">
                        <span>
                          {entry.episode
                            ? `S${entry.episode.season_number}E${entry.episode.episode_number} • ${entry.episode.title}`
                            : `${formatDuration(entry.progress_seconds)} watched`}
                        </span>
                        <span>{formatDate(entry.updated_at)}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
