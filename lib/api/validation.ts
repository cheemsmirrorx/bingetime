import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().optional(),
});

export const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .min(2, "Username must be at least 2 characters")
    .max(32, "Username must be at most 32 characters")
    .regex(/^[a-zA-Z0-9_.-]+$/, "Username may only contain letters, numbers, underscores, dots, and hyphens"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const profileUpdateSchema = z.object({
  username: z
    .string()
    .trim()
    .min(2, "Username must be at least 2 characters")
    .max(32)
    .optional(),
  avatar: z.string().url("Avatar must be a valid URL").nullable().optional(),
});

export const watchlistPostSchema = z.object({
  content_id: z.string().min(1, "content_id is required"),
});

export const watchHistoryPostSchema = z.object({
  content_id: z.string().min(1, "content_id is required"),
  episode_id: z.string().nullable().optional(),
  progress: z.number().min(0).max(100),
  progress_seconds: z.number().min(0).int(),
  duration_seconds: z.number().min(0).int(),
});

export const requestPostSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(160),
  content_type: z.enum(["movie", "series"]).default("movie"),
  release_year: z.number().int().min(1900).max(2100).nullable().optional(),
  notes: z.string().trim().max(500).nullable().optional(),
});

export const categorySchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().min(2).max(80).optional(),
  description: z.string().trim().max(300).nullable().optional(),
  display_order: z.number().int().min(0).optional(),
});

export const mediaSourceInputSchema = z.object({
  label: z.string().trim().min(1).max(80),
  url: z.string().trim().min(1),
  quality: z.string().trim().min(1).max(20).default("1080p"),
  format: z.enum(["mp4", "webm", "hls"]).default("mp4"),
  subtitle_url: z.string().trim().nullable().optional(),
  subtitle_lang: z.string().trim().nullable().optional(),
  is_active: z.boolean().default(true),
});

export const adminContentSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  slug: z.string().trim().optional(),
  description: z.string().trim().min(1, "Description is required").max(3000),
  poster: z.string().trim().min(1, "Poster URL is required"),
  backdrop: z.string().trim().min(1, "Backdrop URL is required"),
  release_year: z.coerce.number().int().min(1888).max(2100),
  rating: z.coerce.number().min(0).max(10).default(7.5),
  category: z.string().trim().min(1).default("trending-now"),
  genres: z.array(z.string().trim()).min(1, "At least one genre is required"),
  platform: z.string().trim().nullable().optional(),
  content_type: z.enum(["movie", "series"]),
  featured: z.boolean().default(false),
  featured_badge: z.string().trim().nullable().optional(),
  badge_text: z.string().trim().nullable().optional(),
  age_rating: z.string().trim().nullable().optional(),
  quality: z.string().trim().nullable().optional(),
  runtime_minutes: z.coerce.number().int().positive().nullable().optional(),
  language: z.string().trim().nullable().optional(),
  status: z.string().trim().nullable().optional(),
  network: z.string().trim().nullable().optional(),
  budget: z.string().trim().nullable().optional(),
  revenue: z.string().trim().nullable().optional(),
  tmdb_id: z.coerce.number().int().positive().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  sources: z.array(mediaSourceInputSchema).optional(),
});

