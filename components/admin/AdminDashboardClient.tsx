"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Bookmark,
  Database,
  Edit3,
  Film,
  FolderPlus,
  Layers,
  Loader2,
  MessageSquare,
  Plus,
  Search,
  Shield,
  Trash2,
  Tv,
  Users,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { MediaImage } from "@/components/content/MediaImage";
import { AdminContentModal } from "./AdminContentModal";
import type {
  Category,
  ContentItem,
  ContentRequest,
  RequestStatus,
  UserProfile,
} from "@/types";

interface AdminStats {
  totalContent: number;
  totalMovies: number;
  totalSeries: number;
  totalUsers: number;
  totalCategories: number;
  totalWatchlistSaves: number;
  pendingRequests: number;
  storageMode: "supabase-cloud" | "local-dev-store";
}

interface AdminDashboardClientProps {
  currentAdminId: string;
  initialStats: AdminStats;
  initialContent: ContentItem[];
  initialCategories: Category[];
  initialUsers: UserProfile[];
  initialRequests: ContentRequest[];
}

type AdminTab = "overview" | "content" | "categories" | "users" | "requests";

export function AdminDashboardClient({
  currentAdminId,
  initialStats,
  initialContent,
  initialCategories,
  initialUsers,
  initialRequests,
}: AdminDashboardClientProps) {
  const [tab, setTab] = useState<AdminTab>("overview");
  const [stats, setStats] = useState<AdminStats>(initialStats);
  const [content, setContent] = useState<ContentItem[]>(initialContent);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [users, setUsers] = useState<UserProfile[]>(initialUsers);
  const [requests, setRequests] = useState<ContentRequest[]>(initialRequests);

  const [contentSearch, setContentSearch] = useState("");
  const [editingItem, setEditingItem] = useState<ContentItem | null | undefined>(undefined);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [catName, setCatName] = useState("");
  const [catDesc, setCatDesc] = useState("");
  const [addingCat, setAddingCat] = useState(false);
  const [banner, setBanner] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  const refreshStats = async () => {
    const res = await fetch("/api/admin/stats");
    if (res.ok) {
      const data = await res.json();
      setStats(data);
    }
  };

  const filteredContent = content.filter((item) => {
    const q = contentSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      item.title.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      (item.platform ?? "").toLowerCase().includes(q)
    );
  });

  const handleSavedContent = (saved: ContentItem, isEdit: boolean) => {
    setContent((prev) =>
      isEdit ? prev.map((c) => (c.id === saved.id ? saved : c)) : [saved, ...prev]
    );
    setEditingItem(undefined);
    setBanner({
      type: "success",
      text: isEdit ? `Updated "${saved.title}".` : `Created "${saved.title}".`,
    });
    void refreshStats();
  };

  const handleDeleteContent = async (item: ContentItem) => {
    setBusyId(item.id);
    setBanner(null);
    try {
      const res = await fetch(`/api/admin/content/${item.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete title");
      setContent((prev) => prev.filter((c) => c.id !== item.id));
      setBanner({ type: "success", text: `Deleted "${item.title}".` });
      void refreshStats();
    } catch (err) {
      setBanner({
        type: "error",
        text: err instanceof Error ? err.message : "Delete failed",
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    setAddingCat(true);
    setBanner(null);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: catName.trim(),
          description: catDesc.trim() || null,
          display_order: categories.length + 1,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create category");
      setCategories((prev) => [...prev, data.category]);
      setCatName("");
      setCatDesc("");
      setBanner({ type: "success", text: `Added category "${data.category.name}".` });
      void refreshStats();
    } catch (err) {
      setBanner({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to create category",
      });
    } finally {
      setAddingCat(false);
    }
  };

  const handleDeleteCategory = async (cat: Category) => {
    setBusyId(cat.id);
    try {
      const res = await fetch(`/api/admin/categories?id=${encodeURIComponent(cat.id)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
      void refreshStats();
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleUserRole = async (target: UserProfile) => {
    const nextRole = target.role === "admin" ? "user" : "admin";
    setBusyId(target.id);
    setBanner(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: target.id, role: nextRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not update user role");
      setUsers((prev) => prev.map((u) => (u.id === target.id ? data.user : u)));
      setBanner({
        type: "success",
        text: `Updated @${target.username} role to ${nextRole}.`,
      });
    } catch (err) {
      setBanner({
        type: "error",
        text: err instanceof Error ? err.message : "Role update failed",
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleUpdateRequestStatus = async (reqItem: ContentRequest, status: RequestStatus) => {
    setBusyId(reqItem.id);
    try {
      const res = await fetch(`/api/admin/requests/${reqItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (res.ok && data.item) {
        setRequests((prev) => prev.map((r) => (r.id === reqItem.id ? data.item : r)));
        void refreshStats();
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 md:px-12 max-w-[1600px] mx-auto space-y-8">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold uppercase tracking-widest mb-2">
            <Shield className="w-3.5 h-3.5" />
            Protected Admin Console •{" "}
            {stats.storageMode === "supabase-cloud" ? "Supabase Cloud" : "Local Store"}
          </div>
          <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tighter text-white">
            RONIN <span className="text-emerald-500">ADMIN</span>
          </h1>
        </div>

        <button
          type="button"
          onClick={() => {
            setTab("content");
            setEditingItem(null);
          }}
          className="h-11 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Add New Title
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: "overview", label: "Overview", icon: Database },
            { id: "content", label: `Content (${content.length})`, icon: Film },
            { id: "categories", label: `Categories (${categories.length})`, icon: Layers },
            { id: "users", label: `Users (${users.length})`, icon: Users },
            { id: "requests", label: `Requests (${requests.length})`, icon: MessageSquare },
          ] as const
        ).map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                "px-4 py-2.5 rounded-xl border text-xs font-bold inline-flex items-center gap-2 transition-colors cursor-pointer",
                tab === item.id
                  ? "bg-emerald-500 text-black border-emerald-500"
                  : "bg-[#141414] text-zinc-300 border-white/10 hover:border-white/25"
              )}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </button>
          );
        })}
      </div>

      {banner && (
        <div
          className={cn(
            "rounded-xl border px-4 py-3 text-xs font-medium",
            banner.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
              : "bg-red-500/10 border-red-500/30 text-red-200"
          )}
        >
          {banner.text}
        </div>
      )}

      {/* TAB 1: Overview */}
      {tab === "overview" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Titles", value: stats.totalContent, icon: Film },
            { label: "Movies", value: stats.totalMovies, icon: Film },
            { label: "TV Series", value: stats.totalSeries, icon: Tv },
            { label: "Registered Users", value: stats.totalUsers, icon: Users },
            { label: "Categories", value: stats.totalCategories, icon: Layers },
            { label: "Watchlist Saves", value: stats.totalWatchlistSaves, icon: Bookmark },
            { label: "Pending Requests", value: stats.pendingRequests, icon: MessageSquare },
            {
              label: "Storage Mode",
              value: stats.storageMode.toUpperCase(),
              icon: Database,
            },
          ].map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div
                key={kpi.label}
                className="rounded-2xl bg-[#141414] border border-white/10 p-5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-400">{kpi.label}</span>
                  <Icon className="w-4 h-4 text-emerald-500" />
                </div>
                <p className="text-2xl md:text-3xl font-black font-mono text-white">
                  {kpi.value}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: Content Manager */}
      {tab === "content" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={contentSearch}
                onChange={(e) => setContentSearch(e.target.value)}
                placeholder="Filter catalog titles..."
                className="w-full h-10 pl-10 pr-4 rounded-xl bg-[#141414] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              type="button"
              onClick={() => setEditingItem(null)}
              className="h-10 px-4 rounded-xl bg-white/5 hover:bg-emerald-500 hover:text-black border border-white/10 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              New Title
            </button>
          </div>

          <div className="rounded-2xl bg-[#141414] border border-white/10 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-zinc-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Title</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Year</th>
                  <th className="py-3.5 px-4">Rating</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Sources</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredContent.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.02]">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-12 rounded bg-zinc-900 overflow-hidden shrink-0">
                          <MediaImage
                            src={item.poster}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={
                              item.content_type === "series"
                                ? `/tv-shows/${item.slug}`
                                : `/movie/${item.slug}`
                            }
                            className="font-bold text-white hover:text-emerald-400 block truncate max-w-[220px]"
                          >
                            {item.title}
                          </Link>
                          {item.featured && (
                            <span className="text-[10px] font-black uppercase text-emerald-400">
                              Featured Hero
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 uppercase font-semibold text-zinc-300">
                      {item.content_type}
                    </td>
                    <td className="py-3 px-4 font-mono text-zinc-400">{item.release_year}</td>
                    <td className="py-3 px-4 font-mono text-emerald-400 font-bold">
                      {item.rating.toFixed(1)}
                    </td>
                    <td className="py-3 px-4 text-zinc-300">{item.category}</td>
                    <td className="py-3 px-4 font-mono text-zinc-400">
                      {item.sources?.length ?? 0}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingItem(item)}
                          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-200 cursor-pointer"
                          aria-label={`Edit ${item.title}`}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={busyId === item.id}
                          onClick={() => void handleDeleteContent(item)}
                          className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 cursor-pointer"
                          aria-label={`Delete ${item.title}`}
                        >
                          {busyId === item.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Categories */}
      {tab === "categories" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={handleCreateCategory}
            className="lg:col-span-4 rounded-2xl bg-[#141414] border border-white/10 p-6 space-y-4"
          >
            <h2 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
              <FolderPlus className="w-4 h-4 text-emerald-500" />
              Add Category
            </h2>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                Category Name *
              </label>
              <input
                type="text"
                required
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder="e.g., Anime Spotlight"
                className="w-full h-10 px-3 rounded-lg bg-black/60 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                Description
              </label>
              <input
                type="text"
                value={catDesc}
                onChange={(e) => setCatDesc(e.target.value)}
                placeholder="Short category summary..."
                className="w-full h-10 px-3 rounded-lg bg-black/60 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              type="submit"
              disabled={addingCat}
              className="w-full h-10 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs uppercase tracking-wider cursor-pointer disabled:opacity-60"
            >
              {addingCat ? "Creating..." : "Create Category"}
            </button>
          </form>

          <div className="lg:col-span-8 rounded-2xl bg-[#141414] border border-white/10 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-zinc-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Name</th>
                  <th className="py-3.5 px-4">Slug</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {categories.map((cat) => (
                  <tr key={cat.id}>
                    <td className="py-3 px-4 font-bold text-white">{cat.name}</td>
                    <td className="py-3 px-4 font-mono text-zinc-400">{cat.slug}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        disabled={busyId === cat.id}
                        onClick={() => void handleDeleteCategory(cat)}
                        className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 cursor-pointer"
                        aria-label={`Delete category ${cat.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Users */}
      {tab === "users" && (
        <div className="rounded-2xl bg-[#141414] border border-white/10 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-zinc-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Username</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Joined</th>
                <th className="py-3.5 px-4 text-right">Role Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="py-3.5 px-4 font-bold text-white">@{u.username}</td>
                  <td className="py-3.5 px-4 text-zinc-300">{u.email}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={cn(
                        "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase",
                        u.role === "admin"
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                          : "bg-white/5 text-zinc-400 border border-white/10"
                      )}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-zinc-400">{formatDate(u.created_at)}</td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      disabled={busyId === u.id || u.id === currentAdminId}
                      onClick={() => void handleToggleUserRole(u)}
                      className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-emerald-500 hover:text-black disabled:opacity-40 text-xs font-bold transition-colors cursor-pointer disabled:cursor-not-allowed"
                    >
                      {u.role === "admin" ? "Set User" : "Make Admin"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 5: Community Requests */}
      {tab === "requests" && (
        <div className="rounded-2xl bg-[#141414] border border-white/10 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-zinc-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Title</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Requester</th>
                <th className="py-3.5 px-4">Votes</th>
                <th className="py-3.5 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {requests.map((r) => (
                <tr key={r.id}>
                  <td className="py-3.5 px-4 font-bold text-white">{r.title}</td>
                  <td className="py-3.5 px-4 uppercase text-zinc-300">{r.content_type}</td>
                  <td className="py-3.5 px-4 text-zinc-400">@{r.username}</td>
                  <td className="py-3.5 px-4 font-mono text-emerald-400 font-bold">
                    {r.votes_count}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <select
                      aria-label={`Status for ${r.title}`}
                      disabled={busyId === r.id}
                      value={r.status}
                      onChange={(e) =>
                        void handleUpdateRequestStatus(r, e.target.value as RequestStatus)
                      }
                      className="h-9 px-3 rounded-lg bg-black/60 border border-white/10 text-xs font-semibold text-white"
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="fulfilled">Fulfilled</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingItem !== undefined && (
        <AdminContentModal
          initialItem={editingItem}
          categories={categories}
          onClose={() => setEditingItem(undefined)}
          onSaved={handleSavedContent}
        />
      )}
    </div>
  );
}
