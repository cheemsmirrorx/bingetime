import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {
  SEED_CATEGORIES,
  SEED_CONTENT,
  SEED_REQUESTS,
} from "@/database/seed-data";
import type {
  Category,
  ContentItem,
  ContentRequest,
  EpisodeItem,
  MediaSourceItem,
  UserProfile,
  UserRole,
  WatchHistoryEntry,
  WatchlistEntry,
} from "@/types";

export interface LocalUserRecord extends UserProfile {
  passwordHash: string;
}

interface RequestVoteRecord {
  id: string;
  request_id: string;
  user_id: string;
  created_at: string;
}

interface LocalDatabase {
  users: LocalUserRecord[];
  categories: Category[];
  content: ContentItem[];
  watchlist: WatchlistEntry[];
  watch_history: WatchHistoryEntry[];
  requests: ContentRequest[];
  request_votes: RequestVoteRecord[];
}

const STORE_PATH = path.join(process.cwd(), "database", "local-store.json");

function scryptSyncHash(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function createInitialDb(): LocalDatabase {
  const now = new Date().toISOString();
  return {
    users: [
      {
        id: "00000000-0000-4000-8000-000000000001",
        username: "ronin_admin",
        email: "admin@roninxstream.local",
        avatar: null,
        role: "admin",
        created_at: now,
        passwordHash: scryptSyncHash("Admin@123456"),
      },
      {
        id: "00000000-0000-4000-8000-000000000002",
        username: "ronin_viewer",
        email: "demo@roninxstream.local",
        avatar: null,
        role: "user",
        created_at: now,
        passwordHash: scryptSyncHash("Demo@123456"),
      },
    ],
    categories: SEED_CATEGORIES,
    content: SEED_CONTENT,
    watchlist: [
      {
        id: "wl-seed-1",
        user_id: "00000000-0000-4000-8000-000000000002",
        content_id: SEED_CONTENT[0].id,
        created_at: now,
      },
    ],
    watch_history: [],
    requests: SEED_REQUESTS,
    request_votes: [],
  };
}

function readDb(): LocalDatabase {
  fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
  if (!fs.existsSync(STORE_PATH)) {
    const init = createInitialDb();
    fs.writeFileSync(STORE_PATH, JSON.stringify(init, null, 2), "utf8");
    return init;
  }
  try {
    const raw = fs.readFileSync(STORE_PATH, "utf8");
    return JSON.parse(raw) as LocalDatabase;
  } catch {
    const init = createInitialDb();
    fs.writeFileSync(STORE_PATH, JSON.stringify(init, null, 2), "utf8");
    return init;
  }
}

function writeDb(db: LocalDatabase): void {
  fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
  fs.writeFileSync(STORE_PATH, JSON.stringify(db, null, 2), "utf8");
}

function toPublicUser(u: LocalUserRecord): UserProfile {
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    avatar: u.avatar,
    role: u.role,
    created_at: u.created_at,
  };
}

export function getLocalUserById(id: string): UserProfile | null {
  const db = readDb();
  const found = db.users.find((u) => u.id === id);
  return found ? toPublicUser(found) : null;
}

export function getLocalUserRecordByEmail(email: string): LocalUserRecord | null {
  const db = readDb();
  return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export function createLocalUser(input: {
  username: string;
  email: string;
  passwordHash: string;
}): UserProfile {
  const db = readDb();
  const existsEmail = db.users.some((u) => u.email.toLowerCase() === input.email.toLowerCase());
  if (existsEmail) {
    throw new Error("EMAIL_EXISTS");
  }
  const existsUsername = db.users.some((u) => u.username.toLowerCase() === input.username.toLowerCase());
  if (existsUsername) {
    throw new Error("USERNAME_EXISTS");
  }
  const record: LocalUserRecord = {
    id: crypto.randomUUID(),
    username: input.username,
    email: input.email.toLowerCase(),
    avatar: null,
    role: "user",
    created_at: new Date().toISOString(),
    passwordHash: input.passwordHash,
  };
  db.users.push(record);
  writeDb(db);
  return toPublicUser(record);
}

export function updateLocalUserProfile(
  userId: string,
  updates: { username?: string; avatar?: string | null; role?: UserRole }
): UserProfile | null {
  const db = readDb();
  const idx = db.users.findIndex((u) => u.id === userId);
  if (idx === -1) return null;
  if (updates.username !== undefined) {
    const conflict = db.users.some(
      (u) => u.id !== userId && u.username.toLowerCase() === updates.username!.toLowerCase()
    );
    if (conflict) throw new Error("USERNAME_EXISTS");
    db.users[idx].username = updates.username;
  }
  if (updates.avatar !== undefined) db.users[idx].avatar = updates.avatar;
  if (updates.role !== undefined) db.users[idx].role = updates.role;
  writeDb(db);
  return toPublicUser(db.users[idx]);
}

export function listLocalUsers(): UserProfile[] {
  return readDb().users.map(toPublicUser);
}

export function listLocalCategories(): Category[] {
  return [...readDb().categories].sort((a, b) => (a.display_order ?? 99) - (b.display_order ?? 99));
}

export function createLocalCategory(cat: Category): Category {
  const db = readDb();
  if (db.categories.some((c) => c.slug === cat.slug || c.name.toLowerCase() === cat.name.toLowerCase())) {
    throw new Error("CATEGORY_EXISTS");
  }
  db.categories.push(cat);
  writeDb(db);
  return cat;
}

export function deleteLocalCategory(id: string): boolean {
  const db = readDb();
  const before = db.categories.length;
  db.categories = db.categories.filter((c) => c.id !== id);
  if (db.categories.length === before) return false;
  writeDb(db);
  return true;
}

export function listLocalContent(): ContentItem[] {
  return readDb().content;
}

export function findLocalContentByIdOrSlug(idOrSlug: string): ContentItem | null {
  const db = readDb();
  return db.content.find((c) => c.id === idOrSlug || c.slug === idOrSlug) ?? null;
}

export function upsertLocalContent(item: ContentItem): ContentItem {
  const db = readDb();
  const idx = db.content.findIndex((c) => c.id === item.id);
  if (idx === -1) {
    db.content.unshift(item);
  } else {
    db.content[idx] = item;
  }
  writeDb(db);
  return item;
}

export function deleteLocalContent(id: string): boolean {
  const db = readDb();
  const before = db.content.length;
  db.content = db.content.filter((c) => c.id !== id);
  if (db.content.length === before) return false;
  db.watchlist = db.watchlist.filter((w) => w.content_id !== id);
  db.watch_history = db.watch_history.filter((h) => h.content_id !== id);
  writeDb(db);
  return true;
}

export function listLocalWatchlist(userId: string): WatchlistEntry[] {
  const db = readDb();
  return db.watchlist
    .filter((w) => w.user_id === userId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((w) => ({
      ...w,
      content: db.content.find((c) => c.id === w.content_id),
    }))
    .filter((w) => Boolean(w.content));
}

export function addLocalWatchlist(userId: string, contentId: string): WatchlistEntry {
  const db = readDb();
  const existing = db.watchlist.find((w) => w.user_id === userId && w.content_id === contentId);
  const content = db.content.find((c) => c.id === contentId);
  if (!content) throw new Error("CONTENT_NOT_FOUND");
  if (existing) return { ...existing, content };

  const entry: WatchlistEntry = {
    id: crypto.randomUUID(),
    user_id: userId,
    content_id: contentId,
    created_at: new Date().toISOString(),
  };
  db.watchlist.unshift(entry);
  writeDb(db);
  return { ...entry, content };
}

export function removeLocalWatchlist(userId: string, idOrContentId: string): boolean {
  const db = readDb();
  const before = db.watchlist.length;
  db.watchlist = db.watchlist.filter(
    (w) => !(w.user_id === userId && (w.id === idOrContentId || w.content_id === idOrContentId))
  );
  if (db.watchlist.length === before) return false;
  writeDb(db);
  return true;
}

export function listLocalHistory(userId: string): WatchHistoryEntry[] {
  const db = readDb();
  return db.watch_history
    .filter((h) => h.user_id === userId)
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .map((h) => {
      const content = db.content.find((c) => c.id === h.content_id);
      const episode: EpisodeItem | null =
        h.episode_id && content?.episodes
          ? content.episodes.find((e) => e.id === h.episode_id) ?? null
          : null;
      return { ...h, content, episode };
    })
    .filter((h) => Boolean(h.content));
}

export function upsertLocalHistory(input: {
  userId: string;
  contentId: string;
  episodeId: string | null;
  progress: number;
  progressSeconds: number;
  durationSeconds: number;
}): WatchHistoryEntry {
  const db = readDb();
  const content = db.content.find((c) => c.id === input.contentId);
  if (!content) throw new Error("CONTENT_NOT_FOUND");

  const idx = db.watch_history.findIndex(
    (h) =>
      h.user_id === input.userId &&
      h.content_id === input.contentId &&
      (h.episode_id ?? null) === (input.episodeId ?? null)
  );
  const now = new Date().toISOString();
  const entry: WatchHistoryEntry = {
    id: idx === -1 ? crypto.randomUUID() : db.watch_history[idx].id,
    user_id: input.userId,
    content_id: input.contentId,
    episode_id: input.episodeId,
    progress: input.progress,
    progress_seconds: input.progressSeconds,
    duration_seconds: input.durationSeconds,
    updated_at: now,
  };
  if (idx === -1) {
    db.watch_history.unshift(entry);
  } else {
    db.watch_history[idx] = entry;
  }
  writeDb(db);
  return { ...entry, content };
}

export function listLocalRequests(currentUserId?: string | null): ContentRequest[] {
  const db = readDb();
  return [...db.requests]
    .sort((a, b) => b.votes_count - a.votes_count)
    .map((r) => ({
      ...r,
      user_has_voted: currentUserId
        ? db.request_votes.some((v) => v.request_id === r.id && v.user_id === currentUserId)
        : false,
    }));
}

export function createLocalRequest(input: {
  userId: string;
  username: string;
  title: string;
  contentType: "movie" | "series";
  releaseYear: number | null;
  notes: string | null;
}): ContentRequest {
  const db = readDb();
  const req: ContentRequest = {
    id: crypto.randomUUID(),
    user_id: input.userId,
    username: input.username,
    title: input.title,
    content_type: input.contentType,
    release_year: input.releaseYear,
    notes: input.notes,
    status: "pending",
    votes_count: 1,
    user_has_voted: true,
    created_at: new Date().toISOString(),
  };
  db.requests.unshift(req);
  db.request_votes.push({
    id: crypto.randomUUID(),
    request_id: req.id,
    user_id: input.userId,
    created_at: new Date().toISOString(),
  });
  writeDb(db);
  return req;
}

export function toggleLocalRequestVote(requestId: string, userId: string): ContentRequest | null {
  const db = readDb();
  const req = db.requests.find((r) => r.id === requestId);
  if (!req) return null;
  const existingIdx = db.request_votes.findIndex(
    (v) => v.request_id === requestId && v.user_id === userId
  );
  if (existingIdx !== -1) {
    db.request_votes.splice(existingIdx, 1);
    req.votes_count = Math.max(0, req.votes_count - 1);
    writeDb(db);
    return { ...req, user_has_voted: false };
  }
  db.request_votes.push({
    id: crypto.randomUUID(),
    request_id: requestId,
    user_id: userId,
    created_at: new Date().toISOString(),
  });
  req.votes_count += 1;
  writeDb(db);
  return { ...req, user_has_voted: true };
}

export function updateLocalRequestStatus(
  requestId: string,
  status: "pending" | "approved" | "fulfilled" | "rejected"
): ContentRequest | null {
  const db = readDb();
  const req = db.requests.find((r) => r.id === requestId);
  if (!req) return null;
  req.status = status;
  writeDb(db);
  return req;
}

export function getLocalAdminStats() {
  const db = readDb();
  return {
    totalContent: db.content.length,
    totalMovies: db.content.filter((c) => c.content_type === "movie").length,
    totalSeries: db.content.filter((c) => c.content_type === "series").length,
    totalUsers: db.users.length,
    totalCategories: db.categories.length,
    totalWatchlistSaves: db.watchlist.length,
    pendingRequests: db.requests.filter((r) => r.status === "pending").length,
    storageMode: "local-dev-store" as const,
  };
}

export function makeDefaultSourcesForAdmin(
  contentId: string,
  sources?: Array<{
    label: string;
    url: string;
    quality: string;
    format: "mp4" | "webm" | "hls";
    subtitle_url?: string | null;
    subtitle_lang?: string | null;
    is_active: boolean;
  }>
): MediaSourceItem[] {
  if (!sources || sources.length === 0) return [];
  return sources.map((s, idx) => ({
    id: `${contentId}-src-${idx + 1}`,
    content_id: contentId,
    episode_id: null,
    label: s.label,
    url: s.url,
    quality: s.quality,
    format: s.format,
    subtitle_url: s.subtitle_url ?? null,
    subtitle_lang: s.subtitle_lang ?? null,
    is_active: s.is_active,
    sort_order: idx + 1,
  }));
}

