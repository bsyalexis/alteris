"use client";

import { create } from "zustand";
import {
  MAX_LEVEL,
  SIM_CATEGORIES,
  SLOTS,
  firstSlotOfCategory,
  freeSlotFor,
} from "@/lib/engine";
import type { BuildItems, SlotCategory, SlotKey } from "@/lib/engine";

interface BuildState {
  /** items équipés (build B, celui qu'on édite) */
  items: BuildItems;
  level: number;
  /** build A figé pour comparaison, null si aucun */
  refItems: BuildItems | null;
  activeCategory: SlotCategory;
  activeSlot: SlotKey | null;

  setLevel: (level: number) => void;
  /** équipe un item dans le slot actif s'il correspond, sinon premier slot libre de sa catégorie */
  equip: (itemId: number, category: SlotCategory) => void;
  remove: (slot: SlotKey) => void;
  reset: () => void;
  selectSlot: (slot: SlotKey) => void;
  selectCategory: (category: SlotCategory) => void;
  pinRef: () => void;
  clearRef: () => void;
  swapRef: () => void;
  /** remplace l'état complet (hydratation localStorage / URL) */
  load: (items: BuildItems, level: number, refItems?: BuildItems | null) => void;
}

export const useBuildStore = create<BuildState>((set, get) => ({
  items: {},
  level: MAX_LEVEL,
  refItems: null,
  activeCategory: SIM_CATEGORIES[0],
  activeSlot: null,

  setLevel: (level) => set({ level }),

  equip: (itemId, category) => {
    const { items, activeSlot } = get();
    const activeDef = SLOTS.find((s) => s.key === activeSlot);
    const target =
      activeDef?.category === category
        ? activeSlot!
        : freeSlotFor(category, items) ?? firstSlotOfCategory(category, items);
    if (!target) return;
    const next = { ...items, [target]: itemId };
    // avance le slot actif vers le prochain libre de la catégorie
    set({ items: next, activeSlot: freeSlotFor(category, next) ?? target });
  },

  remove: (slot) => {
    const items = { ...get().items };
    delete items[slot];
    set({ items });
  },

  reset: () => set({ items: {} }),

  selectSlot: (slot) => {
    const def = SLOTS.find((s) => s.key === slot);
    if (def) set({ activeSlot: slot, activeCategory: def.category });
  },

  selectCategory: (category) =>
    set((state) => ({
      activeCategory: category,
      activeSlot: firstSlotOfCategory(category, state.items),
    })),

  pinRef: () => set((state) => ({ refItems: { ...state.items } })),
  clearRef: () => set({ refItems: null }),
  swapRef: () =>
    set((state) =>
      state.refItems ? { items: state.refItems, refItems: { ...state.items } } : state,
    ),

  load: (items, level, refItems = null) => set({ items, level, refItems }),
}));
