# RONIN X STREAM — Phase One Inspection & Architecture Decisions

**Inspected Reference URL:** `https://roninxstream.pages.dev/`  
**Inspection Method:** Headless Edge (Playwright) inspection across desktop (`1440×900`), tablet (`768×1024`), and mobile (`390×844`) viewports, plus interactive DOM, computed CSS, and route analysis.

---

## 1. Visual Design System Observed

### Color Palette
- **Primary Canvas Background:** `#0a0a0a` (with `--bg: #050505` CSS token on root)
- **Elevated Surface / Card / Modal Background:** `rgba(24, 24, 27, 0.5)` (`bg-zinc-900/50`), `#111113`, `#141416`, `#1a1a1a` (cookie/dialogs)
- **Primary Brand & Accent Color:** `#10b981` (`emerald-500`), hover `#34d399` (`emerald-400`), soft glow `rgba(16, 185, 129, 0.25)`
- **Border Tokens:** `rgba(255, 255, 255, 0.05)` (`border-white/5`), `rgba(255, 255, 255, 0.10)` (`border-white/10`), hover `rgba(255, 255, 255, 0.20)`
- **Typography Colors:** `#ffffff` (primary headings), `#d1d5db` (`gray-300` body), `#9ca3af` (`gray-400` metadata), `#6b7280` (`gray-500` micro uppercase labels), `#000000` (on `#10b981` CTAs/badges)

### Typography
- **Primary Sans:** `Inter, ui-sans-serif, system-ui, sans-serif` (weights 300–900)
- **Monospace Accent:** `JetBrains Mono` (weights 400, 700)
- **Logo Wordmark:** `RONIN` (`#10b981`) `X` (`#ffffff`) `STREAM` (`#10b981`), `font-black tracking-tighter uppercase` (`24px` desktop, `20px` mobile)
- **Hero Headline:** `text-2xl sm:text-4xl md:text-6xl font-black tracking-tight leading-tight drop-shadow-2xl` (`60px` desktop)
- **Browse Section Micro Headers:** `text-[10px] md:text-sm font-black tracking-[0.2em] md:tracking-[0.3em] text-gray-500 uppercase`
- **Row Headers:** `text-base md:text-2xl font-black tracking-tighter uppercase text-white/90` (`TOP 10 THIS WEEK` features a `4px` emerald left accent bar)

### Component Proportions & Effects
- **Fixed Navbar (`70px` height):** Translucent gradient (`from-black/80 to-transparent backdrop-blur-md`) transitioning to solid dark glass on scroll; desktop links (`Home`, `Movies`, `Series`, `Requests`), pill search (`Titles, genres...`), and emerald pill auth button.
- **Hero Carousel (`85vh`):** Full-bleed backdrop image with dual directional vignette gradients (`to-r` and `to-t`), left-aligned metadata badges (`FEATURED SERIES/MOVIE`, episode pill, `★ rating`), `Play Now` + `More Info` buttons, right-aligned `< >` arrow squares, and centered bottom progress dots (active emerald pill).
- **Browse by Platform:** Horizontal scrollable square tiles (`80×80px` mobile, `128×128px` desktop, `rounded-lg`), selected state adds emerald border + corner checkmark + `Clear Filter`.
- **Browse by Genre:** Horizontal pill scroller (`# Action`, `# Adventure`, `# Animation`, etc.), active pill turns `#10b981` with black text + `Clear Filter` + `Showing <Genre> Content` indicator.
- **Poster Cards:** `200×300px` (`2:3` aspect ratio), `rounded-lg`, top-left emerald rating badge (`★ 8.5`), optional top-right emerald status badge (`S02E06 ADDED`, `EP 08 ADDED`, `NEW`, `HINDI`), hover reveals dark gradient overlay, centered emerald circular Play icon, title, and `YEAR • TYPE`.
- **Top 10 Cards:** Giant translucent rank number (`1–10`) tucked behind the left poster edge, bottom gradient, emerald star pill, and white title inside the card bottom.

---

## 2. Discovered Routes & Interactive Surfaces

| Route / Modal | Observed Functionality |
|---|---|
| `/` | Home with Hero Carousel, Platform filter strip, Genre filter pills, Top 10 row, Latest/Trending/Genre/Collection horizontal rows, Telegram promo modal, Cookie policy toast & settings |
| `/movies` & `/series` | Dedicated filtered hero carousel + curated rows/grid for Movies or TV Series |
| `/browse/[section]` | Full 6-column grid view triggered by `VIEW ALL >` with back button, genre/year filters, and pagination |
| `/search` & Nav Search | Live dropdown with `RECENT SEARCHES` (`CLEAR`) + instant suggestions; full results grid with filters & empty state |
| `/movie/[slug]` & `/tv-shows/[slug]` | Full-bleed backdrop hero, match %, age/quality/platform badges, `Play Now`, `+ Add to Watchlist`, inline player toggle, `ALTERNATIVE SOURCES`, `OVERVIEW` + `SHARE`, `CAST` with `Show More`, 4-column specs (`STATUS`, `LANGUAGE`, `NETWORK`/`BUDGET`, `TOTAL EPISODES`/`REVENUE`), Season selector + Episode cards (`▶ STREAM`), `MORE LIKE THIS` |
| `/requests` | `COMMUNITY REQUESTS` hero, status filter tabs (`All`, `Pending`, `Approved`, `Fulfilled`, `Rejected`), community upvoting & request submission |
| `/watchlist` | Protected saved content view |
| `/profile` | Protected user profile, preferences, watchlist summary, and watch history |
| `/admin` | Protected administration panel |
| `/privacy-policy`, `/dmca`, `/credits` | Styled policy & attribution pages |
| Auth Modal (`WELCOME BACK` / `JOIN THE RONIN`) | Email/password login (`REMEMBER ME`), Sign Up (`USERNAME`, `EMAIL ADDRESS`, `PASSWORD`) |
| Mobile Drawer (`< 768px`) | Slide-out left drawer with `RONIN X`, nav links with chevrons, and full-width `SIGN IN NOW` emerald CTA |

---

## 3. Documented Implementation Decisions (Where Reference Could Not Be Inspected or Requires Compliance)

1. **Authorized Media Player (Replacing Unauthorized Third-Party Embeds):**
   - The reference site's `/tv-shows/...` player embeds external third-party streaming iframes (`nhdapi.com` etc.).
   - In compliance with project requirements ("Never scrape unauthorized streaming sources or bypass DRM or access restrictions. Use licensed media or owner-provided media URLs"), our recreation implements a custom, full-featured HTML5 `<video>` media player supporting Play/Pause, scrubbing seek bar, volume/mute, playback speed, WebVTT subtitle tracks, Fullscreen, Resume playback from `watch_history`, and owner-configured authorized media sources managed in `/admin`.
2. **Broken External Platform Brand Images:**
   - On `roninxstream.pages.dev`, several Wikimedia/wikiflux brand logo URLs (Zee5, JioCinema, Crunchyroll, Chaupal, STAGE, Aha) failed to load (`naturalWidth: 0`).
   - We render crisp, custom inline SVG wordmarks/icons inside the platform tiles so zero images ever fail or look broken.
3. **Admin Dashboard (`/admin`):**
   - `/admin` redirects unauthenticated visitors on the reference site, so its internal UI could not be inspected.
   - We designed a dark emerald-accented Admin Dashboard consistent with the RONIN X STREAM design system (`#0a0a0a`, `zinc-900/50`, `#10b981`, `JetBrains Mono` metrics), protected both server-side and via Supabase RLS (`role = 'admin'`).
4. **Database Resilience (Supabase + Local Dev Store):**
   - Production uses Supabase Auth, PostgreSQL (with RLS), and Supabase Storage (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
   - If Supabase environment variables are not yet configured during initial local inspection/testing, the data layer transparently operates against a persistent file-backed local store (`database/local-store.json`) with scrypt password hashing and HMAC-signed HttpOnly session cookies so all features remain genuinely functional and verifiable end-to-end.

