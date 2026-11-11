import type { Metadata } from "next";
import { LegalPageShell } from "@/components/layout/LegalPageShell";

export const metadata: Metadata = {
  title: "Privacy Policy | RONIN X STREAM",
  description: "How RONIN X STREAM handles user authentication, watchlist storage, and playback history.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPageShell
      badge="Legal Documentation"
      title="Privacy Policy"
      updatedAt="November 2026"
    >
      <section className="space-y-2">
        <h2 className="text-base font-bold text-white">1. Information We Collect</h2>
        <p>
          When you create an account on RONIN X STREAM, we collect your chosen username, email
          address, and securely hashed authentication credentials. We also store your saved
          watchlist items, community title requests, and playback progress timestamps so you can
          resume watching across sessions.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-white">2. How We Use Stored Data</h2>
        <p>
          Account data is used strictly to authenticate sessions, maintain personalized watchlists,
          preserve resume positions in the media player, and enforce role-based access control via
          server validation and Supabase Row Level Security policies.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-white">3. Cookies &amp; Local Preferences</h2>
        <p>
          Essential HttpOnly cookies are used for session authentication. Browser localStorage is
          used optionally to remember recent search queries for convenience.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-white">4. Account &amp; Data Control</h2>
        <p>
          You can update your profile username or avatar from the Profile page, add or remove saved
          titles in your Watchlist at any time, or contact platform administrators for full account
          deletion.
        </p>
      </section>
    </LegalPageShell>
  );
}

