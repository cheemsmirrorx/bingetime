"use client";

import Link from "next/link";
import { Send } from "lucide-react";

export function Footer() {
  return (
    <footer className="px-6 md:px-12 py-10 border-t border-white/5 bg-black/60 backdrop-blur-md mt-16">
      <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="text-lg md:text-xl font-black tracking-tighter uppercase drop-shadow-[0_0_10px_rgba(16,185,129,0.25)]">
            <span className="text-emerald-500">RONIN</span>{" "}
            <span className="text-white">X</span>{" "}
            <span className="text-emerald-500">STREAM</span>
          </div>
          <p className="text-xs font-semibold text-zinc-200">
            © 2026 RONIN X STREAM. All rights reserved.
          </p>
          <p className="text-[11px] text-zinc-500 max-w-xl">
            Only authorized, licensed, and owner-provided streams are served through this platform.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-5 md:gap-6 text-xs text-zinc-400">
          <Link href="/privacy-policy" className="hover:text-white transition-colors">
            Privacy Policy
          </Link>
          <Link href="/dmca" className="hover:text-white transition-colors">
            DMCA
          </Link>
          <Link href="/credits" className="hover:text-white transition-colors">
            Credits
          </Link>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("ronin:open-telegram"))}
            className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-4 py-2 rounded-full inline-flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            Join Telegram
          </button>
        </div>
      </div>
    </footer>
  );
}

