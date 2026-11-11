import crypto from "node:crypto";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { slugify } from "@/lib/utils";
import {
  addLocalWatchlist,
  createLocalCategory,
  createLocalRequest,
  deleteLocalCategory,
  deleteLocalContent,
  findLocalContentByIdOrSlug,
  getLocalAdminStats,
  listLocalCategories,
  listLocalContent,
  listLocalHistory,
  listLocalRequests,
  listLocalUsers,
  listLocalWatchlist,
  makeDefaultSourcesForAdmin,
  removeLocalWatchlist,
  toggleLocalRequestVote,
  updateLocalRequestStatus,
  updateLocalUserProfile,
  upsertLocalContent,
  upsertLocalHistory,
} from "./local-store";
import type {
  Category,
  ContentItem,
  ContentRequest,
  ContentType,
  EpisodeItem,
  MediaSourceItem,
  PaginatedResponse,
  RequestStatus,
  UserProfile,
  UserRole,
  WatchHistoryEntry,
  WatchlistEntry,
} from "@/types";

export interface ContentFilterParams {
  type?: ContentType | null;
  category?: string | null;
  genre?: string | null;
  platform?: string | null;
  year?: number | null;
  featured?: boolean;
  q?: string | null;
  sort?: "latest" | "rating" | "title" | "year";
  page?: number;
  limit?: number;
}

function applyContentFilters(items: ContentItem[], params: ContentFilterParams): PaginatedResponse<ContentItem> {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(100, Math.max(1, params.limit ?? 24));
  let filtered = [...items];

  if (params.type) {
    filtered = filtered.filter((c) => c.content_type === params.type);
  }
  if (params.featured) {
    filtered = filtered.filter((c) => c.featured);
  }
  if (params.category) {
    const cat = params.category.toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.category.toLowerCase() === cat ||
        (c.metadata?.collections ?? []).some((col) => col.toLowerCase() === cat) ||
        (cat === "action" && c.genres.some((g) => g.toLowerCase() === "action")) ||
        ((cat === "science-fiction" || cat === "sci-fi") &&
          c.genres.some((g) => g.toLowerCase() === "sci-fi" || g.toLowerCase() === "science fiction"))
    );
  }
  if (params.genre) {
    const g = params.genre.toLowerCase();
    filtered = filtered.filter((c) => c.genres.some((item) => item.toLowerCase() === g));
  }
  if (params.platform) {
    const p = params.platform.toLowerCase();
    filtered = filtered.filter((c) => (c.platform ?? "").toLowerCase() === p);
  }
  if (params.year) {
    filtered = filtered.filter((c) => c.release_year === params.year);
  }
  if (params.q && params.q.trim()) {
    const query = params.q.trim().toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.title.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query) ||
        c.genres.some((g) => g.toLowerCase().includes(query)) ||
        (c.platform ?? "").toLowerCase().includes(query)
    );
  }

  switch (params.sort) {
    case "rating":
      filtered.sort((a, b) => b.rating - a.rating);
      break;
    case "title":
      filtered.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case "year":
      filtered.sort((a, b) => b.release_year - a.release_year);
      break;
    default:
      filtered.sort((a, b) => {
        if (params.category === "top-10") {
          return (a.metadata?.top10_rank ?? 99) - (b.metadata?.top10_rank ?? 99);
        }
        return b.release_year - a.release_year || b.rating - a.rating;
      });
  }

  const total = filtered.length;
  const start = (page - 1) * limit;
  const paged = filtered.slice(start, start + limit);

  return {
    items: paged,
    total,
    page,
    limit,
    hasMore: start + paged.length < total,
  };
}

export async function getCatalogContent(params: ContentFilterParams = {}): Promise<PaginatedResponse<ContentItem>> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("content")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        return applyContentFilters(data as ContentItem[], params);
      }
    }
  }
  return applyContentFilters(listLocalContent(), params);
}

export async function getContentByIdOrSlug(idOrSlug: string): Promise<ContentItem | null> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
      const query = supabase.from("content").select("*");
      const { data } = await (isUuid ? query.eq("id", idOrSlug) : query.eq("slug", idOrSlug)).maybeSingle();
      if (!data) return null;

      const [{ data: sources }, { data: episodes }] = await Promise.all([
        supabase
          .from("media_sources")
          .select("*")
          .eq("content_id", data.id)
          .eq("is_active", true)
          .order("sort_order", { ascending: true }),
        supabase
          .from("episodes")
          .select("*")
          .eq("content_id", data.id)
          .order("season_number", { ascending: true })
          .order("episode_number", { ascending: true }),
      ]);

      return {
        ...(data as ContentItem),
        sources: (sources as MediaSourceItem[]) ?? [],
        episodes: (episodes as EpisodeItem[]) ?? [],
      };
    }
  }
  return findLocalContentByIdOrSlug(idOrSlug);
}

export async function getRelatedContent(item: ContentItem, limit = 6): Promise<ContentItem[]> {
  const all = await getCatalogContent({ limit: 100 });
  return all.items
    .filter((c) => c.id !== item.id)
    .map((c) => {
      const overlap = c.genres.filter((g) => item.genres.includes(g)).length;
      const sameType = c.content_type === item.content_type ? 1 : 0;
      return { item: c, score: overlap * 2 + sameType };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.item);
}

export async function getCategories(): Promise<Category[]> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      const { data } = await supabase.from("categories").select("*").order("display_order", { ascending: true });
      if (data) return data as Category[];
    }
  }
  return listLocalCategories();
}

export async function createCategory(input: {
  name: string;
  slug?: string;
  description?: string | null;
  display_order?: number;
}): Promise<Category> {
  const slug = input.slug ? slugify(input.slug) : slugify(input.name);
  if (isSupabaseConfigured()) {
    const admin = createAdminSupabaseClient();
    if (!admin) throw new Error("SUPABASE_ADMIN_NOT_CONFIGURED");
    const { data, error } = await admin
      .from("categories")
      .insert({
        name: input.name,
        slug,
        description: input.description ?? null,
        display_order: input.display_order ?? 99,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Category;
  }
  return createLocalCategory({
    id: crypto.randomUUID(),
    name: input.name,
    slug,
    description: input.description ?? null,
    display_order: input.display_order ?? 99,
  });
}

export async function removeCategory(id: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    const admin = createAdminSupabaseClient();
    if (!admin) throw new Error("SUPABASE_ADMIN_NOT_CONFIGURED");
    const { error } = await admin.from("categories").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return true;
  }
  return deleteLocalCategory(id);
}

export async function createOrUpdateContent(
  input: {
    id?: string;
    title: string;
    slug?: string;
    description: string;
    poster: string;
    backdrop: string;
    release_year: number;
    rating: number;
    category: string;
    genres: string[];
    platform?: string | null;
    content_type: ContentType;
    featured: boolean;
    featured_badge?: string | null;
    badge_text?: string | null;
    age_rating?: string | null;
    quality?: string | null;
    runtime_minutes?: number | null;
    language?: string | null;
    status?: string | null;
    network?: string | null;
    budget?: string | null;
    revenue?: string | null;
    tmdb_id?: number | null;
    metadata?: Record<string, unknown>;
    sources?: Array<{
      label: string;
      url: string;
      quality: string;
      format: "mp4" | "webm" | "hls";
      subtitle_url?: string | null;
      subtitle_lang?: string | null;
      is_active: boolean;
    }>;
  }
): Promise<ContentItem> {
  const id = input.id ?? crypto.randomUUID();
  const slug = input.slug ? slugify(input.slug) : slugify(input.title);

  if (isSupabaseConfigured()) {
    const admin = createAdminSupabaseClient();
    if (!admin) throw new Error("SUPABASE_ADMIN_NOT_CONFIGURED");

    const row = {
      id,
      slug,
      title: input.title,
      description: input.description,
      poster: input.poster,
      backdrop: input.backdrop,
      release_year: input.release_year,
      rating: input.rating,
      category: input.category,
      genres: input.genres,
      platform: input.platform ?? null,
      content_type: input.content_type,
      featured: input.featured,
      featured_badge: input.featured_badge ?? (input.content_type === "series" ? "FEATURED SERIES" : "FEATURED MOVIE"),
      badge_text: input.badge_text ?? null,
      age_rating: input.age_rating ?? "13+",
      quality: input.quality ?? "FHD",
      runtime_minutes: input.runtime_minutes ?? null,
      language: input.language ?? "English",
      status: input.status ?? "Released",
      network: input.network ?? null,
      budget: input.budget ?? null,
      revenue: input.revenue ?? null,
      tmdb_id: input.tmdb_id ?? null,
      metadata: input.metadata ?? {},
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await admin.from("content").upsert(row).select().single();
    if (error) throw new Error(error.message);

    if (input.sources && input.sources.length > 0) {
      await admin.from("media_sources").delete().eq("content_id", id);
      const sourceRows = input.sources.map((s, idx) => ({
        content_id: id,
        label: s.label,
        url: s.url,
        quality: s.quality,
        format: s.format,
        subtitle_url: s.subtitle_url ?? null,
        subtitle_lang: s.subtitle_lang ?? null,
        is_active: s.is_active,
        sort_order: idx + 1,
      }));
      await admin.from("media_sources").insert(sourceRows);
    }

    return data as ContentItem;
  }

  const existing = input.id ? findLocalContentByIdOrSlug(input.id) : null;
  const item: ContentItem = {
    id,
    slug: existing?.slug ?? slug,
    title: input.title,
    description: input.description,
    poster: input.poster,
    backdrop: input.backdrop,
    release_year: input.release_year,
    rating: input.rating,
    category: input.category,
    genres: input.genres,
    platform: input.platform ?? null,
    content_type: input.content_type,
    featured: input.featured,
    featured_badge:
      input.featured_badge ?? (input.content_type === "series" ? "FEATURED SERIES" : "FEATURED MOVIE"),
    badge_text: input.badge_text ?? null,
    age_rating: input.age_rating ?? "13+",
    quality: input.quality ?? "FHD",
    runtime_minutes: input.runtime_minutes ?? null,
    language: input.language ?? "English",
    status: input.status ?? "Released",
    network: input.network ?? null,
    budget: input.budget ?? null,
    revenue: input.revenue ?? null,
    tmdb_id: input.tmdb_id ?? null,
    metadata: {
      ...(existing?.metadata ?? {}),
      ...(input.metadata ?? {}),
      collections: Array.from(
        new Set([...((existing?.metadata?.collections as string[]) ?? []), input.category])
      ),
    },
    sources: input.sources
      ? makeDefaultSourcesForAdmin(id, input.sources)
      : existing?.sources ?? [],
    episodes: existing?.episodes ?? [],
    created_at: existing?.created_at ?? new Date().toISOString(),
  };

  return upsertLocalContent(item);
}

export async function removeContent(id: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    const admin = createAdminSupabaseClient();
    if (!admin) throw new Error("SUPABASE_ADMIN_NOT_CONFIGURED");
    const { error } = await admin.from("content").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return true;
  }
  return deleteLocalContent(id);
}

export async function getUserWatchlist(userId: string): Promise<WatchlistEntry[]> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      const { data } = await supabase
        .from("watchlist")
        .select("*, content(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      return (data as WatchlistEntry[]) ?? [];
    }
  }
  return listLocalWatchlist(userId);
}

export async function addToUserWatchlist(userId: string, contentId: string): Promise<WatchlistEntry> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient();
    if (!supabase) throw new Error("SUPABASE_NOT_CONFIGURED");
    const { data, error } = await supabase
      .from("watchlist")
      .upsert({ user_id: userId, content_id: contentId }, { onConflict: "user_id,content_id" })
      .select("*, content(*)")
      .single();
    if (error) throw new Error(error.message);
    return data as WatchlistEntry;
  }
  return addLocalWatchlist(userId, contentId);
}

export async function removeFromUserWatchlist(userId: string, idOrContentId: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient();
    if (!supabase) throw new Error("SUPABASE_NOT_CONFIGURED");
    const { error } = await supabase
      .from("watchlist")
      .delete()
      .eq("user_id", userId)
      .or(`id.eq.${idOrContentId},content_id.eq.${idOrContentId}`);
    if (error) throw new Error(error.message);
    return true;
  }
  return removeLocalWatchlist(userId, idOrContentId);
}

export async function getUserHistory(userId: string): Promise<WatchHistoryEntry[]> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      const { data } = await supabase
        .from("watch_history")
        .select("*, content(*), episode:episodes(*)")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });
      return (data as WatchHistoryEntry[]) ?? [];
    }
  }
  return listLocalHistory(userId);
}

export async function saveUserHistory(input: {
  userId: string;
  contentId: string;
  episodeId: string | null;
  progress: number;
  progressSeconds: number;
  durationSeconds: number;
}): Promise<WatchHistoryEntry> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient();
    if (!supabase) throw new Error("SUPABASE_NOT_CONFIGURED");

    const existingQuery = supabase
      .from("watch_history")
      .select("id")
      .eq("user_id", input.userId)
      .eq("content_id", input.contentId);

    const { data: existing } = await (input.episodeId
      ? existingQuery.eq("episode_id", input.episodeId)
      : existingQuery.is("episode_id", null)
    ).maybeSingle();

    const payload = {
      user_id: input.userId,
      content_id: input.contentId,
      episode_id: input.episodeId,
      progress: input.progress,
      progress_seconds: input.progressSeconds,
      duration_seconds: input.durationSeconds,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = existing
      ? await supabase.from("watch_history").update(payload).eq("id", existing.id).select().single()
      : await supabase.from("watch_history").insert(payload).select().single();

    if (error) throw new Error(error.message);
    return data as WatchHistoryEntry;
  }
  return upsertLocalHistory(input);
}

export async function updateUserProfile(
  userId: string,
  updates: { username?: string; avatar?: string | null; role?: UserRole },
  isAdminAction = false
): Promise<UserProfile | null> {
  if (isSupabaseConfigured()) {
    const client = isAdminAction ? createAdminSupabaseClient() : await createServerSupabaseClient();
    if (!client) throw new Error("SUPABASE_NOT_CONFIGURED");
    const safeUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.username !== undefined) safeUpdates.username = updates.username;
    if (updates.avatar !== undefined) safeUpdates.avatar = updates.avatar;
    if (isAdminAction && updates.role !== undefined) safeUpdates.role = updates.role;

    const { data, error } = await client
      .from("users")
      .update(safeUpdates)
      .eq("id", userId)
      .select("id, username, email, avatar, role, created_at")
      .single();
    if (error) throw new Error(error.message);
    return data as UserProfile;
  }
  return updateLocalUserProfile(userId, updates);
}

export async function getAllUsersForAdmin(): Promise<UserProfile[]> {
  if (isSupabaseConfigured()) {
    const admin = createAdminSupabaseClient();
    if (!admin) throw new Error("SUPABASE_ADMIN_NOT_CONFIGURED");
    const { data } = await admin
      .from("users")
      .select("id, username, email, avatar, role, created_at")
      .order("created_at", { ascending: false });
    return (data as UserProfile[]) ?? [];
  }
  return listLocalUsers();
}

export async function getCommunityRequests(currentUserId?: string | null): Promise<ContentRequest[]> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      const { data } = await supabase
        .from("requests")
        .select("*, users(username)")
        .order("votes_count", { ascending: false });
      const rows = (data ?? []) as Array<ContentRequest & { users?: { username?: string } }>;
      let votedIds = new Set<string>();
      if (currentUserId) {
        const { data: votes } = await supabase
          .from("request_votes")
          .select("request_id")
          .eq("user_id", currentUserId);
        votedIds = new Set((votes ?? []).map((v: { request_id: string }) => v.request_id));
      }
      return rows.map((r) => ({
        ...r,
        username: r.users?.username ?? "Member",
        user_has_voted: votedIds.has(r.id),
      }));
    }
  }
  return listLocalRequests(currentUserId);
}

export async function createCommunityRequest(input: {
  userId: string;
  username: string;
  title: string;
  contentType: ContentType;
  releaseYear: number | null;
  notes: string | null;
}): Promise<ContentRequest> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient();
    if (!supabase) throw new Error("SUPABASE_NOT_CONFIGURED");
    const { data, error } = await supabase
      .from("requests")
      .insert({
        user_id: input.userId,
        title: input.title,
        content_type: input.contentType,
        release_year: input.releaseYear,
        notes: input.notes,
        status: "pending",
        votes_count: 1,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    await supabase.from("request_votes").insert({ request_id: data.id, user_id: input.userId });
    return { ...(data as ContentRequest), username: input.username, user_has_voted: true };
  }
  return createLocalRequest(input);
}

export async function toggleCommunityRequestVote(
  requestId: string,
  userId: string
): Promise<ContentRequest | null> {
  if (isSupabaseConfigured()) {
    const admin = createAdminSupabaseClient();
    if (!admin) throw new Error("SUPABASE_ADMIN_NOT_CONFIGURED");
    const { data: req } = await admin.from("requests").select("*").eq("id", requestId).maybeSingle();
    if (!req) return null;

    const { data: vote } = await admin
      .from("request_votes")
      .select("id")
      .eq("request_id", requestId)
      .eq("user_id", userId)
      .maybeSingle();

    let nextCount = Number(req.votes_count ?? 0);
    let voted = false;
    if (vote) {
      await admin.from("request_votes").delete().eq("id", vote.id);
      nextCount = Math.max(0, nextCount - 1);
    } else {
      await admin.from("request_votes").insert({ request_id: requestId, user_id: userId });
      nextCount += 1;
      voted = true;
    }
    const { data: updated } = await admin
      .from("requests")
      .update({ votes_count: nextCount })
      .eq("id", requestId)
      .select()
      .single();
    return { ...(updated as ContentRequest), user_has_voted: voted };
  }
  return toggleLocalRequestVote(requestId, userId);
}

export async function updateCommunityRequestStatus(
  requestId: string,
  status: RequestStatus
): Promise<ContentRequest | null> {
  if (isSupabaseConfigured()) {
    const admin = createAdminSupabaseClient();
    if (!admin) throw new Error("SUPABASE_ADMIN_NOT_CONFIGURED");
    const { data, error } = await admin
      .from("requests")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", requestId)
      .select()
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as ContentRequest) ?? null;
  }
  return updateLocalRequestStatus(requestId, status);
}

export async function getAdminOverviewStats() {
  if (isSupabaseConfigured()) {
    const admin = createAdminSupabaseClient();
    if (admin) {
      const [contentRes, usersRes, catsRes, wlRes, reqRes] = await Promise.all([
        admin.from("content").select("content_type"),
        admin.from("users").select("id", { count: "exact", head: true }),
        admin.from("categories").select("id", { count: "exact", head: true }),
        admin.from("watchlist").select("id", { count: "exact", head: true }),
        admin.from("requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
      ]);
      const rows = (contentRes.data ?? []) as Array<{ content_type: string }>;
      return {
        totalContent: rows.length,
        totalMovies: rows.filter((r) => r.content_type === "movie").length,
        totalSeries: rows.filter((r) => r.content_type === "series").length,
        totalUsers: usersRes.count ?? 0,
        totalCategories: catsRes.count ?? 0,
        totalWatchlistSaves: wlRes.count ?? 0,
        pendingRequests: reqRes.count ?? 0,
        storageMode: "supabase-cloud" as const,
      };
    }
  }
  return getLocalAdminStats();
}
