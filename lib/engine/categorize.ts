/**
 * Classement des stats pour l'affichage.
 * Pur et sans dépendance UI : renvoie des catégories sémantiques,
 * jamais des couleurs.
 */

export type StatCategory = "prim" | "dmg" | "res";
export type Element = "neutre" | "terre" | "feu" | "eau" | "air";

export const STAT_CATEGORIES: readonly { id: StatCategory; label: string }[] = [
  { id: "prim", label: "Caractéristiques" },
  { id: "dmg", label: "Dommages" },
  { id: "res", label: "Résistances" },
];

/** Normalise un nom de stat : minuscules, sans accents. */
export function normalizeStatName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

export function statCategory(name: string): StatCategory {
  const n = normalizeStatName(name);
  if (n.includes("resistance")) return "res";
  if (n.includes("dommage")) return "dmg";
  return "prim";
}

export function statElement(name: string): Element | null {
  const n = normalizeStatName(name);
  if (n.includes("neutre")) return "neutre";
  if (n.includes("terre") || n === "force") return "terre";
  if (n.includes("feu") || n === "intelligence") return "feu";
  if (n.includes("eau") || n === "chance") return "eau";
  if (n.includes("air") || n === "agilite") return "air";
  return null;
}
