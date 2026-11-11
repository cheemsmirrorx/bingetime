"use client";

import React from "react";
import Link from "next/link";
import { Play, Star } from "lucide-react";
import type { ContentItem } from "@/types";
import { MediaImage } from "./MediaImage";
import { cn } from "@/lib/utils";

interface ContentCardProps {
  item: ContentItem;
  fluid?: boolean;
}

export function ContentCard({ item, fluid = false }: ContentCardProps) {
  const href = item.content_type === "series" ? `/tv-shows/${item.slug}` : `/movie/${item.slug}`;

  return (
    <Link
      href={href}
      className={cn(
        "group relative block rounded-lg overflow-hidden bg-zinc-900 border border-white/5 hover:border-emerald-500/50 transition-all duration-300 aspect-[2/3]",
        fluid ? "w-full" : "shrink-0 w-[155px] sm:w-[180px] md:w-[200px]"
      )}
    >
      <MediaImage
        src={item.poster}
        alt={item.title}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      />

      {/* Top Left Rating Badge */}
      <div className="absolute top-2.5 left-2.5 z-10 bg-emerald-500 text-black text-[10px] font-black px-2 py-0.5 rounded flex items-center gap-1 shadow">
        <Star className="w-2.5 h-2.5 fill-black text-black" />
        <span>{item.rating.toFixed(1)}</span>
      </div>

      {/* Top Right Status/Episode Badge */}
      {item.badge_text && (
        <div className="absolute top-2.5 right-2.5 z-10 bg-emerald-500 text-black text-[9px] md:text-[10px] font-black uppercase px-2 py-0.5 rounded shadow">
          {item.badge_text}
        </div>
      )}

      {/* Hover Overlay matching reference 05-card-hover.png */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/25 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-3">
        <div />
        <div className="flex items-center justify-center">
          <div className="w-11 h-11 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-lg shadow-emerald-500/30 transform scale-90 group-hover:scale-100 transition-transform">
            <Play className="w-5 h-5 fill-black ml-0.5" />
          </div>
        </div>
        <div>
          <h4 className="text-xs md:text-sm font-bold text-white line-clamp-2 leading-snug">
            {item.title}
          </h4>
          <p className="text-[10px] font-semibold text-zinc-400 uppercase mt-0.5">
            {item.release_year} • {item.content_type}
          </p>
        </div>
      </div>
    </Link>
  );
}

