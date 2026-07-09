/**
 * Ordre canonique d'affichage des stats (aligné sur les conventions Dofus :
 * principales d'abord — PA, PM, Portée, Critique… — puis secondaires,
 * puis tableau élémentaire, puis lignes d'arme, puis divers).
 * Pur : ne renvoie que des groupes et des rangs, jamais de rendu.
 */
import { effectValue, isHiddenEffect } from "./stats";
import type { Item } from "./types";

export type StatGroup = "main" | "secondary" | "elemental" | "weapon" | "misc";

/** Stats principales, dans l'ordre d'affichage */
export const MAIN_STATS: readonly string[] = [
  "PA",
  "PM",
  "Portée",
  "% Critique",
  "Puissance",
  "Invocation",
  "Vitalité",
  "Sagesse",
  "Force",
  "Intelligence",
  "Chance",
  "Agilité",
];

/** Stats secondaires, dans l'ordre d'affichage */
export const SECONDARY_STATS: readonly string[] = [
  "Pods",
  "Pod",
  "Prospection",
  "Initiative",
  "Tacle",
  "Fuite",
  "Retrait PA",
  "Retrait PM",
  "Esquive PA",
  "Esquive PM",
  "Soin",
  "Dommage",
  "Dommage Critiques",
  "Dommage Poussée",
  "Résistance Critiques",
  "Résistance Poussée",
  "% Résistance mêlée",
  "% Résistance distance",
  "% Dommages d'armes",
  "% Dommages mêlée",
  "% Dommages distance",
  "Dommages Renvoyés",
  "Puissance Pièges",
  "Dommage Pièges",
];

/** Une ligne du tableau élémentaire : noms de stats par colonne */
export interface ElementalRow {
  label: string;
  dmg: string;
  res: string;
  resPct: string;
}

export const ELEMENTAL_ROWS: readonly ElementalRow[] = [
  { label: "Neutre", dmg: "Dommage Neutre", res: "Résistance Neutre", resPct: "% Résistance Neutre" },
  { label: "Terre", dmg: "Dommage Terre", res: "Résistance Terre", resPct: "% Résistance Terre" },
  { label: "Feu", dmg: "Dommage Feu", res: "Résistance Feu", resPct: "% Résistance Feu" },
  { label: "Eau", dmg: "Dommage Eau", res: "Résistance Eau", resPct: "% Résistance Eau" },
  { label: "Air", dmg: "Dommage Air", res: "Résistance Air", resPct: "% Résistance Air" },
];

const ELEMENTAL_SET = new Set(
  ELEMENTAL_ROWS.flatMap((r) => [r.dmg, r.res, r.resPct]),
);
const MAIN_RANK = new Map(MAIN_STATS.map((s, i) => [s, i]));
const SECONDARY_RANK = new Map(SECONDARY_STATS.map((s, i) => [s, i]));

/** Lignes d'arme : jet de dégâts, vol, soins (minuscule initiale dans les données) */
const WEAPON_LINE = /^(dommages|vol|soins) /;

export function statGroup(name: string): StatGroup {
  if (MAIN_RANK.has(name)) return "main";
  if (SECONDARY_RANK.has(name)) return "secondary";
  if (ELEMENTAL_SET.has(name)) return "elemental";
  if (WEAPON_LINE.test(name) || name === "dommages du meilleur élément")
    return "weapon";
  return "misc";
}

const BIG = 10_000;

/**
 * Rang de tri global : stats principales d'abord (dans leur ordre canonique),
 * puis secondaires (décalées de +1000), puis inconnues (après tout).
 */
export function statRank(name: string): number {
  const main = MAIN_RANK.get(name);
  if (main !== undefined) return main;
  const secondary = SECONDARY_RANK.get(name);
  if (secondary !== undefined) return 1000 + secondary;
  return BIG;
}

export interface GroupedStats {
  main: string[];
  secondary: string[];
  weapon: string[];
  misc: string[];
  /** true si au moins une stat élémentaire est présente */
  hasElemental: boolean;
}

/** Répartit et ordonne des noms de stats pour l'affichage (élémentaires à part, via ELEMENTAL_ROWS) */
export function groupStats(names: string[]): GroupedStats {
  const out: GroupedStats = {
    main: [],
    secondary: [],
    weapon: [],
    misc: [],
    hasElemental: false,
  };
  for (const name of names) {
    const group = statGroup(name);
    if (group === "elemental") out.hasElemental = true;
    else out[group].push(name);
  }
  const byRank = (a: string, b: string) =>
    statRank(a) - statRank(b) || a.localeCompare(b, "fr");
  out.main.sort(byRank);
  out.secondary.sort(byRank);
  out.weapon.sort(byRank);
  out.misc.sort(byRank);
  return out;
}

/** Valeur totale d'une stat sur un item (0 si absente) */
export function itemStatValue(item: Item, stat: string): number {
  let total = 0;
  for (const e of item.e ?? []) {
    if (e[0] === stat && !isHiddenEffect(e[0])) total += effectValue(e);
  }
  return total;
}

/** Stats proposées dans les filtres et le suggesteur de build */
export const FILTERABLE_STATS: readonly string[] = [
  ...MAIN_STATS,
  "Prospection",
  "Initiative",
  "Pods",
  "Tacle",
  "Fuite",
  "Retrait PA",
  "Retrait PM",
  "Esquive PA",
  "Esquive PM",
  "Soin",
  "Dommage",
  "Dommage Critiques",
  "Dommage Poussée",
  ...ELEMENTAL_ROWS.map((r) => r.dmg),
  ...ELEMENTAL_ROWS.map((r) => r.resPct),
];
