"use client";

import React from "react";
import { Check } from "lucide-react";
import { PLATFORM_LIST } from "@/database/seed-data";
import { PlatformLogo } from "@/components/ui/PlatformLogos";
import { cn } from "@/lib/utils";

interface PlatformStripProps {
  selectedPlatform: string | null;
  onSelectPlatform: (platform: string | null) => void;
}

export function PlatformStrip({ selectedPlatform, onSelectPlatform }: PlatformStripProps) {
  return (
    <div className="px-4 md:px-12 mb-8 md:mb-12">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[10px] md:text-sm font-black tracking-[0.2em] md:tracking-[0.3em] text-gray-500 uppercase">
          BROWSE BY PLATFORM
        </h2>
        {selectedPlatform && (
          <button
            type="button"
            onClick={() => onSelectPlatform(null)}
            className="text-xs font-bold text-emerald-500 hover:text-emerald-400 cursor-pointer"
          >
            Clear Filter
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 md:gap-4 overflow-x-auto no-scrollbar pb-2">
        {PLATFORM_LIST.map((p) => {
          const active = selectedPlatform === p.name;
          return (
            <button
              key={p.slug}
              type="button"
              onClick={() => onSelectPlatform(active ? null : p.name)}
              aria-label={`Filter by ${p.name}`}
              aria-pressed={active}
              className={cn(
                "relative shrink-0 w-20 h-20 md:w-32 md:h-32 rounded-lg flex items-center justify-center p-3 md:p-4 transition-all border cursor-pointer",
                active
                  ? "bg-emerald-950/25 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                  : "bg-zinc-900/50 border-white/5 hover:border-white/20 hover:bg-zinc-800/50"
              )}
            >
              {active && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow">
                  <Check className="w-3 h-3 stroke-[3]" />
                </span>
              )}
              <PlatformLogo name={p.name} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

