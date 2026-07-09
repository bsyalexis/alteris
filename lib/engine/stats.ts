import type {
  ActiveSet,
  BuildItems,
  ComputedStats,
  EffectLine,
  GameData,
  GameDataIndex,
  StatContribution,
} from "./types";

/** Effets techniques à ignorer (héritage des données dofusdude) */
const HIDDEN_EFFECT = /fertile|special spell/i;

export function isHiddenEffect(name: string): boolean {
  return HIDDEN_EFFECT.test(name);
}

/**
 * Valeur effective d'une ligne d'effet : max si présent et non nul, sinon min.
 * Sémantique volontairement identique au simulateur historique
 * (`(e[2] || e[1]) || 0`) : un max à 0 signifie "valeur fixe = min"
 * (ex: ["Portée", 1, 0] vaut 1).
 */
export function effectValue(e: EffectLine): number {
  return e[2] || e[1] || 0;
}

/** Construit l'index de lecture rapide. À faire une seule fois par jeu de données. */
export function createIndex(data: GameData): GameDataIndex {
  const byId = new Map(data.items.map((i) => [i.id, i]));
  const bySet = new Map<number, typeof data.items>();
  for (const item of data.items) {
    if (!item.set) continue;
    const list = bySet.get(item.set) ?? [];
    list.push(item);
    bySet.set(item.set, list);
  }
  return { version: data.version, byId, bySet, sets: data.sets, items: data.items };
}

/**
 * Bonus actif d'une panoplie pour `count` pièces équipées :
 * palier le plus haut <= count. Aucun bonus sous 2 pièces.
 */
export function setBonus(
  index: GameDataIndex,
  setId: number,
  count: number,
): [string, number][] {
  const set = index.sets[String(setId)];
  if (!set || count < 2) return [];
  const thresholds = Object.keys(set.b)
    .map(Number)
    .filter((k) => k <= count)
    .sort((a, b) => b - a);
  return thresholds.length ? set.b[String(thresholds[0])] : [];
}

/**
 * Calcule totaux + contributions + panoplies actives d'un build.
 * Fonction pure : mêmes entrées -> mêmes sorties.
 */
export function computeBuildStats(
  index: GameDataIndex,
  items: BuildItems,
): ComputedStats {
  const contributions: Record<string, StatContribution[]> = {};
  const add = (stat: string, value: number, source: string, fromSet: boolean) => {
    if (!value) return;
    (contributions[stat] ??= []).push({ source, value, fromSet });
  };

  // Contributions des items
  for (const id of Object.values(items)) {
    const item = id != null ? index.byId.get(id) : undefined;
    if (!item) continue;
    for (const effect of item.e ?? []) {
      if (isHiddenEffect(effect[0])) continue;
      add(effect[0], effectValue(effect), item.n, false);
    }
  }

  // Pièces équipées par panoplie
  const equippedCount = new Map<number, number>();
  for (const id of Object.values(items)) {
    const item = id != null ? index.byId.get(id) : undefined;
    if (item?.set) equippedCount.set(item.set, (equippedCount.get(item.set) ?? 0) + 1);
  }

  const activeSets: ActiveSet[] = [...equippedCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([setId, count]) => {
      const set = index.sets[String(setId)];
      return {
        setId,
        name: set?.n ?? `Panoplie ${setId}`,
        count,
        total: index.bySet.get(setId)?.length ?? 0,
        bonus: setBonus(index, setId, count),
      };
    });

  for (const s of activeSets) {
    for (const [stat, value] of s.bonus) add(stat, value, `◈ ${s.name}`, true);
  }

  const totals: Record<string, number> = {};
  for (const stat in contributions) {
    totals[stat] = contributions[stat].reduce((sum, c) => sum + c.value, 0);
  }

  return { totals, contributions, activeSets };
}
