"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import type { ContentItem } from "@/types";
import { MediaImage } from "./MediaImage";

export function Top10Row({ items }: { items: ContentItem[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  if (items.length === 0) return null;

  const scrollByAmount = (dir: -1 | 1) => {
    trackRef.current?.scrollBy({ left: dir * 640, behavior: "smooth" });
  };

  return (
    <section className="relative group/row mb-8 md:mb-12">
      <div className="px-4 md:px-12 flex items-center justify-between mb-4">
        <h3 className="border-l-4 border-emerald-500 pl-3 text-base md:text-2xl font-black tracking-tighter uppercase text-white/90">
          TOP 10 THIS WEEK
        </h3>
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => scrollByAmount(-1)}
          aria-label="Scroll Top 10 left"
          className="hidden md:flex opacity-0 group-hover/row:opacity-100 transition-opacity absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/80 border border-white/15 items-center justify-center text-white hover:border-emerald-500 cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div
          ref={trackRef}
          className="px-4 md:px-12 flex items-end gap-5 md:gap-7 overflow-x-auto no-scrollbar pb-2"
        >
          {items.slice(0, 10).map((item, idx) => {
            const href =
              item.content_type === "series" ? `/tv-shows/${item.slug}` : `/movie/${item.slug}`;
            return (
              <Link
                key={item.id}
                href={href}
                className="group relative shrink-0 flex items-end pl-10 md:pl-14"
              >
                <span className="top10-numeral text-[125px] md:text-[165px] leading-none absolute left-0 bottom-0 z-0 pointer-events-none">
                  {idx + 1}
                </span>

                <div className="relative z-10 w-[160px] md:w-[198px] aspect-[2/3] rounded-lg overflow-hidden bg-zinc-900 border border-white/10 group-hover:border-emerald-500/60 transition-all">
                  <MediaImage
                    src={item.poster}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black via-black/80 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <span className="inline-flex items-center gap-1 bg-emerald-500 text-black text-[10px] font-black px-2 py-0.5 rounded mb-1.5">
                      <Star className="w-2.5 h-2.5 fill-black text-black" />
                      {item.rating.toFixed(1)}
                    </span>
                    <h4 className="text-xs md:text-sm font-bold text-white line-clamp-1">
                      {item.title}
                    </h4>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => scrollByAmount(1)}
          aria-label="Scroll Top 10 right"
          className="hidden md:flex opacity-0 group-hover/row:opacity-100 transition-opacity absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/80 border border-white/15 items-center justify-center text-white hover:border-emerald-500 cursor-pointer"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </section>
  );
}

