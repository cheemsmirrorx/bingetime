"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bookmark,
  ChevronRight,
  Clock,
  LogIn,
  LogOut,
  Menu,
  MessageSquarePlus,
  Search,
  Shield,
  User as UserIcon,
  X,
} from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { MediaImage } from "@/components/content/MediaImage";

interface SearchSuggestion {
  id: string;
  slug: string;
  title: string;
  content_type: "movie" | "series";
  release_year: number;
  rating: number;
  poster: string;
}

const RECENT_SEARCHES_KEY = "ronin_recent_searches";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, openAuthModal, logout } = useAuth();

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const [query, setQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const searchBoxRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function loadRecentSearches() {
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (saved) setRecentSearches(JSON.parse(saved));
    } catch {
      // ignore storage failure
    }
  }

  function closeAllMenus() {
    setMobileOpen(false);
    setUserMenuOpen(false);
    setSearchFocused(false);
  }

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) return;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}&limit=6`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.suggestions ?? []);
        }
      } catch {
        // ignore abort/network blip
      }
    }, 180);
    return () => clearTimeout(timer);
  }, [query]);

  const visibleSuggestions = query.trim() ? suggestions : [];

  function saveRecentSearch(term: string) {
    const next = [term, ...recentSearches.filter((s) => s.toLowerCase() !== term.toLowerCase())].slice(0, 6);
    setRecentSearches(next);
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }

  function clearRecentSearches() {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
      // ignore
    }
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    saveRecentSearch(trimmed);
    setSearchFocused(false);
    setMobileSearchOpen(false);
    window.dispatchEvent(new CustomEvent("ronin:search-query", { detail: trimmed }));
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Movies", href: "/movies" },
    { label: "Series", href: "/series" },
    { label: "Requests", href: "/requests", icon: MessageSquarePlus },
    ...(user ? [{ label: "Watchlist", href: "/watchlist" }] : []),
  ];

  return (
    <>
      <nav
        className={cn(
          "fixed top-0 left-0 right-0 z-[100] px-4 md:px-6 py-4 flex items-center justify-between backdrop-blur-md transition-all duration-300",
          scrolled
            ? "bg-[#0a0a0a]/92 border-b border-white/5 shadow-lg shadow-black/40"
            : "bg-gradient-to-b from-black/85 to-transparent"
        )}
      >
        <div className="flex items-center gap-4 md:gap-8">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation menu"
            className="md:hidden p-2 hover:bg-white/10 rounded-full transition-colors text-gray-300"
          >
            <Menu className="w-5 h-5" />
          </button>

          <BrandLogo />

          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => {
              const active =
                item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "text-sm font-medium transition-colors flex items-center gap-1.5",
                    active ? "text-emerald-500" : "text-gray-300 hover:text-white"
                  )}
                >
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Desktop Search Pill */}
          <div ref={searchBoxRef} className="relative hidden sm:block">
            <form onSubmit={handleSearchSubmit}>
              <div
                className={cn(
                  "flex items-center gap-2 rounded-full bg-black/50 border px-3.5 py-1.5 w-56 md:w-72 transition-colors",
                  searchFocused ? "border-emerald-500/80" : "border-white/10 hover:border-white/20"
                )}
              >
                <Search className="w-4 h-4 text-zinc-400 shrink-0" />
                <input
                  type="search"
                  value={query}
                  onFocus={() => {
                    loadRecentSearches();
                    setSearchFocused(true);
                  }}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Titles, genres..."
                  aria-label="Search titles and genres"
                  className="bg-transparent text-xs md:text-sm text-white placeholder:text-zinc-500 outline-none w-full"
                />
              </div>
            </form>

            {/* Instant Search & Recent Searches Dropdown */}
            <AnimatePresence>
              {searchFocused && (query.trim().length > 0 || recentSearches.length > 0) && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.14 }}
                  className="absolute right-0 mt-2 w-80 rounded-xl bg-[#111113]/95 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden z-[120]"
                >
                  {recentSearches.length > 0 && (
                    <div className="p-3 border-b border-white/5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold tracking-widest uppercase text-zinc-500">
                          RECENT SEARCHES
                        </span>
                        <button
                          type="button"
                          onClick={clearRecentSearches}
                          className="text-[10px] font-bold uppercase text-emerald-500 hover:text-emerald-400 cursor-pointer"
                        >
                          CLEAR
                        </button>
                      </div>
                      <div className="space-y-1">
                        {recentSearches.map((term) => (
                          <button
                            key={term}
                            type="button"
                            onClick={() => {
                              setQuery(term);
                              setSearchFocused(false);
                              router.push(`/search?q=${encodeURIComponent(term)}`);
                            }}
                            className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-zinc-300 hover:bg-white/5 hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
                          >
                            <Clock className="w-3.5 h-3.5 text-zinc-500" />
                            <span className="truncate">{term}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {query.trim().length > 0 && (
                    <div className="p-2">
                      {visibleSuggestions.length === 0 ? (
                        <div className="px-3 py-4 text-xs text-zinc-500 text-center">
                          No instant matches for &ldquo;{query}&rdquo;
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {visibleSuggestions.map((s) => (
                            <Link
                              key={s.id}
                              href={
                                s.content_type === "series"
                                  ? `/tv-shows/${s.slug}`
                                  : `/movie/${s.slug}`
                              }
                              onClick={() => {
                                saveRecentSearch(s.title);
                                setSearchFocused(false);
                              }}
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
                            >
                              <div className="w-9 h-12 rounded overflow-hidden shrink-0 bg-zinc-900">
                                <MediaImage src={s.poster} alt={s.title} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-bold text-white truncate">
                                  {s.title}
                                </div>
                                <div className="text-[11px] text-zinc-400">
                                  {s.release_year} • {s.content_type.toUpperCase()} • ★ {s.rating}
                                </div>
                              </div>
                            </Link>
                          ))}
                          <Link
                            href={`/search?q=${encodeURIComponent(query.trim())}`}
                            onClick={() => setSearchFocused(false)}
                            className="block text-center py-2 text-xs font-bold text-emerald-500 hover:text-emerald-400 border-t border-white/5 mt-1"
                          >
                            View all search results →
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile Search Icon Toggle */}
          <button
            type="button"
            onClick={() => setMobileSearchOpen((v) => !v)}
            aria-label="Toggle search"
            className="sm:hidden p-2 hover:bg-white/10 rounded-full transition-colors text-gray-300"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Auth / User Pill */}
          {!user ? (
            <button
              type="button"
              onClick={() => openAuthModal("signin")}
              aria-label="Sign In"
              className="bg-emerald-500 hover:bg-emerald-400 text-black px-4 md:px-5 py-2 rounded-full text-xs md:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
            </button>
          ) : (
            <div ref={userMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen((v) => !v)}
                aria-label="User menu"
                className="bg-zinc-900/90 hover:bg-zinc-800 border border-white/10 hover:border-emerald-500/50 text-white pl-2 pr-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer"
              >
                <span className="w-6 h-6 rounded-full bg-emerald-500 text-black font-black text-xs flex items-center justify-center uppercase">
                  {user.username.slice(0, 1)}
                </span>
                <span className="hidden md:inline max-w-[100px] truncate">{user.username}</span>
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    className="absolute right-0 mt-2 w-56 rounded-xl bg-[#121214] border border-white/10 shadow-2xl p-2 z-[130]"
                  >
                    <div className="px-3 py-2 border-b border-white/5 mb-1">
                      <div className="text-xs font-bold text-white truncate">{user.username}</div>
                      <div className="text-[11px] text-zinc-400 truncate">{user.email}</div>
                    </div>
                    <Link
                      href="/profile"
                      onClick={closeAllMenus}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-zinc-300 hover:text-white hover:bg-white/5"
                    >
                      <UserIcon className="w-4 h-4 text-emerald-500" />
                      My Profile & History
                    </Link>
                    <Link
                      href="/watchlist"
                      onClick={closeAllMenus}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-zinc-300 hover:text-white hover:bg-white/5"
                    >
                      <Bookmark className="w-4 h-4 text-emerald-500" />
                      My Watchlist
                    </Link>
                    {user.role === "admin" && (
                      <Link
                        href="/admin"
                        onClick={closeAllMenus}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-emerald-400 hover:bg-emerald-500/10 font-semibold"
                      >
                        <Shield className="w-4 h-4" />
                        Admin Dashboard
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={async () => {
                        await logout();
                        setUserMenuOpen(false);
                        router.refresh();
                      }}
                      className="w-full mt-1 border-t border-white/5 pt-2 flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-red-400 hover:bg-red-500/10 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile Expandable Search Bar */}
      <AnimatePresence>
        {mobileSearchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="fixed top-[68px] left-0 right-0 z-[95] bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/10 p-3 sm:hidden"
          >
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 rounded-full bg-zinc-900 border border-white/10 px-3.5 py-2">
                <Search className="w-4 h-4 text-zinc-400" />
                <input
                  type="search"
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Titles, genres..."
                  className="bg-transparent text-sm text-white placeholder:text-zinc-500 outline-none w-full"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-full bg-emerald-500 text-black text-xs font-bold"
              >
                Go
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Drawer Navigation */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[160] bg-black/75 backdrop-blur-sm md:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.22 }}
              onClick={(e) => e.stopPropagation()}
              className="w-72 h-full bg-[#0a0a0a] border-r border-white/10 flex flex-col justify-between p-5"
            >
              <div>
                <div className="flex items-center justify-between mb-8">
                  <BrandLogo compact size="md" />
                  <button
                    type="button"
                    onClick={() => setMobileOpen(false)}
                    aria-label="Close navigation drawer"
                    className="p-1.5 text-zinc-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-1.5">
                  {navItems.map((item) => {
                    const active =
                      item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeAllMenus}
                        className={cn(
                          "flex items-center justify-between px-4 py-3 rounded-lg text-sm font-semibold transition-colors",
                          active
                            ? "bg-emerald-950/70 text-emerald-400"
                            : "text-zinc-300 hover:bg-white/5 hover:text-white"
                        )}
                      >
                        <span>{item.label}</span>
                        <ChevronRight className="w-4 h-4 opacity-70" />
                      </Link>
                    );
                  })}
                  {user && (
                    <Link
                      href="/profile"
                      onClick={closeAllMenus}
                      className="flex items-center justify-between px-4 py-3 rounded-lg text-sm font-semibold text-zinc-300 hover:bg-white/5 hover:text-white"
                    >
                      <span>Profile</span>
                      <ChevronRight className="w-4 h-4 opacity-70" />
                    </Link>
                  )}
                  {user?.role === "admin" && (
                    <Link
                      href="/admin"
                      onClick={closeAllMenus}
                      className="flex items-center justify-between px-4 py-3 rounded-lg text-sm font-semibold text-emerald-400 hover:bg-emerald-500/10"
                    >
                      <span>Admin Dashboard</span>
                      <ChevronRight className="w-4 h-4 opacity-70" />
                    </Link>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-white/10">
                {!user ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      openAuthModal("signin");
                    }}
                    className="w-full py-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs tracking-wider uppercase cursor-pointer"
                  >
                    SIGN IN NOW
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      await logout();
                      setMobileOpen(false);
                      router.refresh();
                    }}
                    className="w-full py-3 rounded-lg bg-zinc-900 border border-white/10 text-red-400 font-bold text-xs tracking-wider uppercase cursor-pointer"
                  >
                    SIGN OUT ({user.username})
                  </button>
                )}
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
