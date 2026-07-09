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
    text: "Assemble ton stuff, bonus de panoplie inclus. Compare deux builds, génère un build par caractéristiques, partage en un lien.",
  },
  {
    href: "/patchs",
    emoji: "📋",
    title: "Impact des patchs",
    text: `${diff.summary.added} nouveaux items entre ${diff.from.v} et ${diff.to.v}. Ce qui monte, ce qui baisse, et si ton build tient toujours.`,
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
    <div className="py-6 text-center">
      <h1 className="text-[38px]">
        Altéris<span className="accent">.</span>
      </h1>
      <p className="mx-auto mt-2 max-w-[620px] text-[15px] leading-relaxed text-[var(--muted)]">
        Le seul outil Dofus qui suit le temps : qu&apos;est-ce que je gagne, qu&apos;est-ce
        que je perds, et est-ce que ça vaut encore le coup après le patch.
      </p>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        <div className="pill">
          {diff.from.v}
          <small>{diff.from.r} (live)</small>
        </div>
        <span className="text-[22px] font-extrabold text-[var(--lime-bright)]">➜</span>
        <div className="pill beta">
          {diff.to.v}
          <small>{diff.to.r}</small>
        </div>
      </div>

      <Link href="/simulateur" className="cta mt-5">
        ⚔️ Ouvrir le simulateur →
      </Link>

      <p className="mt-4 text-xs text-[var(--muted)]">
        Dofus <b className="text-white">{gameVersion}</b> · données mises à jour
        quotidiennement
      </p>

      <div className="mx-auto mt-10 grid max-w-4xl gap-3 text-left sm:grid-cols-3">
        {SECTIONS.map((s) => (
          <Link key={s.href} href={s.href} className="panel card-hover p-5">
            <div className="text-2xl">{s.emoji}</div>
            <div className="font-title mt-2 text-[17px]">{s.title}</div>
            <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--muted)]">{s.text}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
