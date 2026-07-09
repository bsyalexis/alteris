"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { decodeBuild, encodeBuild, MAX_LEVEL, MIN_LEVEL, SLOTS } from "@/lib/engine";
import type { SlotKey } from "@/lib/engine";
import { useGameData } from "@/lib/data/useGameData";
import { useBuildStore } from "@/lib/store/buildStore";
import { ItemPickerModal } from "./ItemPickerModal";
import { SlotGrid } from "./SlotGrid";
import { StatsPanel } from "./StatsPanel";
import { SuggestModal } from "./SuggestPanel";

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
  const [pickerSlot, setPickerSlot] = useState<SlotKey | null>(null);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1800);
  }, []);

  // Hydratation : URL (#b=) prioritaire, sinon localStorage — une seule fois
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

  // Persistance localStorage
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
    window.history.replaceState(null, "", `#b=${code}`);
    return `${window.location.origin}${window.location.pathname}#b=${code}`;
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
    return <div className="empty">Impossible de charger les données du jeu : {error}</div>;
  }
  if (!index) {
    return <div className="empty">Chargement des items…</div>;
  }

  const clampLevel = (v: number) => Math.max(MIN_LEVEL, Math.min(MAX_LEVEL, v || MAX_LEVEL));

  return (
    <div className="view-anim">
      <header>
        <h1>
          Simulateur de <span className="accent">build</span>
        </h1>
        <p className="tagline">
          Assemble ton stuff, bonus de panoplie inclus. Survole une stat pour voir qui
          apporte quoi.
        </p>
      </header>

      <div className="toolbar">
        <div className="lvlwrap">
          <label htmlFor="lvlrange">Niv max</label>
          <input
            id="lvlrange"
            type="range"
            min={MIN_LEVEL}
            max={MAX_LEVEL}
            value={level}
            onChange={(e) => setLevel(Number(e.target.value))}
          />
          <input
            id="lvlnum"
            type="number"
            min={MIN_LEVEL}
            max={MAX_LEVEL}
            value={level}
            onChange={(e) => setLevel(clampLevel(Number(e.target.value)))}
          />
        </div>
        <button type="button" className="btn" onClick={() => setSuggestOpen(true)}>
          ⚙ Suggérer
        </button>
        <button type="button" className="btn" onClick={() => copy(shareUrl(), "Lien copié !")}>
          🔗 Lien
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
          Tout retirer
        </button>
      </div>

      <div className="layout">
        <SlotGrid index={index} onPick={setPickerSlot} />
        <StatsPanel index={index} equippedCount={Object.keys(items).length} />
      </div>

      {pickerSlot && (
        <ItemPickerModal index={index} slot={pickerSlot} onClose={() => setPickerSlot(null)} />
      )}
      {suggestOpen && (
        <SuggestModal
          index={index}
          onClose={() => setSuggestOpen(false)}
          onSuggested={showToast}
        />
      )}

      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 50,
            background: "var(--panel2)",
            border: "2px solid var(--lime)",
            borderRadius: 10,
            padding: "8px 16px",
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
