import type { Metadata } from "next";
import { LegalPageShell } from "@/components/layout/LegalPageShell";

export const metadata: Metadata = {
  title: "DMCA & Authorized Media Policy | RONIN X STREAM",
  description: "RONIN X STREAM DMCA compliance and authorized distribution policy.",
};

export default function DmcaPage() {
  return (
    <LegalPageShell
      badge="Rights & Compliance"
      title="DMCA & Media Authorization"
      updatedAt="November 2026"
    >
      <section className="space-y-2">
        <h2 className="text-base font-bold text-white">Authorized Distribution Only</h2>
        <p>
          RONIN X STREAM operates strictly with licensed, public-domain, Creative Commons, or
          owner-authorized media streams stored in verified media sources or private storage
          buckets. We never scrape unauthorized third-party streaming providers or bypass DRM
          protections.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-white">Submitting a Takedown Notice</h2>
        <p>
          If you believe any metadata record, artwork asset, or authorized media URL listed in the
          catalog infringes your copyright under the Digital Millennium Copyright Act (DMCA), please
          submit a written notice specifying:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-zinc-400">
          <li>Identification of the copyrighted work claimed to have been infringed.</li>
          <li>The exact URL or catalog slug on RONIN X STREAM where the material is located.</li>
          <li>Your contact details including name, organization, and email address.</li>
          <li>A good-faith statement that the disputed use is not authorized by the rights holder.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-white">Review &amp; Removal</h2>
        <p>
          Verified notices are reviewed promptly by platform administrators through the protected
          admin catalog console, and flagged records or media sources are disabled immediately
          pending resolution.
        </p>
      </section>
    </LegalPageShell>
  );
}

