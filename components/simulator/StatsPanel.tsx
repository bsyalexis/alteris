"use client";

import { useMemo } from "react";
import {
  ELEMENTAL_ROWS,
  compareTotals,
  computeBuildStats,
  groupStats,
  statCategory,
  statElement,
} from "@/lib/engine";
import type { ComputedStats, GameDataIndex } from "@/lib/engine";
import { useBuildStore } from "@/lib/store/buildStore";

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

function statColor(name: string): string {
  const el = statElement(name);
  return el ? ELEMENT_VAR[el] : CATEGORY_VAR[statCategory(name)];
}

function DeltaChip({ delta }: { delta: number }) {
  if (!delta) return null;
  return (
    <span className={`chip ${delta > 0 ? "pos" : "neg"}`}>
      {delta > 0 ? "+" : ""}
      {delta}
    </span>
  );
}

/** Ligne de stat avec contributions dépliables */
function StatRow({
  name,
  computed,
  refTotals,
}: {
  name: string;
  computed: ComputedStats;
  refTotals: Record<string, number> | null;
}) {
  const value = computed.totals[name];
  const delta = refTotals ? value - (refTotals[name] ?? 0) : 0;
  const parts = [...computed.contributions[name]].sort(
    (a, b) => Math.abs(b.value) - Math.abs(a.value),
  );
  return (
    <details className="group">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded px-1 py-1 text-[13px] hover:bg-[var(--panel2)]">
        <span
          className="h-2 w-2 flex-shrink-0 rounded-full"
          style={{ background: statColor(name) }}
        />
        <span className="min-w-0 flex-1 truncate">{name}</span>
        <span
          className={`font-bold ${value >= 0 ? "text-[var(--lime-bright)]" : "text-[var(--red)]"}`}
        >
          {value > 0 ? "+" : ""}
          {value}
        </span>
        {refTotals && <DeltaChip delta={delta} />}
      </summary>
      <div className="mb-1 ml-4 border-l border-[var(--line)] pl-3">
        {parts.map((c, i) => (
          <div
            key={`${c.source}-${i}`}
            className="flex items-center justify-between py-0.5 text-[12px]"
          >
            <span className={c.fromSet ? "text-[var(--violet)]" : "text-[var(--muted)]"}>
              {c.source}
            </span>
            <span>
              {c.value > 0 ? "+" : ""}
              {c.value}
            </span>
          </div>
        ))}
      </div>
    </details>
  );
}

function StatGroupBlock({
  title,
  names,
  computed,
  refTotals,
  color,
}: {
  title: string;
  names: string[];
  computed: ComputedStats;
  refTotals: Record<string, number> | null;
  color: string;
}) {
  const rows = names.filter((n) => computed.totals[n] !== 0);
  if (!rows.length) return null;
  return (
    <div className="mb-3">
      <h3
        className="mb-1.5 text-xs font-extrabold uppercase tracking-wide"
        style={{ color }}
      >
        {title}
      </h3>
      {rows.map((name) => (
        <StatRow key={name} name={name} computed={computed} refTotals={refTotals} />
      ))}
    </div>
  );
}

/** Tableau Dmg / Rés / Rés% par élément */
function ElementalTable({
  computed,
  refTotals,
}: {
  computed: ComputedStats;
  refTotals: Record<string, number> | null;
}) {
  const rows = ELEMENTAL_ROWS.filter(
    (r) => computed.totals[r.dmg] || computed.totals[r.res] || computed.totals[r.resPct],
  );
  if (!rows.length) return null;
  const cell = (stat: string, suffix = "") => {
    const value = computed.totals[stat] ?? 0;
    const delta = refTotals ? value - (refTotals[stat] ?? 0) : 0;
    return (
      <td className="py-1 text-right tabular-nums">
        <span className={value ? "" : "text-[var(--muted)] opacity-50"}>
          {value}
          {suffix}
        </span>
        {refTotals && delta !== 0 && (
          <span className={`chip ml-1 ${delta > 0 ? "pos" : "neg"}`}>
            {delta > 0 ? "+" : ""}
            {delta}
          </span>
        )}
      </td>
    );
  };
  return (
    <div className="mb-3">
      <h3 className="mb-1.5 text-xs font-extrabold uppercase tracking-wide text-[var(--gold)]">
        Éléments
      </h3>
      <table className="w-full text-[13px]">
        <thead>
          <tr className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
            <th className="pb-1 text-left font-bold">Élément</th>
            <th className="pb-1 text-right font-bold">Dmg.</th>
            <th className="pb-1 text-right font-bold">Rés.</th>
            <th className="pb-1 text-right font-bold">Rés. %</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-t border-[var(--line)]">
              <td className="py-1">
                <span className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: ELEMENT_VAR[r.label.toLowerCase()] }}
                  />
                  {r.label}
                </span>
              </td>
              {cell(r.dmg)}
              {cell(r.res)}
              {cell(r.resPct, " %")}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
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

  const computed = useMemo(() => computeBuildStats(index, items), [index, items]);
  const refTotals = useMemo(
    () => (refItems ? computeBuildStats(index, refItems).totals : null),
    [index, refItems],
  );
  const deltas = useMemo(
    () => (refTotals ? compareTotals(refTotals, computed.totals) : null),
    [refTotals, computed],
  );
  const grouped = useMemo(
    () => groupStats(Object.keys(computed.contributions)),
    [computed],
  );

  return (
    <aside className="panel h-fit p-4 lg:sticky lg:top-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-extrabold">Stats du build</h2>
        <span className="text-xs text-[var(--muted)]">{equippedCount} / 16 équipés</span>
      </div>

      {/* Comparateur : référence A */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {refItems ? (
          <>
            <span className="text-xs font-bold text-[var(--violet)]">
              ◆ Référence A · {Object.keys(refItems).length} items
            </span>
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
            <span className="text-[11px] text-[var(--muted)]">
              fige ce build, puis modifie-le pour voir le delta
            </span>
          </>
        )}
      </div>

      {/* Delta B vs A */}
      {deltas && (
        <div className="mb-4 rounded-lg border border-[var(--line)] bg-[var(--panel2)] p-3">
          <h3 className="mb-2 text-xs font-extrabold uppercase tracking-wide text-[var(--muted)]">
            Δ Build B vs référence A
          </h3>
          {deltas.length ? (
            deltas.map((d) => (
              <div
                key={d.stat}
                className="flex items-center justify-between py-0.5 text-[13px]"
              >
                <span className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: statColor(d.stat) }}
                  />
                  {d.stat}
                </span>
                <span
                  className={`font-bold ${d.delta > 0 ? "text-[var(--lime-bright)]" : "text-[var(--red)]"}`}
                >
                  {d.delta > 0 ? "+" : ""}
                  {d.delta}
                </span>
              </div>
            ))
          ) : (
            <div className="text-xs text-[var(--muted)]">
              Aucun écart — build identique à la référence.
            </div>
          )}
        </div>
      )}

      {/* Panoplies actives */}
      {computed.activeSets.length > 0 && (
        <div className="mb-4">
          <h3 className="mb-2 text-xs font-extrabold uppercase tracking-wide text-[var(--violet)]">
            Panoplies
          </h3>
          {computed.activeSets.map((set) => (
            <div
              key={set.setId}
              className="mb-2 rounded-lg border border-[var(--line)] bg-[var(--panel2)] p-2.5"
            >
              <div className="text-[13px] font-bold text-[var(--violet)]">◈ {set.name}</div>
              <div className="text-[11px] text-[var(--muted)]">
                {set.count} / {set.total} pièces
                {set.bonus.length ? " · bonus actif" : " · bonus à partir de 2 pièces"}
              </div>
              {set.bonus.length > 0 && (
                <div className="mt-1 text-[12px]">
                  {set.bonus
                    .map(([stat, value]) => `${value > 0 ? "+" : ""}${value} ${stat}`)
                    .join(", ")}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Stats ordonnées : principales -> éléments -> secondaires -> arme -> divers */}
      {Object.keys(computed.totals).length === 0 ? (
        <div className="py-6 text-center text-sm text-[var(--muted)]">
          Équipe des items pour voir tes stats.
        </div>
      ) : (
        <>
          <StatGroupBlock
            title="Principales"
            names={grouped.main}
            computed={computed}
            refTotals={refTotals}
            color="var(--lime)"
          />
          <ElementalTable computed={computed} refTotals={refTotals} />
          <StatGroupBlock
            title="Secondaires"
            names={grouped.secondary}
            computed={computed}
            refTotals={refTotals}
            color="var(--violet)"
          />
          <StatGroupBlock
            title="Arme"
            names={grouped.weapon}
            computed={computed}
            refTotals={refTotals}
            color="var(--gold)"
          />
          {grouped.misc.filter((n) => computed.totals[n] !== 0).length > 0 && (
            <details className="mt-1">
              <summary className="cursor-pointer text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
                Divers
              </summary>
              {grouped.misc.map((name) =>
                computed.totals[name] !== 0 ? (
                  <StatRow
                    key={name}
                    name={name}
                    computed={computed}
                    refTotals={refTotals}
                  />
                ) : null,
              )}
            </details>
          )}
        </>
      )}
    </aside>
  );
}
