import { computeBuildStats } from "./stats";
import type { BuildItems, GameDataIndex, StatDelta } from "./types";

/**
 * Écarts stat par stat entre deux builds (b - a), triés par |delta| décroissant.
 * Les stats identiques (delta nul) sont omises.
 */
export function compareBuilds(
  index: GameDataIndex,
  a: BuildItems,
  b: BuildItems,
): StatDelta[] {
  const totalsA = computeBuildStats(index, a).totals;
  const totalsB = computeBuildStats(index, b).totals;
  return compareTotals(totalsA, totalsB);
}

/** Variante sur totaux déjà calculés (évite de recalculer dans l'UI). */
export function compareTotals(
  totalsA: Record<string, number>,
  totalsB: Record<string, number>,
): StatDelta[] {
  const stats = new Set([...Object.keys(totalsA), ...Object.keys(totalsB)]);
  const deltas: StatDelta[] = [];
  for (const stat of stats) {
    const a = totalsA[stat] ?? 0;
    const b = totalsB[stat] ?? 0;
    if (a !== b) deltas.push({ stat, a, b, delta: b - a });
  }
  return deltas.sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta));
}
