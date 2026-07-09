import type { Metadata } from "next";
import Link from "next/link";
import versionJson from "@/data/version.json";
import { BrandIcon } from "@/components/BrandIcon";
import { NavTabs } from "@/components/NavTabs";
import "./globals.css";

export const metadata: Metadata = {
  title: "Altéris — Outil pour Dofus",
  description:
    "Impact des patchs Dofus item par item, simulateur de build avec panoplies, routes de farm par élément.",
};

const gameVersion = (versionJson as { version: string }).version;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const builtAt = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  }).format(new Date());

  return (
    <html lang="fr">
      <body>
        <div className="ambient">
          <span></span>
          <span></span>
          <span></span>
          <i className="leaf"></i>
          <i className="leaf"></i>
          <i className="leaf"></i>
          <i className="leaf"></i>
          <i className="leaf"></i>
          <i className="leaf"></i>
        </div>
        <div className="nav">
          <div className="navin">
            <Link href="/" className="brand">
              <BrandIcon />
              Altéris
            </Link>
            <NavTabs />
          </div>
        </div>
        <div className="wrap">
          {children}
          <div className="lastupdate">
            <span className="dot"></span>Dernière mise à jour : <b>{builtAt}</b> (heure de
            Paris) · données Dofus <b>{gameVersion}</b>
          </div>
        </div>
      </body>
    </html>
  );
}
