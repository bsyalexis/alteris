"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { decodeBuild, encodeBuild, MAX_LEVEL, MIN_LEVEL, SLOTS } from "@/lib/engine";
import { useGameData } from "@/lib/data/useGameData";
import { useBuildStore } from "@/lib/store/buildStore";
import { ItemBrowser } from "./ItemBrowser";
import { SlotGrid } from "./SlotGrid";
import { StatsPanel } from "./StatsPanel";
import { SuggestPanel } from "./SuggestPanel";

function storageKey(version: string) {
  return `alteris_build_${version}`;
}
function refStorageKey(version: string) {
  return `alteris_ref_${version}`;
}

export function BuildSimulator() {
  const { index, error } = useGameData();
  const items = useBuildStore((s) => s.items);
  const level = useBuildStore((s) => s.level);
  const refItems = useBuildStore((s) => s.refItems);
  const setLevel = useBuildStore((s) => s.setLevel);
  const reset = useBuildStore((s) => s.reset);
  const load = useBuildStore((s) => s.load);

  const hydrated = useRef(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1800);
  }, []);

  // Hydratation : URL (#b=) prioritaire, sinon localStorage — une seule fois, données prêtes
  useEffect(() => {
    if (!index || hydrated.current) return;
    hydrated.current = true;

    const isValid = (id: number) => index.byId.has(id);
    let next: ReturnType<typeof decodeBuild> = null;
    if (window.location.hash.includes("b=")) {
      next = decodeBuild(window.location.hash, isValid);
    }
    if (!next) {
      try {
        const saved = localStorage.getItem(storageKey(index.version));
        if (saved) next = decodeBuild(saved, isValid);
      } catch {
        /* localStorage indisponible */
      }
    }
    let ref: ReturnType<typeof decodeBuild> = null;
    try {
      const savedRef = localStorage.getItem(refStorageKey(index.version));
      if (savedRef) ref = decodeBuild(savedRef, isValid);
    } catch {
      /* noop */
    }
    if (next || ref) load(next?.items ?? {}, next?.level ?? MAX_LEVEL, ref?.items ?? null);
  }, [index, load]);

  // Persistance localStorage à chaque changement
  useEffect(() => {
    if (!index || !hydrated.current) return;
    try {
      localStorage.setItem(storageKey(index.version), encodeBuild({ level, items }));
      if (refItems) {
        localStorage.setItem(
          refStorageKey(index.version),
          encodeBuild({ level, items: refItems }),
        );
      } else {
        localStorage.removeItem(refStorageKey(index.version));
      }
    } catch {
      /* noop */
    }
  }, [index, items, level, refItems]);

  const copy = useCallback(
    (text: string, message: string) => {
      if (!navigator.clipboard) {
        showToast("Copie non supportée");
        return;
      }
      navigator.clipboard.writeText(text).then(
        () => showToast(message),
        () => showToast("Copie impossible"),
      );
    },
    [showToast],
  );

  const shareUrl = useCallback(() => {
    const code = encodeBuild({ level, items });
    const url = `${window.location.origin}${window.location.pathname}#b=${code}`;
    window.history.replaceState(null, "", `#b=${code}`);
    return url;
  }, [items, level]);

  const discordText = useCallback(() => {
    const lines = ["⚔️ Build Altéris"];
    for (const slot of SLOTS) {
      const id = items[slot.key];
      const item = id != null ? index?.byId.get(id) : undefined;
      if (item) lines.push(`• ${slot.label} : ${item.n}`);
    }
    if (lines.length === 1) lines.push("(build vide)");
    lines.push(shareUrl());
    return lines.join("\n");
  }, [index, items, shareUrl]);

  if (error) {
    return (
      <div className="panel p-8 text-center text-[var(--red)]">
        Impossible de charger les données du jeu : {error}
      </div>
    );
  }
  if (!index) {
    return (
      <div className="panel p-8 text-center text-[var(--muted)]">
        Chargement des items…
      </div>
    );
  }

  const equippedCount = Object.keys(items).length;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-2xl font-extrabold">
          Simulateur de <span className="text-[var(--lime-bright)]">build</span>
        </h1>
        <div className="flex min-w-[260px] flex-1 items-center gap-2.5 sm:max-w-md">
          <label htmlFor="lvlrange" className="text-sm text-[var(--muted)]">
            Niv&nbsp;max
          </label>
          <input
            id="lvlrange"
            type="range"
            min={MIN_LEVEL}
            max={MAX_LEVEL}
            step={1}
            list="lvlticks"
            value={level}
            onChange={(e) => setLevel(Number(e.target.value))}
            className="min-w-0 flex-1 accent-[var(--lime)]"
          />
          <datalist id="lvlticks">
            {Array.from({ length: 10 }, (_, i) => (i + 1) * 20).map((v) => (
              <option key={v} value={v} />
            ))}
          </datalist>
          <input
            type="number"
            min={MIN_LEVEL}
            max={MAX_LEVEL}
            value={level}
            onChange={(e) =>
              setLevel(
                Math.max(MIN_LEVEL, Math.min(MAX_LEVEL, Number(e.target.value) || MAX_LEVEL)),
              )
            }
            className="w-16 rounded-lg border-2 border-[var(--line)] bg-[var(--panel2)] px-1.5 py-1.5 text-center font-extrabold text-white focus:border-[var(--lime)] focus:outline-none"
          />
        </div>
        <button type="button" className="btn" onClick={() => copy(shareUrl(), "Lien copié !")}>
          🔗 Copier le lien
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => copy(discordText(), "Texte Discord copié !")}
        >
          💬 Discord
        </button>
        <button
          type="button"
          className="btn danger"
          onClick={() => {
            reset();
            showToast("Build vidé");
          }}
        >
          ✕ Reset
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-5">
          <SuggestPanel index={index} onSuggested={showToast} />
          <SlotGrid index={index} />
          <ItemBrowser index={index} />
        </div>
        <StatsPanel index={index} equippedCount={equippedCount} />
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-[var(--lime)] bg-[var(--panel2)] px-4 py-2 text-sm font-semibold">
          {toast}
        </div>
      )}
    </div>
  );
}
