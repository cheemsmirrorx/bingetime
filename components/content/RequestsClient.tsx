"use client";

import React, { useState } from "react";
import {
  ArrowBigUp,
  CheckCircle2,
  Clock,
  Film,
  Loader2,
  MessageSquarePlus,
  Plus,
  Tv,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn, formatDate } from "@/lib/utils";
import type { ContentRequest, ContentType, RequestStatus } from "@/types";

interface RequestsClientProps {
  initialRequests: ContentRequest[];
}

const STATUS_BADGE: Record<RequestStatus, { label: string; classes: string }> = {
  pending: {
    label: "Pending",
    classes: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  },
  approved: {
    label: "Approved",
    classes: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  },
  fulfilled: {
    label: "Added",
    classes: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
  rejected: {
    label: "Declined",
    classes: "bg-red-500/15 text-red-300 border-red-500/30",
  },
};

export function RequestsClient({ initialRequests }: RequestsClientProps) {
  const { user, openAuthModal } = useAuth();
  const [requests, setRequests] = useState<ContentRequest[]>(initialRequests);
  const [activeStatus, setActiveStatus] = useState<"all" | RequestStatus>("all");
  const [modalOpen, setModalOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [contentType, setContentType] = useState<ContentType>("movie");
  const [releaseYear, setReleaseYear] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [votingId, setVotingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const visibleRequests =
    activeStatus === "all"
      ? requests
      : requests.filter((r) => r.status === activeStatus);

  const handleOpenCreate = () => {
    if (!user) {
      openAuthModal("signin");
      return;
    }
    setFeedback(null);
    setModalOpen(true);
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    setFeedback(null);

    try {
      const yearInt = releaseYear.trim() ? parseInt(releaseYear.trim(), 10) : null;
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content_type: contentType,
          release_year: yearInt && Number.isFinite(yearInt) ? yearInt : null,
          notes: notes.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          openAuthModal("signin");
          return;
        }
        throw new Error(data.error || "Could not submit request");
      }

      setRequests((prev) => [data.item, ...prev]);
      setTitle("");
      setReleaseYear("");
      setNotes("");
      setModalOpen(false);
      setFeedback({ type: "success", text: `Submitted request for "${data.item.title}".` });
    } catch (err) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to submit request",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (id: string) => {
    if (!user) {
      openAuthModal("signin");
      return;
    }
    setVotingId(id);
    try {
      const res = await fetch(`/api/requests/${id}/vote`, { method: "POST" });
      if (res.status === 401) {
        openAuthModal("signin");
        return;
      }
      const data = await res.json();
      if (res.ok && data.item) {
        setRequests((prev) => prev.map((r) => (r.id === id ? data.item : r)));
      }
    } finally {
      setVotingId(null);
    }
  };

  const counts = {
    all: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    fulfilled: requests.filter((r) => r.status === "fulfilled").length,
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 md:px-12 max-w-[1280px] mx-auto">
      {/* Header matching 09-requests-page.png */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-6 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold uppercase tracking-widest mb-3">
            <MessageSquarePlus className="w-3.5 h-3.5" />
            Community Board
          </div>
          <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tighter text-white">
            Title <span className="text-emerald-500">Requests</span>
          </h1>
          <p className="text-xs md:text-sm text-zinc-400 mt-1 max-w-2xl">
            Request authorized movies or TV shows to be added to RONIN X STREAM, or upvote existing community requests.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="h-11 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs uppercase tracking-wider inline-flex items-center gap-2 transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          New Request
        </button>
      </div>

      {feedback && (
        <div
          className={cn(
            "mb-6 rounded-xl border px-4 py-3 text-xs flex items-center justify-between gap-3",
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
              : "bg-red-500/10 border-red-500/30 text-red-200"
          )}
        >
          <span>{feedback.text}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-current opacity-70 hover:opacity-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {(
          [
            { key: "all", label: `All (${counts.all})` },
            { key: "pending", label: `Pending (${counts.pending})` },
            { key: "approved", label: `Approved (${counts.approved})` },
            { key: "fulfilled", label: `Added (${counts.fulfilled})` },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveStatus(tab.key)}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer",
              activeStatus === tab.key
                ? "bg-emerald-500 text-black border-emerald-500"
                : "bg-zinc-900/70 text-zinc-300 border-white/10 hover:border-white/25"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Request Cards */}
      {visibleRequests.length === 0 ? (
        <div className="rounded-2xl bg-zinc-900/50 border border-white/10 p-12 text-center">
          <Clock className="w-10 h-10 text-zinc-500 mx-auto mb-3" />
          <h2 className="text-base font-bold text-white mb-1">No Requests in This View</h2>
          <p className="text-xs text-zinc-400 mb-5">
            Be the first to suggest a title or switch back to another status tab.
          </p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-5 py-2.5 rounded-lg bg-emerald-500 text-black font-bold text-xs cursor-pointer"
          >
            Submit Request
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleRequests.map((req) => {
            const badge = STATUS_BADGE[req.status];
            return (
              <div
                key={req.id}
                className="rounded-2xl bg-[#141414] border border-white/10 hover:border-white/20 p-5 flex items-start justify-between gap-4 transition-colors"
              >
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-bold uppercase text-zinc-300">
                      {req.content_type === "series" ? (
                        <Tv className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Film className="w-3 h-3 text-emerald-400" />
                      )}
                      {req.content_type}
                    </span>
                    {req.release_year && (
                      <span className="text-[11px] font-mono text-zinc-400">
                        {req.release_year}
                      </span>
                    )}
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase",
                        badge.classes
                      )}
                    >
                      {req.status === "fulfilled" && <CheckCircle2 className="w-3 h-3" />}
                      {badge.label}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white leading-snug">
                    {req.title}
                  </h3>

                  {req.notes && (
                    <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
                      {req.notes}
                    </p>
                  )}

                  <p className="text-[11px] text-zinc-500">
                    Requested by <span className="text-zinc-300 font-semibold">@{req.username}</span> •{" "}
                    {formatDate(req.created_at)}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={votingId === req.id}
                  onClick={() => void handleVote(req.id)}
                  aria-label={`Upvote ${req.title}`}
                  className={cn(
                    "shrink-0 w-14 py-2.5 rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer",
                    req.user_has_voted
                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                      : "bg-black/50 border-white/10 text-zinc-400 hover:border-emerald-500/50 hover:text-white"
                  )}
                >
                  {votingId === req.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowBigUp
                      className={cn("w-5 h-5", req.user_has_voted && "fill-emerald-400")}
                    />
                  )}
                  <span className="text-xs font-black font-mono">{req.votes_count}</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Submit Request Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-[#141414] border border-white/10 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-black uppercase tracking-tight text-white">
                Request a Title
              </h2>
              <button
                type="button"
                aria-label="Close request dialog"
                onClick={() => setModalOpen(false)}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                  Movie or Series Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Dune: Part Three"
                  className="w-full h-11 px-3.5 rounded-lg bg-black/60 border border-white/10 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                    Type
                  </label>
                  <select
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value as ContentType)}
                    className="w-full h-11 px-3 rounded-lg bg-black/60 border border-white/10 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="movie">Movie</option>
                    <option value="series">TV Series</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                    Release Year
                  </label>
                  <input
                    type="number"
                    min={1900}
                    max={2100}
                    value={releaseYear}
                    onChange={(e) => setReleaseYear(e.target.value)}
                    placeholder="2026"
                    className="w-full h-11 px-3.5 rounded-lg bg-black/60 border border-white/10 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                  Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Preferred audio/subtitle language or edition..."
                  className="w-full p-3 rounded-lg bg-black/60 border border-white/10 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-zinc-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
