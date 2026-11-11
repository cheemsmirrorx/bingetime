"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Lock, ShieldAlert } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function AdminLoginGate({ unauthorized }: { unauthorized?: boolean }) {
  const router = useRouter();
  const { setUserDirect } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (unauthorized) {
    return (
      <div className="min-h-[80vh] pt-28 pb-16 px-4 flex items-center justify-center">
        <div className="max-w-md w-full rounded-2xl bg-[#141414] border border-red-500/20 p-10 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <p className="text-xs font-black font-mono uppercase tracking-widest text-red-400">
            403 • Forbidden
          </p>
          <h1 className="text-2xl font-black uppercase tracking-tight text-white">
            Admin Access Required
          </h1>
          <p className="text-xs md:text-sm text-zinc-400">
            Your current account does not hold administrator privileges. All admin endpoints
            enforce role checks on the server.
          </p>
          <Link
            href="/"
            className="inline-flex px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs uppercase tracking-wider"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, rememberMe: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Invalid credentials");
      }
      setUserDirect(data.user);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] pt-28 pb-16 px-4 flex items-center justify-center">
      <div className="max-w-md w-full rounded-2xl bg-[#141414] border border-white/10 p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight text-white">
              Admin Sign In
            </h1>
            <p className="text-xs text-zinc-400">
              Restricted catalog, media, and user console
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/30 px-3.5 py-2.5 text-xs text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
              Administrator Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@roninxstream.local"
              className="w-full h-11 px-3.5 rounded-lg bg-black/60 border border-white/10 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full h-11 px-3.5 rounded-lg bg-black/60 border border-white/10 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs uppercase tracking-wider inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Verifying..." : "Sign In to Admin"}
          </button>
        </form>
      </div>
    </div>
  );
}

