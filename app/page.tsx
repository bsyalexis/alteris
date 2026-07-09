import Link from "next/link";
import diffJson from "@/data/diff.json";
import versionJson from "@/data/version.json";
import type { PatchDiff } from "@/lib/data/patch";

const diff = diffJson as unknown as PatchDiff;
const gameVersion = (versionJson as { version: string }).version;

const SECTIONS = [
  {
    href: "/simulateur",
    emoji: "⚔️",
    title: "Simulateur de build",
    text: "Compose ton équipement, vois tes stats en temps réel, compare deux builds, génère un build par caractéristiques, partage en un lien.",
  },
  {
    href: "/patchs",
    emoji: "📋",
    title: "Impact des patchs",
    text: `${diff.from.v} → ${diff.to.v} · ${diff.summary.added} nouveaux items. Ce qui monte, ce qui baisse, et si ton build tient toujours.`,
  },
  {
    href: "/farm",
    emoji: "🗺️",
    title: "Routes de farm",
    text: "Où XP selon ton élément, où trouver chaque famille de monstres, pistes kamas par palier.",
  },
];

export default function HomePage() {
  return (
    <div className="py-10">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold">
          ALTÉRIS<span className="text-[var(--lime-bright)]">.</span>
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-[var(--muted)]">
          L&apos;outil Dofus qui aide à décider : qu&apos;est-ce que je gagne,
          qu&apos;est-ce que je perds, et est-ce que ça vaut encore le coup après le patch.
        </p>
        <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--panel2)] px-3 py-1 text-xs text-[var(--muted)]">
          <span className="h-2 w-2 rounded-full bg-[var(--lime)]" />
          Dofus <b className="text-white">{gameVersion}</b> · mis à jour quotidiennement
        </p>
      </div>

      <div className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-3">
        {SECTIONS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="panel p-5 transition-transform hover:-translate-y-1 hover:border-[var(--lime)]"
          >
            <div className="text-2xl">{s.emoji}</div>
            <div className="mt-2 font-extrabold">{s.title}</div>
            <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--muted)]">{s.text}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
