import type { Metadata } from "next";
import { LegalPageShell } from "@/components/layout/LegalPageShell";

export const metadata: Metadata = {
  title: "Credits & Attributions | RONIN X STREAM",
  description: "Metadata API attributions, open-source licenses, and sample CC0 media credits.",
};

export default function CreditsPage() {
  return (
    <LegalPageShell
      badge="Attributions"
      title="Credits & Open Licenses"
      updatedAt="November 2026"
    >
      <section className="space-y-2">
        <h2 className="text-base font-bold text-white">TMDB Metadata &amp; Artwork</h2>
        <p>
          Title synopses, poster imagery, backdrop photography, and cast metadata are sourced via The
          Movie Database (TMDB) API. This product uses the TMDB API but is not endorsed or certified
          by TMDB.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-white">Authorized Sample Streams</h2>
        <p>
          Built-in sample playback streams utilize open-licensed and Creative Commons media files,
          including the Blender Foundation&apos;s <span className="text-white font-semibold">Sintel</span>{" "}
          and <span className="text-white font-semibold">Big Buck Bunny</span> test streams hosted by
          W3C and MDN Web Docs.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-white">Platform Technology Stack</h2>
        <p>
          Built with Next.js App Router, React, TypeScript, Tailwind CSS, Framer Motion, Lucide
          Icons, and Supabase Auth, PostgreSQL, and Storage.
        </p>
      </section>
    </LegalPageShell>
  );
}

