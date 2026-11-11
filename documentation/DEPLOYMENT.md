# Supabase, Environment & Vercel Deployment Guide

## 1. Environment Variables Reference

| Variable | Visibility | Required in Prod | Description |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public + Server | Yes | Supabase project URL (`https://xxxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public + Server | Yes | Supabase publishable (`sb_publishable_...`) or anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server Only** | Yes | Admin database & storage operations (`/api/admin/*`) |
| `TMDB_API_KEY` | **Server Only** | Optional | TMDB v3 API key used only in `GET /api/admin/tmdb` |
| `NEXT_PUBLIC_APP_URL` | Public + Server | Yes | Canonical URL (e.g. `https://ronin-x-stream.vercel.app`) |
| `LOCAL_AUTH_SECRET` | **Server Only** | Local Dev Only | HMAC signing secret when running without Supabase |

Never prefix `SUPABASE_SERVICE_ROLE_KEY` or `TMDB_API_KEY` with `NEXT_PUBLIC_`.

---

## 2. Supabase Project Setup

### Step A — Run Database Migrations & Seed Data
1. In the Supabase Dashboard, open **SQL Editor**.
2. Paste and run the full contents of [`database/migrations/001_initial_schema.sql`](../database/migrations/001_initial_schema.sql).
   This creates:
   - Tables: `users`, `categories`, `content`, `episodes`, `media_sources`, `watchlist`, `watch_history`, `requests`, `request_votes`
   - Indexes for slug lookup, release years, GIN genre arrays, and user activity
   - `handle_new_user()` trigger syncing `auth.users` inserts into `public.users`
   - `is_admin()` helper and complete Row Level Security (`ENABLE ROW LEVEL SECURITY`) policies
   - Public storage bucket `ronin-media` with admin-only write/delete policies
3. Next, run [`database/seed.sql`](../database/seed.sql) in **SQL Editor** to seed categories, curated titles, episodes, and CC0 sample playback sources.

### Step B — Authentication Settings
1. Navigate to **Authentication -> URL Configuration**.
2. Set **Site URL** to your production domain (e.g., `https://your-app.vercel.app`).
3. Add **Redirect URLs**:
   - `http://localhost:3000/**`
   - `https://your-app.vercel.app/**`
4. Under **Authentication -> Providers -> Email**, ensure Email provider is enabled. For instant frictionless testing you may toggle email confirmation as desired.

### Step C — Create First Administrator Account
1. Register a standard account using the **Sign Up** modal on the live site or `POST /api/auth/register`.
2. Promote that user in **SQL Editor**:
   ```sql
   UPDATE public.users
   SET role = 'admin'
   WHERE email = 'admin@yourdomain.com';
   ```
3. Sign out and sign back in, then open `/admin` to access the Admin Dashboard.

---

## 3. Deploying to Vercel

1. Push this repository to GitHub, GitLab, or Bitbucket.
2. Open [Vercel](https://vercel.com/new) and import the repository.
3. Keep the default **Framework Preset: Next.js** and root directory.
4. Add all Environment Variables in **Project Settings -> Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `TMDB_API_KEY`
   - `NEXT_PUBLIC_APP_URL` (set to your Vercel production URL)
5. Trigger **Deploy**.
6. Wait for the build (`npm run build`) to finish and verify your deployment.

---

## 4. Post-Deployment Verification Checklist

- [ ] Homepage renders Hero Carousel, Platform Strip, Genre Strip, Top 10 shelf, and category rows with no console errors.
- [ ] Search page (`/search`) and Navbar instant suggestions return live database records.
- [ ] User registration and login create real Supabase sessions and persist across refreshes.
- [ ] Adding/removing items on `/movie/[slug]` or `/tv-shows/[slug]` persists in `/watchlist`.
- [ ] Playing authorized sample video records progress in `watch_history` and appears under `/profile`.
- [ ] Unauthenticated and non-admin requests to `/api/admin/*` return `401` / `403`.
- [ ] Signed-in admins can create/edit/delete content, upload assets to `ronin-media`, manage categories/users, and moderate `/requests`.

