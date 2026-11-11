import Link from "next/link";
import { Film, Home, Search } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-[80vh] pt-24 pb-16 px-4 flex items-center justify-center">
      <div className="max-w-md w-full rounded-2xl bg-[#141414] border border-white/10 p-10 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
          <Film className="w-7 h-7" />
        </div>
        <p className="text-xs font-black font-mono uppercase tracking-widest text-emerald-500">
          404 • Not Found
        </p>
        <h1 className="text-2xl font-black uppercase tracking-tight text-white">
          Title Or Page Missing
        </h1>
        <p className="text-xs md:text-sm text-zinc-400">
          The page or catalog item you requested is unavailable or has been moved.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs uppercase tracking-wider inline-flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            Home
          </Link>
          <Link
            href="/search"
            className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs uppercase tracking-wider inline-flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            Search Catalog
          </Link>
        </div>
      </div>
    </div>
  );
}

