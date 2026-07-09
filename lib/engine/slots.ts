import type { SlotCategory, SlotKey } from "./types";

export interface SlotDef {
  key: SlotKey;
  category: SlotCategory;
  label: string;
  emoji: string;
}

/**
 * Ordre canonique des slots.
 * NE PAS RÉORDONNER : l'encodage des liens de partage (`encode.ts`)
 * dépend de cet ordre pour rester compatible avec les anciens liens.
 */
export const SLOTS: readonly SlotDef[] = [
  { key: "coiffe", category: "Coiffe", label: "Coiffe", emoji: "🪖" },
  { key: "amulette", category: "Amulette", label: "Amulette", emoji: "📿" },
  { key: "anneau1", category: "Anneau", label: "Anneau", emoji: "💍" },
  { key: "anneau2", category: "Anneau", label: "Anneau", emoji: "💍" },
  { key: "cape", category: "Cape", label: "Cape", emoji: "🧥" },
  { key: "ceinture", category: "Ceinture", label: "Ceinture", emoji: "🎗️" },
  { key: "bottes", category: "Bottes", label: "Bottes", emoji: "🥾" },
  { key: "bouclier", category: "Bouclier", label: "Bouclier", emoji: "🛡️" },
  { key: "arme", category: "Arme", label: "Arme", emoji: "⚔️" },
  { key: "familier", category: "Familier", label: "Familier / Monture", emoji: "🐾" },
  { key: "dofus1", category: "Dofus", label: "Dofus / Trophée", emoji: "🥚" },
  { key: "dofus2", category: "Dofus", label: "Dofus / Trophée", emoji: "🥚" },
  { key: "dofus3", category: "Dofus", label: "Dofus / Trophée", emoji: "🥚" },
  { key: "dofus4", category: "Dofus", label: "Dofus / Trophée", emoji: "🥚" },
  { key: "dofus5", category: "Dofus", label: "Dofus / Trophée", emoji: "🥚" },
  { key: "dofus6", category: "Dofus", label: "Dofus / Trophée", emoji: "🥚" },
] as const;

/** Catégories distinctes, dans l'ordre des slots (pour le filtre du browser) */
export const SIM_CATEGORIES: readonly SlotCategory[] = [
  ...new Set(SLOTS.map((s) => s.category)),
];

/** Premier slot libre acceptant cette catégorie, sinon null */
export function freeSlotFor(
  category: SlotCategory,
  items: Partial<Record<SlotKey, number>>,
): SlotKey | null {
  const slot = SLOTS.find((s) => s.category === category && !items[s.key]);
  return slot ? slot.key : null;
}

/** Slot cible pour une catégorie : d'abord un libre, sinon le premier de la catégorie */
export function firstSlotOfCategory(
  category: SlotCategory,
  items: Partial<Record<SlotKey, number>>,
): SlotKey | null {
  return (
    freeSlotFor(category, items) ??
    SLOTS.find((s) => s.category === category)?.key ??
    null
  );
}
