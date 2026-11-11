"use client";

import React from "react";
import { GENRE_LIST } from "@/database/seed-data";
import { cn } from "@/lib/utils";

interface GenreStripProps {
  selectedGenre: string | null;
  onSelectGenre: (genre: string | null) => void;
}

export function GenreStrip({ selectedGenre, onSelectGenre }: GenreStripProps) {
  return (
    <div className="px-4 md:px-12 mb-8 md:mb-12">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[10px] md:text-sm font-black tracking-[0.2em] md:tracking-[0.3em] text-gray-500 uppercase">
          BROWSE BY GENRE
        </h2>
        {selectedGenre && (
          <button
            type="button"
            onClick={() => onSelectGenre(null)}
            className="text-xs font-bold text-emerald-500 hover:text-emerald-400 cursor-pointer"
          >
            Clear Filter
          </button>
        )}
      </div>

      <div className="flex items-center gap-2.5 md:gap-3 overflow-x-auto no-scrollbar pb-1">
        {GENRE_LIST.map((genre) => {
          const active = selectedGenre === genre;
          return (
            <button
              key={genre}
              type="button"
              onClick={() => onSelectGenre(active ? null : genre)}
              aria-pressed={active}
              className={cn(
                "shrink-0 px-5 md:px-6 py-2.5 md:py-3 rounded-md md:rounded-lg flex items-center gap-2 transition-all border font-bold text-xs md:text-sm cursor-pointer",
                active
                  ? "bg-emerald-500 border-emerald-500 text-black shadow-lg shadow-emerald-500/20"
                  : "bg-zinc-900/50 border-white/5 text-gray-400 hover:border-white/20 hover:text-white"
              )}
            >
              <span className={active ? "text-black/70" : "text-gray-600"}>#</span>
              <span>{genre}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

