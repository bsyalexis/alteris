"use client";

import { useEffect, useState } from "react";
import { FILTERABLE_STATS, suggestBuild } from "@/lib/engine";
import type { GameDataIndex, SuggestTargets } from "@/lib/engine";
import { useBuildStore } from "@/lib/store/buildStore";

/** Poids par priorité : la stat n°1 compte 3x plus que la n°3 */
const PRIORITY_WEIGHTS = [3, 2, 1] as const;

/** Suggesteur de build en modal (style .modbox du site d'origine) */
export function SuggestModal({
  index,
  onClose,
  onSuggested,
}: {
  index: GameDataIndex;
  onClose: () => void;
  onSuggested: (message: string) => void;
}) {
  const level = useBuildStore((s) => s.level);
  const load = useBuildStore((s) => s.load);
  const refItems = useBuildStore((s) => s.refItems);

  const [picks, setPicks] = useState<string[]>(["Vitalité", "", ""]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

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
    setTimeout(() => {
      const build = suggestBuild(index, { level, targets });
      load(build, level, refItems);
      setBusy(false);
      onClose();
      onSuggested(
        Object.keys(build).length
          ? `Build suggéré : ${Object.keys(build).length} items (niv ≤ ${level})`
          : "Aucun item ne correspond à ces critères",
      );
    }, 30);
  };

  return (
    <div className="modal open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modbox">
        <div className="hd">
          <h4>⚙ Suggérer un build — niveau {level}</h4>
          <button type="button" className="close" onClick={onClose}>
            ✕ Fermer
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {picks.map((pick, i) => (
            <label key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                style={{
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  color: "var(--muted)",
                  fontWeight: 700,
                  width: 110,
                  flexShrink: 0,
                }}
              >
                Priorité {i + 1}
                {i > 0 ? " (opt.)" : ""}
              </span>
              <select
                className="fsel"
                style={{ flex: 1 }}
                value={pick}
                onChange={(e) => setPick(i, e.target.value)}
              >
                <option value="">—</option>
                {FILTERABLE_STATS.map((stat) => (
                  <option
                    key={stat}
                    value={stat}
                    disabled={picks.includes(stat) && pick !== stat}
                  >
                    {stat}
                  </option>
                ))}
              </select>
            </label>
          ))}
          <button type="button" className="cta" onClick={run} disabled={busy}>
            {busy ? "Calcul…" : "⚡ Générer le build"}
          </button>
          <div className="emptot" style={{ padding: "4px 0" }}>
            Remplace le build courant · panoplies prises en compte · PA plafonnés à 12, PM
            à 6 (base incluse) · à stats égales, maximise PA, PM puis Vitalité.
          </div>
        </div>
      </div>
    </div>
  );
}
