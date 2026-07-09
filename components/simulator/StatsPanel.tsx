"use client";

import { useMemo } from "react";
import {
  compareTotals,
  computeBuildStats,
  freeSlotFor,
  statCategory,
  statElement,
  statRank,
} from "@/lib/engine";
import type { GameDataIndex } from "@/lib/engine";
import { useBuildStore } from "@/lib/store/buildStore";

/** Couleurs d'origine : élément sinon couleur de catégorie */
const ELEMENT_VAR: Record<string, string> = {
  neutre: "var(--neutre)",
  terre: "var(--terre)",
  feu: "var(--feu)",
  eau: "var(--eau)",
  air: "var(--air)",
};
const CATEGORY_VAR: Record<string, string> = {
  prim: "var(--lime)",
  dmg: "var(--gold)",
  res: "var(--violet)",
};
const CATEGORIES = [
  ["prim", "Caractéristiques"],
  ["dmg", "Dommages"],
  ["res", "Résistances"],
] as const;

function statColor(name: string): string {
  const el = statElement(name);
  return el ? ELEMENT_VAR[el] : CATEGORY_VAR[statCategory(name)];
}

export function StatsPanel({
  index,
  equippedCount,
}: {
  index: GameDataIndex;
  equippedCount: number;
}) {
  const items = useBuildStore((s) => s.items);
  const refItems = useBuildStore((s) => s.refItems);
  const pinRef = useBuildStore((s) => s.pinRef);
  const clearRef = useBuildStore((s) => s.clearRef);
  const swapRef = useBuildStore((s) => s.swapRef);
  const equipInSlot = useBuildStore((s) => s.equipInSlot);

  const computed = useMemo(() => computeBuildStats(index, items), [index, items]);
  const refTotals = useMemo(
    () => (refItems ? computeBuildStats(index, refItems).totals : null),
    [index, refItems],
  );
  const deltas = useMemo(
    () => (refTotals ? compareTotals(refTotals, computed.totals) : null),
    [refTotals, computed],
  );

  const equippedIds = useMemo(() => new Set(Object.values(items)), [items]);
  const statNames = Object.keys(computed.contributions);

  return (
    <div className="panel" style={{ padding: 15, alignSelf: "start", position: "sticky", top: 74 }}>
      {/* Panoplies actives + membres (markup d'origine) */}
      {computed.activeSets.length > 0 && (
        <>
          <h3 className="pano">Panoplies</h3>
          {computed.activeSets.map((set) => {
            const members = index.bySet.get(set.setId) ?? [];
            return (
              <div key={set.setId} className="setcard">
                <div className="sn">◈ {set.name}</div>
                <div className="sc">
                  {set.count} / {set.total} pièces ·{" "}
                  {set.bonus.length ? "bonus actif" : "bonus à partir de 2 pièces"}
                </div>
                <div className="sb">
                  {set.bonus.length
                    ? set.bonus
                        .map(([stat, v]) => `${v > 0 ? "+" : ""}${v} ${stat}`)
                        .join(", ")
                    : "—"}
                </div>
                <div className="members">
                  {members.map((m) => {
                    const on = equippedIds.has(m.id);
                    const free = freeSlotFor(m.s, items);
                    return (
                      <div key={m.id} className={`mem ${on ? "on" : ""}`}>
                        {on && <span className="eqmark">✓</span>}
                        <span className="mn">{m.n}</span>
                        <span className="mslot">{m.s}</span>
                        {!on &&
                          (free ? (
                            <button
                              type="button"
                              className="add"
                              onClick={() => equipInSlot(free, m.id)}
                            >
                              + Ajouter
                            </button>
                          ) : (
                            <span className="full">slot occupé</span>
                          ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          <div className="divider"></div>
        </>
      )}

      {/* Comparateur : référence A */}
      <div className="refbar">
        {refItems ? (
          <>
            <span className="reftag">◆ Référence A · {Object.keys(refItems).length} items</span>
            <button type="button" className="btn" onClick={swapRef}>
              ↔ Intervertir
            </button>
            <button type="button" className="btn" onClick={pinRef}>
              📌 Re-figer
            </button>
            <button type="button" className="btn danger" onClick={clearRef}>
              ✕
            </button>
          </>
        ) : (
          <>
            <button type="button" className="btn" onClick={pinRef}>
              📌 Figer comme référence (A)
            </button>
            <span className="refhint">fige ce build, puis modifie-le pour voir le delta</span>
          </>
        )}
      </div>

      {deltas && (
        <div className="deltacard">
          <h3>Δ Build B vs référence A</h3>
          {deltas.length ? (
            deltas.map((d) => (
              <div key={d.stat} className="drow">
                <span className="dl">
                  <span className="ddot" style={{ background: statColor(d.stat) }} />
                  {d.stat}
                </span>
                <span className={`dv ${d.delta > 0 ? "up" : "down"}`}>
                  {d.delta > 0 ? "+" : ""}
                  {d.delta}
                </span>
              </div>
            ))
          ) : (
            <div className="emptot" style={{ padding: "8px 4px" }}>
              Aucun écart — build identique à la référence.
            </div>
          )}
        </div>
      )}

      {/* Totaux par catégorie — statrow + breakdown au survol (comme l'original) */}
      {statNames.length === 0 ? (
        <div className="emptot">
          Équipe des items pour voir tes stats.
          <br />
          Survole une caractéristique pour voir la contribution de chaque item.
        </div>
      ) : (
        CATEGORIES.map(([cat, label]) => {
          const rows = statNames
            .filter((n) => statCategory(n) === cat && computed.totals[n] !== 0)
            .sort(
              (a, b) =>
                statRank(a) - statRank(b) ||
                Math.abs(computed.totals[b]) - Math.abs(computed.totals[a]) ||
                a.localeCompare(b, "fr"),
            );
          if (!rows.length) return null;
          return (
            <div key={cat} className="statgroup">
              <h3>{label}</h3>
              {rows.map((name) => {
                const value = computed.totals[name];
                const delta = refTotals ? value - (refTotals[name] ?? 0) : 0;
                const parts = [...computed.contributions[name]].sort(
                  (a, b) => Math.abs(b.value) - Math.abs(a.value),
                );
                return (
                  <div key={name} className="statwrap">
                    <div className="statrow">
                      <span className="dot" style={{ background: statColor(name) }} />
                      <span className="nm">{name}</span>
                      <span className={`val ${value >= 0 ? "pos" : "neg"}`}>
                        {value > 0 ? "+" : ""}
                        {value}
                      </span>
                      {refTotals && delta !== 0 && (
                        <span className={`chip ${delta > 0 ? "pos" : "neg"}`}>
                          {delta > 0 ? "+" : ""}
                          {delta}
                        </span>
                      )}
                    </div>
                    <div className="breakdown">
                      {parts.map((c, i) => (
                        <div key={`${c.source}-${i}`} className={`bd ${c.fromSet ? "set" : ""}`}>
                          <span className="bl">{c.source}</span>
                          <span className="bv">
                            {c.value > 0 ? "+" : ""}
                            {c.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })
      )}

      <div className="itemcount">{equippedCount} / 16 équipés</div>
    </div>
  );
}
