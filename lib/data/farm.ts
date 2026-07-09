/**
 * Types et constantes des routes de farm (public/data/zones.json + pistes kamas).
 * Repris à l'identique du site historique.
 */

export type ElementKey = "t" | "f" | "e" | "a" | "n";

export interface ZoneMonster {
  n: string;
  l: number;
  x: number;
  r: Record<ElementKey, number>;
  fm?: string;
}

export interface Zone {
  id: number;
  n: string;
  lvl: number;
  cnt: number;
  xp: number;
  res: Record<ElementKey, number>;
  fams?: string[];
  mons: ZoneMonster[];
}

export interface FarmData {
  version: string;
  zones: Zone[];
}

export const ELEMENT_KEYS: readonly ElementKey[] = ["t", "f", "e", "a", "n"];

export const ELEMENT_LABEL: Record<ElementKey, string> = {
  t: "Terre",
  f: "Feu",
  e: "Eau",
  a: "Air",
  n: "Neutre",
};

export const ELEMENT_CSS_VAR: Record<ElementKey, string> = {
  t: "var(--terre)",
  f: "var(--feu)",
  e: "var(--eau)",
  a: "var(--air)",
  n: "var(--neutre)",
};

/** Paliers de niveau : [label, min, max] */
export const BRACKETS: readonly [string, number, number][] = [
  ["1-20", 1, 20],
  ["21-40", 21, 40],
  ["41-60", 41, 60],
  ["61-80", 61, 80],
  ["81-110", 81, 110],
  ["111-130", 111, 130],
  ["131-160", 131, 160],
  ["161-180", 161, 180],
  ["181-199", 181, 199],
  ["200", 200, 200],
];

/** Élément le plus faible (résistance moyenne la plus basse) d'une zone */
export function weakestElement(zone: Zone): ElementKey {
  let weakest: ElementKey = ELEMENT_KEYS[0];
  for (const key of ELEMENT_KEYS) {
    if (zone.res[key] < zone.res[weakest]) weakest = key;
  }
  return weakest;
}

/** Heuristique donjon (reprise du site historique) */
const DUNGEON =
  /donjon|château|antre|terrier|serre|hypogée|caverne|temple|repaire|labo|bulbe|crypte|catacombe|palais|manoir|forteresse/i;

export function isDungeon(zone: Zone): boolean {
  return DUNGEON.test(zone.n);
}

export function allFamilies(zones: Zone[]): string[] {
  return [...new Set(zones.flatMap((z) => z.mons.map((m) => m.fm)))]
    .filter((f): f is string => Boolean(f))
    .sort((a, b) => a.localeCompare(b, "fr"));
}

/** Pistes kamas par palier : [zone, région, note] */
export const KAMAS_SPOTS: readonly (readonly [string, string, string][])[] = [
  [
    ["Souterrains d'Astrub", "Astrub", "Mobs denses à côté de la banque, idéal pour démarrer"],
    ["Champs / Prairies d'Astrub", "Astrub", "Classique début : laine, blé, drops simples"],
    ["Coin des Bouftous", "Amakna", "Laine & cuir de Bouftou, très accessible"],
  ],
  [
    ["Plaine des Porkass / Dopeuls", "Plaines de Cania", "Drops variés, mobs nombreux"],
    ["🏆 Donjon des Tofus / Scarafeuilles", "Amakna", "Donjon rapide en solo + défis = kamas bonus"],
    ["Territoire des Bandits", "Plaines de Cania", "Groupes de bandits denses, drops de ressources"],
  ],
  [
    ["🏆 Château du Wa Wabbit", "Île des Wabbits", "Drops recherchés, donjon culte"],
    ["🏆 Donjon des Bworks", "Amakna", "Solo facile, ressources Bwork"],
    ["Bassin des Muldos", "Baie de Sufokia", "Poils/ressources de monture"],
  ],
  [
    ["Landes de Sidimote (Magik Riktus)", "Landes de Sidimote", "Runes & ressources, mobs denses"],
    ["🏆 Terrier du Wa Wabbit", "Île des Wabbits", "Donjon rentable en boucle"],
    ["Bois des Arak-haï", "Forêt des Abraknydes", "Bois & ressources bûcheron"],
  ],
  [
    ["Port de Givre / La Bourgade", "Île de Frigost", "Début Frigost : groupes denses = rentable"],
    ["🏆 Antre de la Reine Nyée", "Forêt des Abraknydes", "Boss abra, drops de sets"],
    ["Plantala", "Île de Pandala", "Ressources métier très demandées"],
  ],
  [
    ["Forêt des pins perdus / Lac gelé", "Île de Frigost", "Groupes très denses, spot XP+drop réputé"],
    ["Akwadala / Terrdala / Feudala", "Île de Pandala", "Ressources élémentaires demandées"],
    ["🏆 Serre du Royalmouth", "Île de Frigost", "Donjon Frigost accessible"],
  ],
  [
    ["Village enseveli / Cavernes des Givrefoux", "Île de Frigost", "Frigost dense, drops de sets recherchés"],
    ["🏆 Hypogée de l'Obsidiantre", "Île de Frigost", "Boss, ressources fin de Frigost"],
    ["Cité Oubliée / Gorge des Vents Hurlants", "Saharach", "Mobs Saharach, ressources"],
  ],
  [
    ["Forêt pétrifiée / Crocs de verre / Mont Torrideau", "Île de Frigost", "Cœur du farm Frigost 170-180"],
    ["🏆 Antre du Korriandre", "Île de Frigost", "Donjon rentable en boucle"],
    ["Catacombres", "Srambad", "Ressources & drops Srambad"],
  ],
  [
    ["Jardins d'Hiver / Remparts à vent / Bastion des froides légions", "Île de Frigost", "Spots THL les plus prisés, groupes denses"],
    ["🏆 Cavernes du Kolosso / Antichambre des Gloursons", "Île de Frigost", "Donjons 190, drops de valeur"],
    ["Pyramide d'Ombre", "Dimension Obscure", "Drops de la dimension obscure"],
  ],
  [
    ["🏆 Donjons THL Frigost (Klime, Missiz Frizz, Harebourg)", "Île de Frigost", "Trophées & drops uniques à haute valeur"],
    ["Profondeurs de Sufokia (Trithons, R'lyugluglu)", "Profondeurs de Sufokia", "Zones 200 denses, ressources THL"],
    ["Fort Thune / Retraite des Éternels", "Enutrosor", "Farm THL réputé pour les kamas"],
  ],
];

export const KAMAS_PRINCIPLES: readonly string[] = [
  "Donjons ~30-50 niveaux sous toi, en solo, en validant les défis (kamas bonus).",
  "Chasses au trésor : kamas directs, rapide et sans stuff.",
  "Brisage d'objets en runes puis revente (forgemagie).",
  "Percepteurs posés dans des donjons fréquentés (revenu passif).",
  "Métiers de récolte haut niveau (Alchimiste / Mineur / Bûcheron 100+) : peu de concurrence, forte demande.",
  "Boss de donjon : trophées, Dofus et accessoires à haute valeur unitaire.",
];
