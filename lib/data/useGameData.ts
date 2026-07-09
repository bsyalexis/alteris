"use client";

import { useEffect, useState } from "react";
import { createIndex } from "@/lib/engine";
import type { GameData, GameDataIndex } from "@/lib/engine";

interface GameDataState {
  index: GameDataIndex | null;
  error: string | null;
}

let cache: GameDataIndex | null = null;

/**
 * Charge le jeu de données items/panoplies (JSON statique servi par l'app)
 * et construit l'index du moteur. Une seule fois par session (cache module).
 * Phase 2 : ce hook pointera vers /api/items?version=... (données en DB).
 */
export function useGameData(): GameDataState {
  const [state, setState] = useState<GameDataState>({
    index: cache,
    error: null,
  });

  useEffect(() => {
    if (cache) return;
    let cancelled = false;
    fetch("/data/picker.json")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<GameData>;
      })
      .then((data) => {
        cache = createIndex(data);
        if (!cancelled) setState({ index: cache, error: null });
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setState({
            index: null,
            error: err instanceof Error ? err.message : "Erreur de chargement",
          });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

export function itemImageUrl(img: number | undefined): string | null {
  return img ? `https://api.dofusdu.de/dofus3/v1/img/item/${img}-64.png` : null;
}
