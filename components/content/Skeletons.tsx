import React from "react";

export function GridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="aspect-[2/3] rounded-lg bg-zinc-900/80 border border-white/5 animate-pulse"
        />
      ))}
    </div>
  );
}

export function RowSkeleton() {
  return (
    <div className="px-4 md:px-12 mb-10 space-y-4">
      <div className="h-6 w-48 rounded bg-zinc-900 animate-pulse" />
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="shrink-0 w-[155px] sm:w-[180px] md:w-[200px] aspect-[2/3] rounded-lg bg-zinc-900/80 animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="min-h-screen pt-24 px-4 md:px-12 max-w-[1440px] mx-auto space-y-8">
      <div className="h-[45vh] rounded-2xl bg-zinc-900/80 animate-pulse" />
      <div className="h-16 rounded-xl bg-zinc-900/70 animate-pulse" />
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-[2/3] rounded-lg bg-zinc-900/70 animate-pulse" />
        ))}
      </div>
    </div>
  );
}

