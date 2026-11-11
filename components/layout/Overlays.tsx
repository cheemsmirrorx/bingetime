"use client";

import React, { useEffect, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Info, Send, X } from "lucide-react";

const COOKIE_KEY = "ronin_cookie_consent";
const COOKIE_EVENT = "ronin:cookie-consent-change";

function subscribeCookieStore(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(COOKIE_EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(COOKIE_EVENT, cb);
  };
}

function getCookieOpenSnapshot(): boolean {
  try {
    return !localStorage.getItem(COOKIE_KEY);
  } catch {
    return false;
  }
}

export function SiteOverlays() {
  const cookieOpen = useSyncExternalStore(
    subscribeCookieStore,
    getCookieOpenSnapshot,
    () => false
  );
  const [cookieSettingsOpen, setCookieSettingsOpen] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [telegramOpen, setTelegramOpen] = useState(false);

  useEffect(() => {
    const onOpenTelegram = () => setTelegramOpen(true);
    window.addEventListener("ronin:open-telegram", onOpenTelegram);
    return () => window.removeEventListener("ronin:open-telegram", onOpenTelegram);
  }, []);

  function acceptCookies(all: boolean) {
    try {
      localStorage.setItem(
        COOKIE_KEY,
        JSON.stringify({ essential: true, analytics: all ? true : analyticsEnabled })
      );
      window.dispatchEvent(new Event(COOKIE_EVENT));
    } catch {
      // ignore
    }
    setCookieSettingsOpen(false);
  }

  return (
    <>
      {/* Bottom-right Cookie Policy Toast */}
      <AnimatePresence>
        {cookieOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:w-[400px] bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 rounded-lg p-6 z-[150] shadow-2xl"
          >
            <button
              type="button"
              onClick={() => acceptCookies(false)}
              aria-label="Dismiss cookie notice"
              className="absolute top-3.5 right-3.5 text-zinc-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-md bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <Info className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <h4 className="text-xs font-black tracking-wider uppercase text-white mb-1.5">
                  COOKIE POLICY
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  We use cookies to enhance your streaming experience, remember your preferences, and
                  keep your playback progress synced.
                </p>

                {cookieSettingsOpen && (
                  <div className="mt-3 pt-3 border-t border-white/10 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-zinc-300">
                      <span>Essential Auth & Preferences</span>
                      <span className="text-emerald-500 font-bold">Always On</span>
                    </div>
                    <label className="flex items-center justify-between text-zinc-300 cursor-pointer">
                      <span>Playback & Discovery Analytics</span>
                      <input
                        type="checkbox"
                        checked={analyticsEnabled}
                        onChange={(e) => setAnalyticsEnabled(e.target.checked)}
                        className="accent-emerald-500"
                      />
                    </label>
                  </div>
                )}

                <div className="mt-4 flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => acceptCookies(true)}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-[11px] uppercase tracking-wider py-2 px-4 rounded transition-colors cursor-pointer"
                  >
                    ACCEPT ALL
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      cookieSettingsOpen ? acceptCookies(false) : setCookieSettingsOpen(true)
                    }
                    className="flex-1 bg-white/10 hover:bg-white/15 border border-white/10 text-white font-black text-[11px] uppercase tracking-wider py-2 px-4 rounded transition-colors cursor-pointer"
                  >
                    {cookieSettingsOpen ? "SAVE" : "SETTINGS"}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Telegram Community Modal */}
      <AnimatePresence>
        {telegramOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setTelegramOpen(false)}
            className="fixed inset-0 z-[190] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-[420px] rounded-2xl bg-[#111113] border border-white/10 p-8 text-center shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setTelegramOpen(false)}
                aria-label="Close Telegram dialog"
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.45)] mb-5">
                <Send className="w-7 h-7" />
              </div>

              <h3 className="text-2xl font-black tracking-tight text-white mb-2 uppercase">
                JOIN OUR TELEGRAM!
              </h3>
              <p className="text-xs md:text-sm text-zinc-400 mb-6">
                Get instant release updates, new season alerts, and be part of the RONIN X STREAM
                community.
              </p>

              <a
                href="https://t.me/roninxstream"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setTelegramOpen(false)}
                className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-colors"
              >
                <Send className="w-4 h-4" />
                JOIN CHANNEL NOW
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
