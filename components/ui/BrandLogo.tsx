"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  compact?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function BrandLogo({ compact = false, className, size = "md" }: BrandLogoProps) {
  const sizeClass =
    size === "lg"
      ? "text-xl md:text-2xl"
      : size === "sm"
      ? "text-lg"
      : "text-xl md:text-2xl";

  return (
    <Link
      href="/"
      className={cn(
        "font-black tracking-tighter uppercase inline-flex items-center gap-1 select-none",
        sizeClass,
        className
      )}
    >
      <span className="text-emerald-500">RONIN</span>
      <span className="text-white">X</span>
      {!compact && <span className="text-emerald-500">STREAM</span>}
    </Link>
  );
}

