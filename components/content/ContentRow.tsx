"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ContentItem } from "@/types";
import { ContentCard } from "./ContentCard";

interface ContentRowProps {
  title: string;
  items: ContentItem[];
  viewAllHref?: string;
}

export function ContentRow({ title, items, viewAllHref }: ContentRowProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  if (items.length === 0) return null;

  const scrollByAmount = (dir: -1 | 1) => {
    trackRef.current?.scrollBy({ left: dir * 720, behavior: "smooth" });
  };

  return (
    <section className="relative group/row mb-8 md:mb-12">
      <div className="px-4 md:px-12 flex items-center justify-between mb-4">
        <h3 className="text-base md:text-2xl font-black tracking-tighter uppercase text-white/90 line-clamp-1 flex-1 mr-4">
          {title}
        </h3>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="text-[11px] md:text-xs font-black tracking-wider uppercase text-emerald-500 hover:text-emerald-400 inline-flex items-center gap-1 shrink-0"
          >
            VIEW ALL
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => scrollByAmount(-1)}
          aria-label={`Scroll ${title} left`}
          className="hidden md:flex opacity-0 group-hover/row:opacity-100 transition-opacity absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/80 border border-white/15 items-center justify-center text-white hover:border-emerald-500 cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div
          ref={trackRef}
          className="px-4 md:px-12 flex items-start gap-3.5 md:gap-4 overflow-x-auto no-scrollbar"
        >
          {items.map((item) => (
            <ContentCard key={item.id} item={item} />
          ))}
        </div>

        <button
          type="button"
          onClick={() => scrollByAmount(1)}
          aria-label={`Scroll ${title} right`}
          className="hidden md:flex opacity-0 group-hover/row:opacity-100 transition-opacity absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/80 border border-white/15 items-center justify-center text-white hover:border-emerald-500 cursor-pointer"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </section>
  );
}

