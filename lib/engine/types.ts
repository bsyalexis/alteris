/**
 * Types du moteur Altéris.
 * Module pur : aucune dépendance React, DB ou réseau.
 * Le format des données est celui produit par le pipeline d'ingestion
 * (ex-`capture.mjs`) : clés courtes pour minimiser le poids du JSON.
 */

/** Ligne d'effet d'un item : [nom, min, max?]. La valeur effective est `max || min`. */
export type EffectLine = readonly [name: string, min: number, max?: number];

export interface Item {
  /** id dofusdude */
  id: number;
  /** nom */
  n: string;
  /** type précis (ex: "Lance", "Cape") */
  t: string;
  /** niveau */
  l: number;
  /** catégorie de slot (ex: "Coiffe", "Anneau", "Dofus") */
  s: SlotCategory;
  /** id de panoplie (0 ou absent = aucune) */
  set?: number;
  /** effets */
  e?: EffectLine[];
  /** id d'image dofusdude */
  img?: number;
}

export interface SetData {
  /** nom de la panoplie */
  n: string;
  /** bonus par nombre de pièces équipées : { "2": [[stat, val], ...], ... } */
  b: Record<string, [string, number][]>;
}

export interface GameData {
  version: string;
  items: Item[];
  sets: Record<string, SetData>;
}

export const SLOT_CATEGORIES = [
  "Coiffe",
  "Amulette",
  "Anneau",
  "Cape",
  "Ceinture",
  "Bottes",
  "Bouclier",
  "Arme",
  "Familier",
  "Dofus",
] as const;

export type SlotCategory = (typeof SLOT_CATEGORIES)[number];

export type SlotKey =
  | "coiffe"
  | "amulette"
  | "anneau1"
  | "anneau2"
  | "cape"
  | "ceinture"
  | "bottes"
  | "bouclier"
  | "arme"
  | "familier"
  | "dofus1"
  | "dofus2"
  | "dofus3"
  | "dofus4"
  | "dofus5"
  | "dofus6";

/** Items équipés : slot -> id d'item */
export type BuildItems = Partial<Record<SlotKey, number>>;

/** Brouillon de build (état du simulateur, futur payload de sauvegarde) */
export interface BuildDraft {
  level: number;
  items: BuildItems;
}

/** Contribution d'une source (item ou panoplie) à une stat */
export interface StatContribution {
  source: string;
  value: number;
  fromSet: boolean;
}

export interface ActiveSet {
  setId: number;
  name: string;
  /** pièces équipées */
  count: number;
  /** total de pièces dans la panoplie */
  total: number;
  /** bonus actif (palier le plus haut <= count), vide si count < 2 */
  bonus: [string, number][];
}

export interface ComputedStats {
  /** total par stat */
  totals: Record<string, number>;
  /** détail des contributions par stat */
  contributions: Record<string, StatContribution[]>;
  activeSets: ActiveSet[];
}

/** Écart d'une stat entre deux builds */
export interface StatDelta {
  stat: string;
  a: number;
  b: number;
  delta: number;
}

/** Index de lecture rapide construit une fois à partir de GameData */
export interface GameDataIndex {
  version: string;
  byId: Map<number, Item>;
  bySet: Map<number, Item[]>;
  sets: Record<string, SetData>;
  items: Item[];
}
