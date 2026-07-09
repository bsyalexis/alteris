import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Altéris — Simulateur de build Dofus",
  description:
    "Compose ton build Dofus, vois tes stats en temps réel, compare et partage. Impact des patchs sur tes builds.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body className="min-h-screen antialiased">
        <header className="border-b border-[var(--line)] bg-[var(--panel2)]">
          <nav className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
            <Link
              href="/"
              className="rounded-lg border-2 border-[var(--lime)] bg-[var(--panel)] px-3 py-1 text-sm font-extrabold tracking-wide"
            >
              ALTÉRIS
            </Link>
            <Link
              href="/patchs"
              className="text-sm font-semibold text-[var(--muted)] transition-colors hover:text-[var(--lime-bright)]"
            >
              Patchs
            </Link>
            <Link
              href="/simulateur"
              className="text-sm font-semibold text-[var(--muted)] transition-colors hover:text-[var(--lime-bright)]"
            >
              Simulateur
            </Link>
            <Link
              href="/farm"
              className="text-sm font-semibold text-[var(--muted)] transition-colors hover:text-[var(--lime-bright)]"
            >
              Routes de farm
            </Link>
          </nav>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
