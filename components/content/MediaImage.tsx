"use client";

import { useState } from "react";
import { Film } from "lucide-react";
import { cn } from "@/lib/utils";

interface MediaImageProps {
  src: string;
  alt: string;
  className?: string;
  eager?: boolean;
  aspect?: "poster" | "backdrop";
}

export function MediaImage({
  src,
  alt,
  className,
  eager = false,
  aspect = "poster",
}: MediaImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        className={cn(
          "w-full h-full bg-gradient-to-br from-zinc-900 via-zinc-950 to-emerald-950/30 flex flex-col items-center justify-center p-4 text-center border border-white/5",
          className
        )}
      >
        <Film className={cn("text-emerald-500/50 mb-2", aspect === "backdrop" ? "w-12 h-12" : "w-8 h-8")} />
        <span className="text-xs font-bold text-zinc-400 line-clamp-2">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailed(true)}
      className={cn("w-full h-full object-cover", className)}
    />
  );
}
