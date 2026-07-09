import type { Metadata } from "next";
import { FarmExplorer } from "@/components/farm/FarmExplorer";

export const metadata: Metadata = {
  title: "Routes de farm — Altéris",
  description:
    "Où farmer dans Dofus : zones XP par élément, familles de monstres, pistes kamas par palier de niveau.",
};

export default function FarmPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-4 text-2xl font-extrabold">
        Routes de <span className="text-[var(--lime-bright)]">farm</span>
      </h1>
      <FarmExplorer />
    </div>
  );
}
