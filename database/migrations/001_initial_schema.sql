-- ============================================================================
-- RONIN X STREAM — PostgreSQL & Supabase Schema Migration (001_initial_schema)
-- Includes tables, foreign keys, indexes, constraints, auth triggers,
-- Row Level Security (RLS) policies, and Storage bucket setup.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. USERS PROFILE TABLE (Linked to auth.users)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  avatar TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- Automatically create a public.users profile row when a Supabase Auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_username TEXT;
BEGIN
  v_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    SPLIT_PART(NEW.email, '@', 1) || '_' || SUBSTR(NEW.id::TEXT, 1, 4)
  );
  INSERT INTO public.users (id, username, email, avatar, role)
  VALUES (
    NEW.id,
    v_username,
    NEW.email,
    NEW.raw_user_meta_data->>'avatar',
    'user'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Helper function for RLS admin checks
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ----------------------------------------------------------------------------
-- 2. CATEGORIES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);

-- ----------------------------------------------------------------------------
-- 3. CONTENT TABLE (Movies & Series)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  poster TEXT NOT NULL,
  backdrop TEXT NOT NULL,
  release_year INTEGER NOT NULL CHECK (release_year BETWEEN 1888 AND 2100),
  rating NUMERIC(3,1) NOT NULL DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 10),
  category TEXT NOT NULL DEFAULT 'trending-now',
  genres TEXT[] NOT NULL DEFAULT '{}',
  platform TEXT,
  content_type TEXT NOT NULL CHECK (content_type IN ('movie', 'series')),
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  featured_badge TEXT,
  badge_text TEXT,
  age_rating TEXT DEFAULT '13+',
  quality TEXT DEFAULT 'FHD',
  runtime_minutes INTEGER,
  language TEXT DEFAULT 'English',
  status TEXT DEFAULT 'Released',
  network TEXT,
  budget TEXT,
  revenue TEXT,
  tmdb_id INTEGER,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_slug ON public.content(slug);
CREATE INDEX IF NOT EXISTS idx_content_type ON public.content(content_type);
CREATE INDEX IF NOT EXISTS idx_content_category ON public.content(category);
CREATE INDEX IF NOT EXISTS idx_content_platform ON public.content(platform);
CREATE INDEX IF NOT EXISTS idx_content_release_year ON public.content(release_year DESC);
CREATE INDEX IF NOT EXISTS idx_content_genres ON public.content USING GIN(genres);
CREATE INDEX IF NOT EXISTS idx_content_title_search ON public.content USING GIN(to_tsvector('english', title || ' ' || description));

-- ----------------------------------------------------------------------------
-- 4. EPISODES TABLE (For Series)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.episodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
  season_number INTEGER NOT NULL CHECK (season_number >= 1),
  episode_number INTEGER NOT NULL CHECK (episode_number >= 1),
  title TEXT NOT NULL,
  overview TEXT NOT NULL DEFAULT '',
  still_path TEXT,
  air_date TEXT,
  duration_seconds INTEGER NOT NULL DEFAULT 1440,
  media_url TEXT NOT NULL,
  subtitle_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(content_id, season_number, episode_number)
);

CREATE INDEX IF NOT EXISTS idx_episodes_content_season ON public.episodes(content_id, season_number, episode_number);

-- ----------------------------------------------------------------------------
-- 5. AUTHORIZED MEDIA SOURCES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.media_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
  episode_id UUID REFERENCES public.episodes(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  quality TEXT NOT NULL DEFAULT '1080p',
  format TEXT NOT NULL DEFAULT 'mp4' CHECK (format IN ('mp4', 'webm', 'hls')),
  subtitle_url TEXT,
  subtitle_lang TEXT DEFAULT 'English',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_media_sources_content ON public.media_sources(content_id, sort_order);

-- ----------------------------------------------------------------------------
-- 6. WATCHLIST TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, content_id)
);

CREATE INDEX IF NOT EXISTS idx_watchlist_user ON public.watchlist(user_id, created_at DESC);

-- ----------------------------------------------------------------------------
-- 7. WATCH HISTORY TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.watch_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
  episode_id UUID REFERENCES public.episodes(id) ON DELETE SET NULL,
  progress NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  progress_seconds INTEGER NOT NULL DEFAULT 0 CHECK (progress_seconds >= 0),
  duration_seconds INTEGER NOT NULL DEFAULT 0 CHECK (duration_seconds >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_watch_history_unique
  ON public.watch_history(user_id, content_id, COALESCE(episode_id, '00000000-0000-0000-0000-000000000000'::uuid));
CREATE INDEX IF NOT EXISTS idx_watch_history_user_updated ON public.watch_history(user_id, updated_at DESC);

-- ----------------------------------------------------------------------------
-- 8. COMMUNITY REQUESTS & VOTES TABLES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'movie' CHECK (content_type IN ('movie', 'series')),
  release_year INTEGER,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'fulfilled', 'rejected')),
  votes_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_requests_status ON public.requests(status, votes_count DESC);

CREATE TABLE IF NOT EXISTS public.request_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(request_id, user_id)
);

-- ----------------------------------------------------------------------------
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_votes ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "Users can update own non-role profile" ON public.users
  FOR UPDATE USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (
    (auth.uid() = id AND role = (SELECT role FROM public.users WHERE id = auth.uid()))
    OR public.is_admin()
  );

-- Public catalog read policies (categories, content, episodes, active media_sources)
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (TRUE);
CREATE POLICY "Admin manage categories" ON public.categories FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Public read content" ON public.content FOR SELECT USING (TRUE);
CREATE POLICY "Admin manage content" ON public.content FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Public read episodes" ON public.episodes FOR SELECT USING (TRUE);
CREATE POLICY "Admin manage episodes" ON public.episodes FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Public read active media_sources" ON public.media_sources FOR SELECT USING (is_active = TRUE OR public.is_admin());
CREATE POLICY "Admin manage media_sources" ON public.media_sources FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Watchlist policies (strictly scoped to owner)
CREATE POLICY "Users manage own watchlist" ON public.watchlist
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Watch history policies (strictly scoped to owner)
CREATE POLICY "Users manage own watch_history" ON public.watch_history
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Community requests policies
CREATE POLICY "Public read requests" ON public.requests FOR SELECT USING (TRUE);
CREATE POLICY "Authenticated users create requests" ON public.requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin update/delete requests" ON public.requests
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Public read request votes" ON public.request_votes FOR SELECT USING (TRUE);
CREATE POLICY "Users toggle own votes" ON public.request_votes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 10. SUPABASE STORAGE BUCKET FOR AUTHORIZED ARTWORK & MEDIA ASSETS
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('ronin-media', 'ronin-media', TRUE)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read ronin-media" ON storage.objects
  FOR SELECT USING (bucket_id = 'ronin-media');

CREATE POLICY "Admin upload ronin-media" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'ronin-media' AND public.is_admin());

CREATE POLICY "Admin update/delete ronin-media" ON storage.objects
  FOR DELETE USING (bucket_id = 'ronin-media' AND public.is_admin());

