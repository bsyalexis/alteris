"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FILTERABLE_STATS,
  SLOTS,
  effectValue,
  isHiddenEffect,
  itemStatValue,
  normalizeStatName,
} from "@/lib/engine";
import type { GameDataIndex, Item, SlotKey } from "@/lib/engine";
import { itemImageUrl } from "@/lib/data/useGameData";
import { useBuildStore } from "@/lib/store/buildStore";

const PAGE_SIZE = 80;

function effectSummary(item: Item, max: number): string {
  const parts = (item.e ?? [])
    .filter((e) => !isHiddenEffect(e[0]))
    .slice(0, max)
    .map((e) => `${effectValue(e)} ${e[0]}`);
  return parts.length ? parts.join(", ") : "—";
}

/** Sélecteur d'item en modal — markup du site d'origine (.modal/.modbox/.row) */
export function ItemPickerModal({
  index,
  slot,
  onClose,
}: {
  index: GameDataIndex;
  slot: SlotKey;
  onClose: () => void;
}) {
  const level = useBuildStore((s) => s.level);
  const items = useBuildStore((s) => s.items);
  const equipInSlot = useBuildStore((s) => s.equipInSlot);

  const [query, setQuery] = useState("");
  const [statFilter, setStatFilter] = useState("");
  const [limit, setLimit] = useState(PAGE_SIZE);

  const slotDef = SLOTS.find((s) => s.key === slot)!;
  const equippedIds = useMemo(() => new Set(Object.values(items)), [items]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const results = useMemo(() => {
    const q = normalizeStatName(query.trim());
    const list = index.items.filter((item) => {
      if (item.s !== slotDef.category) return false;
      if (item.l > level) return false;
      if (q && !normalizeStatName(item.n).includes(q)) return false;
      if (statFilter && itemStatValue(item, statFilter) <= 0) return false;
      return true;
    });
    if (statFilter) {
      return list.sort(
        (a, b) =>
          itemStatValue(b, statFilter) - itemStatValue(a, statFilter) ||
          b.l - a.l ||
          a.n.localeCompare(b.n, "fr"),
      );
    }
    return list.sort((a, b) => b.l - a.l || a.n.localeCompare(b.n, "fr"));
  }, [index, slotDef.category, level, query, statFilter]);

  const visible = results.slice(0, limit);

  return (
    <div className="modal open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modbox">
        <div className="hd">
          <h4>
            {slotDef.emoji} {slotDef.label} — choisir un item
          </h4>
          <button type="button" className="close" onClick={onClose}>
            ✕ Fermer
          </button>
        </div>
        <input
          className="search"
          autoFocus
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setLimit(PAGE_SIZE);
          }}
          placeholder="Rechercher un item…"
          autoComplete="off"
        />
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <select
            className="fsel"
            style={{ flex: 1 }}
            value={statFilter}
            onChange={(e) => {
              setStatFilter(e.target.value);
              setLimit(PAGE_SIZE);
            }}
          >
            <option value="">Filtrer par caractéristique…</option>
            {FILTERABLE_STATS.map((stat) => (
              <option key={stat} value={stat}>
                {stat}
              </option>
            ))}
          </select>
        </div>
        <div className="count">
          {results.length} item{results.length > 1 ? "s" : ""} · niv ≤ {level}
          {statFilter ? ` · triés par ${statFilter}` : ""}
        </div>
        <div className="list">
          {visible.map((item) => {
            const setName =
              item.set != null && item.set !== 0
                ? index.sets[String(item.set)]?.n
                : undefined;
            const img = itemImageUrl(item.img);
            const equipped = equippedIds.has(item.id);
            return (
              <div
                key={item.id}
                className="row"
                onClick={() => {
                  equipInSlot(slot, item.id);
                  onClose();
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    equipInSlot(slot, item.id);
                    onClose();
                  }
                }}
              >
                <div className="ph">
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img} alt="" width={34} height={34} loading="lazy" />
                  ) : (
                    slotDef.emoji
                  )}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div className="rn">
                    {equipped && <span className="up">✓ </span>}
                    {item.n}
                    {setName && <span className="rset"> · ◈ {setName}</span>}
                  </div>
                  <div className="rm">{effectSummary(item, 3)}</div>
                </div>
                <div className="lv">
                  {statFilter && (
                    <span className="up">+{itemStatValue(item, statFilter)} · </span>
                  )}
                  Niv {item.l}
                </div>
              </div>
            );
          })}
          {!results.length && <div className="emptot">Aucun item pour ce filtre.</div>}
          {results.length > limit && (
            <button
              type="button"
              className="btn"
              style={{ width: "100%" }}
              onClick={() => setLimit((l) => l + PAGE_SIZE)}
            >
              Afficher plus ({results.length - limit} restants)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
