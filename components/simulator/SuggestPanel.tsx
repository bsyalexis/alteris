"use client";

import { useState } from "react";
import { FILTERABLE_STATS, suggestBuild } from "@/lib/engine";
import type { GameDataIndex, SuggestTargets } from "@/lib/engine";
import { useBuildStore } from "@/lib/store/buildStore";

/** Poids par priorité : la stat n°1 compte 3x plus que la n°3 */
const PRIORITY_WEIGHTS = [3, 2, 1] as const;

export function SuggestPanel({
  index,
  onSuggested,
}: {
  index: GameDataIndex;
  onSuggested: (message: string) => void;
}) {
  const level = useBuildStore((s) => s.level);
  const load = useBuildStore((s) => s.load);
  const refItems = useBuildStore((s) => s.refItems);

  const [open, setOpen] = useState(false);
  const [picks, setPicks] = useState<string[]>(["Vitalité", "", ""]);
  const [busy, setBusy] = useState(false);

  const setPick = (i: number, value: string) =>
    setPicks((prev) => prev.map((p, j) => (j === i ? value : p)));

  const run = () => {
    const targets: SuggestTargets = {};
    picks.forEach((stat, i) => {
      if (stat) targets[stat] = Math.max(targets[stat] ?? 0, PRIORITY_WEIGHTS[i]);
    });
    if (!Object.keys(targets).length) {
      onSuggested("Choisis au moins une caractéristique");
      return;
    }
    setBusy(true);
    // laisse le temps au bouton de se rendre avant le calcul (sync)
    setTimeout(() => {
      const build = suggestBuild(index, { level, targets });
      load(build, level, refItems);
      setBusy(false);
      onSuggested(
        Object.keys(build).length
          ? `Build suggéré : ${Object.keys(build).length} items (niv ≤ ${level})`
          : "Aucun item ne correspond à ces critères",
      );
    }, 30);
  };

  return (
    <section className="panel p-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="text-sm font-extrabold">
          ⚙ Suggérer un build{" "}
          <span className="font-normal text-[var(--muted)]">
            — niveau {level}, par caractéristiques
          </span>
        </span>
        <span className="text-[var(--muted)]">{open ? "▾" : "▸"}</span>
      </button>

      {open && (
        <div className="mt-3 flex flex-wrap items-end gap-3">
          {picks.map((pick, i) => (
            <label key={i} className="text-xs text-[var(--muted)]">
              Priorité {i + 1}
              {i > 0 && " (optionnel)"}
              <select
                value={pick}
                onChange={(e) => setPick(i, e.target.value)}
                className="mt-1 block w-44 rounded-lg border border-[var(--line)] bg-[var(--panel2)] px-2 py-2 text-sm text-white"
              >
                <option value="">—</option>
                {FILTERABLE_STATS.map((stat) => (
                  <option key={stat} value={stat} disabled={picks.includes(stat) && pick !== stat}>
                    {stat}
                  </option>
                ))}
              </select>
            </label>
          ))}
          <button type="button" className="btn" onClick={run} disabled={busy}>
            {busy ? "Calcul…" : "⚡ Générer"}
          </button>
          <span className="basis-full text-[11px] text-[var(--muted)]">
            Remplace le build courant. Panoplies prises en compte · PA plafonnés à 12 et
            PM à 6 (base incluse) · à stats visées égales, maximise PA, PM puis Vitalité.
            Fige d&apos;abord une référence si tu veux comparer avant/après.
          </span>
        </div>
      )}
    </section>
  );
}
