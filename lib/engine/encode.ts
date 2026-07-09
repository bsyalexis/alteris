import { SLOTS } from "./slots";
import type { BuildDraft, BuildItems } from "./types";

export const MIN_LEVEL = 1;
export const MAX_LEVEL = 200;

/**
 * Encode un build en code compact : `niveau!id.id.id...`
 * (16 positions dans l'ordre de SLOTS, vide = slot libre).
 * Format IDENTIQUE au site historique : les anciens liens `#b=` restent valides.
 */
export function encodeBuild(draft: BuildDraft): string {
  const ids = SLOTS.map((slot) => draft.items[slot.key] ?? "").join(".");
  return `${draft.level}!${ids}`;
}

/**
 * Décode un code de build. Accepte le code nu, un fragment `#b=...`,
 * ou une URL complète contenant `b=...`.
 * `isValidId` (optionnel) filtre les ids inconnus du jeu de données courant.
 */
export function decodeBuild(
  code: string,
  isValidId?: (id: number) => boolean,
): BuildDraft | null {
  let raw = String(code ?? "").trim();
  const match = raw.match(/b=([^&\s]+)/);
  if (match) raw = match[1];

  const parts = raw.split("!");
  if (parts.length < 2) return null;

  const ids = parts[1].split(".");
  const items: BuildItems = {};
  SLOTS.forEach((slot, i) => {
    const id = Number(ids[i]);
    if (id && (!isValidId || isValidId(id))) items[slot.key] = id;
  });

  const level = Math.max(
    MIN_LEVEL,
    Math.min(MAX_LEVEL, Number(parts[0]) || MAX_LEVEL),
  );
  return { level, items };
}
