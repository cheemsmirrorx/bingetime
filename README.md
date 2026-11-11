# RONIN X STREAM

Full-stack streaming catalog, media playback, community requests, watchlist, and admin management application built with **Next.js (App Router)**, **React**, **TypeScript**, **Tailwind CSS**, **Framer Motion**, and **Supabase**.

## Features

- **Editorial Dark Streaming UI:** Emerald (`#10b981`) on obsidian (`#0a0a0a`) design system with `Inter` and `JetBrains Mono` typography, full-bleed hero carousel, Top 10 numbered shelf, streaming platform filter cards, genre chips, and horizontal snap shelves.
- **Full Catalog & Live Search:** Separate Movies (`/movies`), TV Shows (`/series`), Category/Collection Browse (`/browse/[slug]`), and Multi-Facet Search (`/search`) supporting title search suggestions, type, category, genre, platform, release-year filters, and pagination.
- **Detail Pages & Authorized Media Player:** Full movie (`/movie/[slug]`) and series (`/tv-shows/[slug]`) pages with season/episode picker, cast cards, metadata specs, downloadable quality list, and an interactive HTML5 `<video>` player with play/pause, volume/mute, fullscreen, multi-source selector, WebVTT subtitles (`/public/subtitles/`), and synced resume playback.
- **Authentication & User Features:** Registration, sign in/out, session persistence, editable profile (`/profile`), continue-watching history, persistent watchlist (`/watchlist`), and community title requests with upvoting (`/requests`).
- **Protected Admin Dashboard (`/admin`):** Server- and database-protected management console for overview stats, content CRUD, server-side TMDB metadata import, Supabase Storage / local asset uploads, authorized media source editing, categories, user roles, and community request moderation.
- **Supabase + Local Development Fallback:** Uses real Supabase Auth, PostgreSQL (with RLS policies), and Storage when `NEXT_PUBLIC_SUPABASE_URL` and keys are set; automatically falls back to a cryptographically signed local JSON/scrypt store (`database/local-store.json`) so local development and QA work immediately out of the box.

## Directory Structure

```
├── app/                     # Next.js App Router pages & REST API route handlers
│   ├── admin/               # Protected Admin Dashboard
│   ├── api/                 # Public, authenticated user, and admin API endpoints
│   ├── browse/[slug]/       # Category / collection full-grid browser
│   ├── movie/[slug]/        # Movie detail + player route
│   ├── tv-shows/[slug]/     # Series detail + season/episode picker + player
│   ├── movies/              # Movies catalog view
│   ├── series/              # TV Series catalog view
│   ├── search/              # Multi-filter catalog search
│   ├── watchlist/           # User watchlist
│   ├── profile/             # User profile & continue-watching history
│   ├── requests/            # Community requests & upvoting
│   └── privacy-policy|dmca|credits/
├── components/
│   ├── admin/               # Admin login gate, dashboard tabs, content modal
│   ├── content/             # Hero carousel, cards, Top 10 row, filters, search, detail view
│   ├── layout/              # Navbar, footer, auth modal, overlays, legal shell
│   ├── player/              # Interactive HTML5 media player with subtitle & resume sync
│   └── ui/                  # Brand logo & platform SVG badges
├── database/
│   ├── migrations/          # SQL schema, indexes, triggers, RLS, Storage bucket policies
│   ├── seed-data.ts         # Verified sample catalog, categories, CC0 streams, requests
│   └── seed.sql             # PostgreSQL seed script for Supabase
├── documentation/           # Phase One UI/UX inspection report & Vercel deployment guide
├── hooks/                   # Auth context provider (`useAuth`)
├── lib/
│   ├── api/                 # Zod request schemas, HTTP auth/admin guards, TMDB client
│   ├── auth/                # Session helpers (`getCurrentUser`, `requireAuth`, `requireAdmin`)
│   ├── db/                  # Unified repository (`repository.ts`) + local fallback store
│   └── supabase/            # SSR cookie client, browser client, admin service-role client
├── public/subtitles/        # Sample WebVTT caption tracks
├── styles/globals.css       # Tailwind v4 configuration & custom utilities
└── types/index.ts           # Shared TypeScript interfaces
```

## Quick Start (Local Development)

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env.local` from `.env.example`:
   ```bash
   cp .env.example .env.local
   ```
   > **Note:** On Windows PowerShell use `Copy-Item .env.example .env.local`. Even before adding Supabase keys, the app runs in local fallback mode with full auth, database persistence, watchlist, history, requests, and admin CRUD.

3. Run the development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

### Seeded Local Fallback Accounts
When running without Supabase environment variables configured:
- **Administrator:** `admin@roninxstream.local` / `Admin@123456`
- **Member Account:** `demo@roninxstream.local` / `Demo@123456`

## Supabase Configuration

1. Create a new project in [Supabase](https://supabase.com/).
2. Open the **SQL Editor** in your Supabase project and execute:
   - `database/migrations/001_initial_schema.sql` (creates `users`, `categories`, `content`, `episodes`, `media_sources`, `watchlist`, `watch_history`, `requests`, `request_votes`, triggers, RLS policies, and the `ronin-media` storage bucket).
   - `database/seed.sql` (populates initial categories, movies, series, episodes, authorized CC0 media sources, and sample requests).
3. Copy your Project URL, Publishable/Anon key, and Service Role key into `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
   TMDB_API_KEY=YOUR_TMDB_API_KEY
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```
4. Register your own user via the app UI, then promote that account to administrator in Supabase SQL Editor:
   ```sql
   UPDATE public.users SET role = 'admin' WHERE email = 'your-admin@example.com';
   ```

## Scripts

- `npm run dev` — Start local Next.js dev server
- `npm run typecheck` — Run strict TypeScript checking (`tsc --noEmit`)
- `npm run lint` — Run ESLint
- `npm run build` — Build production bundle
- `npm run start` — Serve production build

## Security & Media Compliance

- **Server-Side Secret Isolation:** `SUPABASE_SERVICE_ROLE_KEY` and `TMDB_API_KEY` are only accessed in server modules and route handlers—never shipped to browser bundles.
- **Defense in Depth:** All admin API routes enforce `role === 'admin'` via `withAdmin` / `requireAdmin`, backed by PostgreSQL Row Level Security policies (`is_admin()`).
- **Authorized Streams Only:** Playback uses owner-provided / public-domain / CC0 streams and WebVTT subtitles with standard HTML5 media controls—no DRM circumvention or unauthorized scraping.

## Documentation

- [Inspection Report](documentation/INSPECTION_REPORT.md)
- [Supabase & Vercel Deployment Guide](documentation/DEPLOYMENT.md)

