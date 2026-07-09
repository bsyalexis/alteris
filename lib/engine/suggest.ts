/**
 * Suggesteur de build : construit un build maximisant des stats pondérées
 * pour un niveau donné. Greedy par slot + hill-climbing conscient des
 * bonus de panoplie (le score est toujours évalué sur le build COMPLET
 * via computeBuildStats, panoplies incluses).
 *
 * Règles du jeu intégrées :
 * - PA plafonnés à 12 au total (base personnage : 7 dès le niveau 100, sinon 6).
 * - PM plafonnés à 6 au total (base : 3).
 *   Les PA/PM d'équipement au-delà du plafond ne valent rien.
 *
 * Objectifs lexicographiques : les stats visées d'abord, puis le maximum
 * de PA+PM (plafonnés), puis la Vitalité. Un gain de PA/PM/Vitalité ne
 * fait JAMAIS baisser les stats visées.
 *
 * Déterministe : mêmes entrées -> même build.
 */
import { SLOTS } from "./slots";
import { computeBuildStats } from "./stats";
import { itemStatValue } from "./statOrder";
import type { BuildItems, GameDataIndex, Item, SlotKey } from "./types";

/** Poids par stat visée (ex: { Force: 3, Vitalité: 1 }) */
export type SuggestTargets = Record<string, number>;

export const PA_CAP = 12;
export const PM_CAP = 6;
export const BASE_PM = 3;

/** PA de base du personnage selon le niveau */
export function basePA(level: number): number {
  return level >= 100 ? 7 : 6;
}

export interface SuggestOptions {
  level: number;
  targets: SuggestTargets;
  /** candidats retenus par slot pour les stats visées (défaut 12) */
  candidatesPerSlot?: number;
  /** passes de hill-climbing (défaut 3) */
  passes?: number;
}

/**
 * [stats visées, PA+PM plafonnés, Vitalité, -débordement PA/PM]
 * Comparaison lexicographique. Le dernier terme évite de gaspiller des
 * PA/PM au-delà du plafond quand un autre item ferait aussi bien sans.
 */
type ScoreVec = readonly [number, number, number, number];

function compareScore(a: ScoreVec, b: ScoreVec): number {
  return a[0] - b[0] || a[1] - b[1] || a[2] - b[2] || a[3] - b[3];
}

/** PA/PM d'équipement réellement utiles, une fois base et plafond appliqués */
function effectiveGearStat(gear: number, base: number, cap: number): number {
  return Math.min(base + gear, cap) - base;
}

function scoreVec(
  index: GameDataIndex,
  items: BuildItems,
  targets: SuggestTargets,
  level: number,
): ScoreVec {
  const { totals } = computeBuildStats(index, items);
  const gearPA = totals["PA"] ?? 0;
  const gearPM = totals["PM"] ?? 0;
  const effPA = effectiveGearStat(gearPA, basePA(level), PA_CAP);
  const effPM = effectiveGearStat(gearPM, BASE_PM, PM_CAP);
  const overflow = Math.max(0, gearPA - effPA) + Math.max(0, gearPM - effPM);

  let primary = 0;
  for (const stat in targets) {
    let value = totals[stat] ?? 0;
    if (stat === "PA") value = effPA; // le plafond s'applique aussi aux cibles
    if (stat === "PM") value = effPM;
    primary += value * targets[stat];
  }
  return [primary, effPA + effPM, totals["Vitalité"] ?? 0, -overflow];
}

/** Pré-score d'un item isolé (sans panoplie) pour la sélection des candidats */
function itemScore(item: Item, targets: SuggestTargets): number {
  let score = 0;
  for (const stat in targets) score += itemStatValue(item, stat) * targets[stat];
  return score;
}

/** Objectifs secondaires : toujours dans les pools de candidats */
const SECONDARY_POOL_STATS = ["PA", "PM", "Vitalité"] as const;
const SECONDARY_POOL_SIZE = 4;

export function suggestBuild(
  index: GameDataIndex,
  options: SuggestOptions,
): BuildItems {
  const { level, targets } = options;
  const perSlot = options.candidatesPerSlot ?? 12;
  const passes = options.passes ?? 3;

  if (!Object.keys(targets).length) return {};

  // Items éligibles par catégorie
  const byCategory = new Map<string, Item[]>();
  for (const item of index.items) {
    if (item.l > level) continue;
    const list = byCategory.get(item.s) ?? [];
    list.push(item);
    byCategory.set(item.s, list);
  }

  // Candidats par slot : top K sur les stats visées + top PA / PM / Vitalité
  // (sans ces pools, un item pur PA — sans stat visée — ne serait jamais considéré)
  const candidates = new Map<SlotKey, Item[]>();
  for (const slot of SLOTS) {
    const pool = byCategory.get(slot.category) ?? [];
    const picked = new Map<number, Item>();

    const take = (scorer: (i: Item) => number, count: number) => {
      [...pool]
        .map((item) => ({ item, score: scorer(item) }))
        .filter((c) => c.score > 0)
        .sort((a, b) => b.score - a.score || a.item.id - b.item.id)
        .slice(0, count)
        .forEach((c) => picked.set(c.item.id, c.item));
    };

    take((i) => itemScore(i, targets), perSlot);
    for (const stat of SECONDARY_POOL_STATS)
      take((i) => itemStatValue(i, stat), SECONDARY_POOL_SIZE);

    candidates.set(slot.key, [...picked.values()]);
  }

  // Départ greedy : meilleur candidat isolé par slot (sans doublon d'item)
  const build: BuildItems = {};
  const used = new Set<number>();
  for (const slot of SLOTS) {
    const pick = candidates
      .get(slot.key)
      ?.find((i) => !used.has(i.id) && itemScore(i, targets) > 0);
    if (pick) {
      build[slot.key] = pick.id;
      used.add(pick.id);
    }
  }

  // Pièces de panoplie disponibles par slot (pour le mouvement groupé)
  const setPieces = new Map<number, Map<SlotKey, Item>>();
  for (const slot of SLOTS) {
    for (const item of candidates.get(slot.key) ?? []) {
      if (!item.set) continue;
      const slots = setPieces.get(item.set) ?? new Map<SlotKey, Item>();
      if (!slots.has(slot.key)) slots.set(slot.key, item);
      setPieces.set(item.set, slots);
    }
  }

  // Hill-climbing : pour chaque slot, essaie vide + chaque candidat,
  // garde le meilleur score GLOBAL (lexicographique, panoplies incluses)
  let bestScore = scoreVec(index, build, targets, level);
  for (let pass = 0; pass < passes; pass++) {
    let improved = false;
    for (const slot of SLOTS) {
      const current = build[slot.key];
      const usedElsewhere = new Set(
        Object.entries(build)
          .filter(([key]) => key !== slot.key)
          .map(([, id]) => id),
      );
      let bestId = current;
      for (const option of [undefined, ...(candidates.get(slot.key) ?? [])]) {
        const id = option?.id;
        if (id === current) continue;
        if (id != null && usedElsewhere.has(id)) continue; // pas deux fois le même item
        const trial = { ...build };
        if (id == null) delete trial[slot.key];
        else trial[slot.key] = id;
        const score = scoreVec(index, trial, targets, level);
        if (compareScore(score, bestScore) > 0) {
          bestScore = score;
          bestId = id;
        }
      }
      if (bestId !== current) {
        if (bestId == null) delete build[slot.key];
        else build[slot.key] = bestId;
        improved = true;
      }
    }

    // Mouvement groupé : équiper d'un coup toutes les pièces d'une panoplie.
    // Indispensable — un échange slot par slot ne peut pas franchir le
    // "creux" avant que le bonus 2+ pièces ne s'active.
    for (const [, slots] of setPieces) {
      if (slots.size < 2) continue;
      const trial = { ...build };
      const usedIds = new Set(Object.values(trial));
      for (const [slotKey, item] of slots) {
        if (trial[slotKey] === item.id) continue;
        if (usedIds.has(item.id)) continue;
        usedIds.delete(trial[slotKey]!);
        trial[slotKey] = item.id;
        usedIds.add(item.id);
      }
      const score = scoreVec(index, trial, targets, level);
      if (compareScore(score, bestScore) > 0) {
        bestScore = score;
        Object.assign(build, trial);
        improved = true;
      }
    }

    if (!improved) break;
  }

  return build;
}
