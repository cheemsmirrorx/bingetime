const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMG = "https://image.tmdb.org/t/p";

export interface TmdbSearchResult {
  tmdb_id: number;
  title: string;
  content_type: "movie" | "series";
  description: string;
  poster: string;
  backdrop: string;
  release_year: number;
  rating: number;
  genres: string[];
  language: string;
  runtime_minutes: number | null;
  status: string | null;
}

const GENRE_MAP: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Sci-Fi",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
  10759: "Action",
  10765: "Sci-Fi",
};

export function isTmdbConfigured(): boolean {
  return Boolean(process.env.TMDB_API_KEY?.trim());
}

/**
 * Server-only TMDB multi-search helper for metadata lookup in the Admin Dashboard.
 */
export async function searchTmdbTitles(query: string): Promise<TmdbSearchResult[]> {
  const apiKey = process.env.TMDB_API_KEY?.trim();
  if (!apiKey || !query.trim()) return [];

  const url = new URL(`${TMDB_BASE}/search/multi`);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("query", query.trim());
  url.searchParams.set("include_adult", "false");

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) {
    throw new Error(`TMDB request failed with status ${res.status}`);
  }
  const json = await res.json();
  const results = Array.isArray(json.results) ? json.results : [];

  return results
    .filter((item: Record<string, unknown>) => item.media_type === "movie" || item.media_type === "tv")
    .slice(0, 10)
    .map((item: Record<string, unknown>) => {
      const isTv = item.media_type === "tv";
      const dateStr = String((isTv ? item.first_air_date : item.release_date) ?? "");
      const year = parseInt(dateStr.slice(0, 4), 10) || new Date().getFullYear();
      const genreIds = Array.isArray(item.genre_ids) ? (item.genre_ids as number[]) : [];

      return {
        tmdb_id: Number(item.id),
        title: String((isTv ? item.name : item.title) ?? "Untitled"),
        content_type: isTv ? "series" : "movie",
        description: String(item.overview ?? ""),
        poster: item.poster_path ? `${TMDB_IMG}/w500${item.poster_path}` : "",
        backdrop: item.backdrop_path ? `${TMDB_IMG}/original${item.backdrop_path}` : "",
        release_year: year,
        rating: Number(Number(item.vote_average ?? 0).toFixed(1)),
        genres: genreIds.map((id) => GENRE_MAP[id]).filter(Boolean),
        language: String(item.original_language ?? "en").toUpperCase(),
        runtime_minutes: null,
        status: "Released",
      };
    });
}

