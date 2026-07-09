/**
 * Types et helpers du diff de patch (data/diff.json, produit par capture.mjs).
 * Phase 5 du MVP : ces données passeront en DB (Patch / PatchChange).
 */

export interface PatchEffectMod {
  name: string;
  minF: number;
  maxF: number;
  minT: number;
  maxT: number;
}

export interface PatchEffect {
  name?: string;
  formatted?: string;
}

export interface PatchAddedItem {
  name: string;
  type?: string;
  level?: number;
  dataUri?: string;
}

export interface PatchChangedItem {
  name: string;
  dataUri?: string;
  mods?: PatchEffectMod[];
  addE?: PatchEffect[];
  remE?: PatchEffect[];
}

export interface PatchDiff {
  from: { v: string; r: string };
  to: { v: string; r: string };
  summary: { added: number; removed: number; changed: number };
  added: PatchAddedItem[];
  removed: PatchAddedItem[];
  changed: PatchChangedItem[];
}

export type ChangeKind = "up" | "down" | "rem" | "neutre";

/** Classement d'un item modifié : renforcé, affaibli, mixte (rem) ou neutre */
export function classifyChange(change: PatchChangedItem): ChangeKind {
  let up = (change.addE?.length ?? 0) > 0;
  let down = (change.remE?.length ?? 0) > 0;
  for (const mod of change.mods ?? []) {
    if (mod.minT > mod.minF || mod.maxT > mod.maxF) up = true;
    if (mod.minT < mod.minF || mod.maxT < mod.maxF) down = true;
  }
  if (up && down) return "rem";
  if (up) return "up";
  if (down) return "down";
  return "neutre";
}

export function bucketChanges(changes: PatchChangedItem[]): {
  up: PatchChangedItem[];
  down: PatchChangedItem[];
  mixed: PatchChangedItem[];
} {
  const up: PatchChangedItem[] = [];
  const down: PatchChangedItem[] = [];
  const mixed: PatchChangedItem[] = [];
  for (const change of changes) {
    const kind = classifyChange(change);
    if (kind === "up") up.push(change);
    else if (kind === "down") down.push(change);
    else if (kind === "rem") mixed.push(change);
  }
  return { up, down, mixed };
}
