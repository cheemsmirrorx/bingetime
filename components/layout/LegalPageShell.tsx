import React from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface LegalPageShellProps {
  badge: string;
  title: string;
  updatedAt: string;
  children: React.ReactNode;
}

export function LegalPageShell({
  badge,
  title,
  updatedAt,
  children,
}: LegalPageShellProps) {
  return (
    <div className="min-h-screen pt-24 pb-16 px-4 md:px-12 max-w-4xl mx-auto">
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-emerald-400 transition-colors mb-5"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Home
        </Link>
        <p className="text-[11px] font-black uppercase tracking-widest text-emerald-500 mb-2">
          {badge}
        </p>
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-white">
          {title}
        </h1>
        <p className="text-xs text-zinc-500 mt-2">Last updated: {updatedAt}</p>
      </div>

      <article className="rounded-2xl bg-[#141414] border border-white/10 p-6 md:p-8 space-y-6 text-sm text-zinc-300 leading-relaxed">
        {children}
      </article>
    </div>
  );
}

