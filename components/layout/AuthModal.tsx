"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function AuthModal() {
  const { authModalOpen, authMode, setAuthMode, closeAuthModal, setUserDirect } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  function handleClose() {
    setError(null);
    setInfoMsg(null);
    closeAuthModal();
  }

  function handleSwitchMode(mode: "signin" | "signup") {
    setError(null);
    setInfoMsg(null);
    setAuthMode(mode);
  }

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && authModalOpen) {
        setError(null);
        setInfoMsg(null);
        closeAuthModal();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [authModalOpen, closeAuthModal]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfoMsg(null);
    setSubmitting(true);

    try {
      const endpoint = authMode === "signin" ? "/api/auth/login" : "/api/auth/register";
      const payload =
        authMode === "signin"
          ? { email, password, rememberMe }
          : { username, email, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Authentication failed");
        return;
      }

      if (data.requiresEmailConfirmation) {
        setInfoMsg("Account created! Please check your email to confirm your address before signing in.");
        return;
      }

      setUserDirect(data.user);
      closeAuthModal();
      setPassword("");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      {authModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[180] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={handleClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-modal-title"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[440px] rounded-xl bg-[#121214] border border-white/10 border-t-2 border-t-emerald-500 p-7 md:p-8 shadow-2xl"
          >
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close modal"
              className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2
              id="auth-modal-title"
              className="text-2xl font-black tracking-tight uppercase text-white"
            >
              {authMode === "signin" ? "WELCOME BACK" : "JOIN THE RONIN"}
            </h2>
            <p className="text-xs md:text-sm text-zinc-400 mt-1 mb-6">
              {authMode === "signin"
                ? "Sign in to access your premium library."
                : "Create an account to start your cinematic journey."}
            </p>

            {error && (
              <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 px-3.5 py-2.5 text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {infoMsg && (
              <div className="mb-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-2.5 text-xs text-emerald-300">
                {infoMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {authMode === "signup" && (
                <div>
                  <label className="block text-[11px] font-bold tracking-wider uppercase text-zinc-400 mb-1.5">
                    USERNAME
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="ronin_member"
                    className="w-full rounded-lg bg-[#0a0a0a] border border-white/10 focus:border-emerald-500 outline-none px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 transition-colors"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold tracking-wider uppercase text-zinc-400 mb-1.5">
                  EMAIL ADDRESS
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg bg-[#0a0a0a] border border-white/10 focus:border-emerald-500 outline-none px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold tracking-wider uppercase text-zinc-400 mb-1.5">
                  PASSWORD
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg bg-[#0a0a0a] border border-white/10 focus:border-emerald-500 outline-none px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 transition-colors"
                />
              </div>

              {authMode === "signin" && (
                <label className="flex items-center gap-2.5 cursor-pointer select-none pt-1">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded accent-emerald-500 bg-white border-white/20"
                  />
                  <span className="text-[11px] font-semibold tracking-wider uppercase text-zinc-400">
                    REMEMBER ME
                  </span>
                </label>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-black font-bold text-sm py-3 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {authMode === "signin" ? "Sign In" : "Create Account"}
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-zinc-400">
              {authMode === "signin" ? (
                <>
                  New to Ronin?{" "}
                  <button
                    type="button"
                    onClick={() => handleSwitchMode("signup")}
                    className="text-emerald-500 hover:text-emerald-400 font-bold cursor-pointer"
                  >
                    Sign Up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => handleSwitchMode("signin")}
                    className="text-emerald-500 hover:text-emerald-400 font-bold cursor-pointer"
                  >
                    Sign In
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
