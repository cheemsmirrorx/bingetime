export type ContentType = "movie" | "series";
export type UserRole = "user" | "admin";
export type RequestStatus = "pending" | "approved" | "fulfilled" | "rejected";

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar: string | null;
  role: UserRole;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  display_order?: number;
}

export interface CastMember {
  name: string;
  character: string;
  profile_path: string | null;
}

export interface MediaSourceItem {
  id: string;
  content_id: string;
  episode_id?: string | null;
  label: string;
  url: string;
  quality: string;
  format: "mp4" | "webm" | "hls";
  subtitle_url?: string | null;
  subtitle_lang?: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface EpisodeItem {
  id: string;
  content_id: string;
  season_number: number;
  episode_number: number;
  title: string;
  overview: string;
  still_path: string | null;
  air_date: string | null;
  duration_seconds: number;
  media_url: string;
  subtitle_url?: string | null;
}

export interface DownloadOption {
  label: string;
  quality: string;
  size: string;
  url: string;
}

export interface ContentMetadata {
  match_percent?: number;
  top10_rank?: number | null;
  collections?: string[];
  cast?: CastMember[];
  director?: string;
  total_seasons?: number;
  total_episodes?: number;
  download_options?: DownloadOption[];
  is_trending?: boolean;
  is_latest?: boolean;
}

export interface ContentItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  poster: string;
  backdrop: string;
  release_year: number;
  rating: number;
  category: string;
  genres: string[];
  platform: string | null;
  content_type: ContentType;
  featured: boolean;
  featured_badge: string | null;
  badge_text: string | null;
  age_rating: string | null;
  quality: string | null;
  runtime_minutes: number | null;
  language: string | null;
  status: string | null;
  network: string | null;
  budget: string | null;
  revenue: string | null;
  tmdb_id: number | null;
  metadata: ContentMetadata;
  sources?: MediaSourceItem[];
  episodes?: EpisodeItem[];
  created_at: string;
}

export interface WatchlistEntry {
  id: string;
  user_id: string;
  content_id: string;
  created_at: string;
  content?: ContentItem;
}

export interface WatchHistoryEntry {
  id: string;
  user_id: string;
  content_id: string;
  episode_id: string | null;
  progress: number;
  progress_seconds: number;
  duration_seconds: number;
  updated_at: string;
  content?: ContentItem;
  episode?: EpisodeItem | null;
}

export interface ContentRequest {
  id: string;
  user_id: string;
  username?: string;
  title: string;
  content_type: ContentType;
  release_year: number | null;
  notes: string | null;
  status: RequestStatus;
  votes_count: number;
  user_has_voted?: boolean;
  created_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

