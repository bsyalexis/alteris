import type { Metadata } from "next";
import Link from "next/link";
import { NavTabs } from "@/components/NavTabs";
import "./globals.css";

export const metadata: Metadata = {
  title: "Altéris — Outil pour Dofus",
  description:
    "Compose ton build Dofus, vois tes stats en temps réel, compare et partage. Impact des patchs, routes de farm.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body className="min-h-screen antialiased">
        <nav className="nav">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3.5 px-4 py-2.5">
            <Link href="/" className="brand">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/alteris-icon.svg" alt="" width={20} height={20} />
              Altéris
            </Link>
            <NavTabs />
          </div>
        </nav>
        <main className="mx-auto max-w-5xl px-4 pb-16 pt-6">{children}</main>
        <footer className="mx-auto max-w-5xl px-4 pb-8 text-center text-xs text-[var(--muted)]">
          Données : dofusdude & DofusDB (APIs communautaires, non affiliées à Ankama) · Dofus™ Ankama.
        </footer>
      </body>
    </html>
  );
}
