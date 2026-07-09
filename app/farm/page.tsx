import type { Metadata } from "next";
import { FarmExplorer } from "@/components/farm/FarmExplorer";

export const metadata: Metadata = {
  title: "Routes de farm — Altéris",
  description:
    "Où farmer dans Dofus : zones XP par élément, familles de monstres, pistes kamas par palier de niveau.",
};

export default function FarmPage() {
  return (
    <div className="view-anim">
      <header>
        <h1>
          Routes de <span className="accent">farm</span>
        </h1>
        <p className="tagline">
          Choisis ta voie élémentaire et ton palier : voici les zones où les monstres
          résistent le moins à ton élément — donc où tu tapes le plus fort et farm le plus
          vite.
        </p>
      </header>
      <FarmExplorer />
    </div>
  );
}
