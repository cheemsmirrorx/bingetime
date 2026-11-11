"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Info, Play, Star } from "lucide-react";
import type { ContentItem } from "@/types";
import { MediaImage } from "./MediaImage";

interface HeroCarouselProps {
  items: ContentItem[];
}

export function HeroCarousel({ items }: HeroCarouselProps) {
  const slides = items.slice(0, 7);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (slides.length <= 1 || paused) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [slides.length, paused]);

  if (slides.length === 0) return null;
  const safeIndex = index % slides.length;
  const active = slides[safeIndex] ?? slides[0];
  const basePath = active.content_type === "series" ? "/tv-shows" : "/movie";

  return (
    <section
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="relative h-[78vh] md:h-[85vh] w-full overflow-hidden bg-black"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={active.id}
          initial={{ opacity: 0.35, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0.35 }}
          transition={{ duration: 0.55 }}
          className="absolute inset-0"
        >
          <MediaImage
            src={active.backdrop || active.poster}
            alt={active.title}
            eager
            aspect="backdrop"
            className="w-full h-full object-cover object-center"
          />
        </motion.div>
      </AnimatePresence>

      {/* Directional Vignette Gradients matching reference */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-black/55 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-black/25 to-black/40" />

      {/* Left Content Overlay */}
      <div className="relative z-10 h-full max-w-[1440px] mx-auto px-4 md:px-12 flex flex-col justify-end pb-16 md:pb-24">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="bg-emerald-500 text-black text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded">
              {active.featured_badge ||
                (active.content_type === "series" ? "FEATURED SERIES" : "FEATURED MOVIE")}
            </span>

            {active.badge_text && (
              <span className="bg-white text-black text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded">
                {active.badge_text}
              </span>
            )}

            <span className="inline-flex items-center gap-1 text-emerald-400 font-bold text-xs md:text-sm ml-1">
              <Star className="w-3.5 h-3.5 fill-emerald-500 text-emerald-500" />
              {active.rating.toFixed(1)}
            </span>
          </div>

          <h2 className="text-2xl sm:text-4xl md:text-6xl font-black tracking-tight mb-2 md:mb-3 leading-tight text-white drop-shadow-2xl">
            {active.title}
          </h2>

          <p className="text-xs sm:text-sm md:text-base text-gray-300 line-clamp-3 mb-5 md:mb-6 leading-relaxed max-w-xl">
            {active.description}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`${basePath}/${active.slug}?autoplay=true`}
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs md:text-sm px-5 md:px-6 py-2.5 md:py-3 rounded-lg inline-flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
            >
              <Play className="w-4 h-4 fill-black" />
              Play Now
            </Link>
            <Link
              href={`${basePath}/${active.slug}`}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 text-white font-semibold text-xs md:text-sm px-5 md:px-6 py-2.5 md:py-3 rounded-lg inline-flex items-center gap-2 transition-all"
            >
              <Info className="w-4 h-4" />
              More Info
            </Link>
          </div>
        </div>
      </div>

      {/* Carousel Left/Right Controls */}
      {slides.length > 1 && (
        <>
          <div className="absolute right-4 md:right-10 bottom-16 md:bottom-24 z-20 flex items-center gap-2">
            <button
              type="button"
              aria-label="Previous featured slide"
              onClick={() => setIndex((prev) => (prev - 1 + slides.length) % slides.length)}
              className="w-10 h-10 md:w-11 md:h-11 rounded-lg bg-black/60 hover:bg-black/85 border border-white/15 flex items-center justify-center text-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              aria-label="Next featured slide"
              onClick={() => setIndex((prev) => (prev + 1) % slides.length)}
              className="w-10 h-10 md:w-11 md:h-11 rounded-lg bg-black/60 hover:bg-black/85 border border-white/15 flex items-center justify-center text-white transition-colors cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Bottom Centered Progress Dots */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
            {slides.map((slide, idx) => (
              <button
                key={slide.id}
                type="button"
                aria-label={`Show slide ${idx + 1}`}
                onClick={() => setIndex(idx)}
                className={
                  idx === index
                    ? "w-7 h-1.5 rounded-full bg-emerald-500 transition-all cursor-pointer"
                    : "w-1.5 h-1.5 rounded-full bg-white/30 hover:bg-white/60 transition-all cursor-pointer"
                }
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
