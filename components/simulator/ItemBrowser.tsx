"use client";

import { useMemo, useState } from "react";
import {
  FILTERABLE_STATS,
  SIM_CATEGORIES,
  effectValue,
  isHiddenEffect,
  itemStatValue,
  normalizeStatName,
} from "@/lib/engine";
import type { GameDataIndex, Item } from "@/lib/engine";
import { itemImageUrl } from "@/lib/data/useGameData";
import { useBuildStore } from "@/lib/store/buildStore";

const PAGE_SIZE = 60;

function effectSummary(item: Item, max: number): string {
  const parts = (item.e ?? [])
    .filter((e) => !isHiddenEffect(e[0]))
    .slice(0, max)
    .map((e) => `${effectValue(e)} ${e[0]}`);
  return parts.length ? parts.join(", ") : "—";
}

export function ItemBrowser({ index }: { index: GameDataIndex }) {
  const items = useBuildStore((s) => s.items);
  const level = useBuildStore((s) => s.level);
  const activeCategory = useBuildStore((s) => s.activeCategory);
  const selectCategory = useBuildStore((s) => s.selectCategory);
  const equip = useBuildStore((s) => s.equip);

  const [query, setQuery] = useState("");
  const [statFilter, setStatFilter] = useState<string>("");
  const [limit, setLimit] = useState(PAGE_SIZE);

  const equippedIds = useMemo(() => new Set(Object.values(items)), [items]);

  const results = useMemo(() => {
    const q = normalizeStatName(query.trim());
    const list = index.items.filter((item) => {
      if (item.s !== activeCategory) return false;
      if (item.l > level) return false;
      if (q && !normalizeStatName(item.n).includes(q)) return false;
      if (statFilter && itemStatValue(item, statFilter) <= 0) return false;
      return true;
    });
    if (statFilter) {
      // tri par valeur de la stat filtrée, décroissant
      return list.sort(
        (a, b) =>
          itemStatValue(b, statFilter) - itemStatValue(a, statFilter) ||
          b.l - a.l ||
          a.n.localeCompare(b.n, "fr"),
      );
    }
    return list.sort((a, b) => b.l - a.l || a.n.localeCompare(b.n, "fr"));
  }, [index, activeCategory, level, query, statFilter]);

  const visible = results.slice(0, limit);

  return (
    <section className="panel p-4">
      <div className="mb-3 flex flex-wrap gap-1.5">
        {SIM_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => {
              selectCategory(cat);
              setLimit(PAGE_SIZE);
            }}
            className={`rounded-full border px-3 py-1 text-xs font-bold transition-colors ${
              cat === activeCategory
                ? "border-[var(--lime)] text-[var(--lime-bright)]"
                : "border-[var(--line)] text-[var(--muted)] hover:text-white"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="mb-3 flex gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setLimit(PAGE_SIZE);
          }}
          placeholder={`Rechercher (${activeCategory.toLowerCase()}, niv ≤ ${level})…`}
          className="min-w-0 flex-1 rounded-lg border border-[var(--line)] bg-[var(--panel2)] px-3 py-2 text-sm text-white placeholder:text-[var(--muted)]"
        />
        <select
          value={statFilter}
          onChange={(e) => {
            setStatFilter(e.target.value);
            setLimit(PAGE_SIZE);
          }}
          className={`w-44 flex-shrink-0 rounded-lg border bg-[var(--panel2)] px-2 py-2 text-sm ${
            statFilter
              ? "border-[var(--lime)] text-[var(--lime-bright)]"
              : "border-[var(--line)] text-[var(--muted)]"
          }`}
        >
          <option value="">Toutes les stats</option>
          {FILTERABLE_STATS.map((stat) => (
            <option key={stat} value={stat}>
              {stat}
            </option>
          ))}
        </select>
      </div>

      <div className="max-h-[420px] space-y-1 overflow-y-auto pr-1">
        {visible.map((item) => {
          const equipped = equippedIds.has(item.id);
          const setName =
            item.set != null && item.set !== 0
              ? index.sets[String(item.set)]?.n
              : undefined;
          const img = itemImageUrl(item.img);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => equip(item.id, item.s)}
              className={`flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left transition-colors hover:border-[var(--lime)] ${
                equipped
                  ? "border-[var(--lime)] bg-[var(--panel2)]"
                  : "border-transparent"
              }`}
            >
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--panel2)]">
                {img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img} alt="" className="h-8 w-8" loading="lazy" />
                ) : (
                  "◆"
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-bold">
                  {equipped && <span className="text-[var(--lime-bright)]">✓ </span>}
                  {item.n}
                </span>
                <span className="block truncate text-[11px] text-[var(--muted)]">
                  {setName && (
                    <span className="text-[var(--violet)]">◈ {setName} · </span>
                  )}
                  {effectSummary(item, 3)}
                </span>
              </span>
              {statFilter && (
                <span className="flex-shrink-0 text-[13px] font-bold text-[var(--lime-bright)]">
                  +{itemStatValue(item, statFilter)}
                </span>
              )}
              <span className="flex-shrink-0 text-[11px] font-bold text-[var(--muted)]">
                Niv {item.l}
              </span>
            </button>
          );
        })}
        {!results.length && (
          <div className="py-8 text-center text-sm text-[var(--muted)]">
            Aucun item pour ce filtre.
          </div>
        )}
        {results.length > limit && (
          <button
            type="button"
            className="btn w-full justify-center"
            onClick={() => setLimit((l) => l + PAGE_SIZE)}
          >
            Afficher plus ({results.length - limit} restants)
          </button>
        )}
      </div>
    </section>
  );
}
