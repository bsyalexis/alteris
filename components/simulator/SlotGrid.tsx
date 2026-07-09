"use client";

import { SLOTS } from "@/lib/engine";
import type { GameDataIndex } from "@/lib/engine";
import { itemImageUrl } from "@/lib/data/useGameData";
import { useBuildStore } from "@/lib/store/buildStore";

export function SlotGrid({ index }: { index: GameDataIndex }) {
  const items = useBuildStore((s) => s.items);
  const activeSlot = useBuildStore((s) => s.activeSlot);
  const selectSlot = useBuildStore((s) => s.selectSlot);
  const remove = useBuildStore((s) => s.remove);

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-4">
      {SLOTS.map((slot) => {
        const id = items[slot.key];
        const item = id != null ? index.byId.get(id) : undefined;
        const active = slot.key === activeSlot;
        const setName =
          item?.set != null ? index.sets[String(item.set)]?.n : undefined;
        const img = itemImageUrl(item?.img);
        return (
          <button
            key={slot.key}
            type="button"
            onClick={() => selectSlot(slot.key)}
            className={`panel flex min-h-[64px] items-center gap-2.5 p-2.5 text-left transition-transform hover:-translate-y-0.5 ${
              active ? "border-[var(--lime)] shadow-[inset_0_0_0_1px_var(--lime)]" : ""
            }`}
          >
            <span className="slot-ph flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-[var(--line)] text-xl">
              {item && img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={img} alt="" className="h-9 w-9" loading="lazy" />
              ) : (
                <span className={item ? "" : "opacity-50"}>{slot.emoji}</span>
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                {slot.label}
              </span>
              {item ? (
                <>
                  <span className="block truncate text-[13px] font-bold">{item.n}</span>
                  {setName && (
                    <span className="block truncate text-[10px] font-bold text-[var(--violet)]">
                      ◈ {setName}
                    </span>
                  )}
                </>
              ) : (
                <span className="block text-[13px] text-[var(--muted)]">Vide</span>
              )}
            </span>
            {item && (
              <span
                role="button"
                tabIndex={0}
                aria-label={`Retirer ${item.n}`}
                onClick={(e) => {
                  e.stopPropagation();
                  remove(slot.key);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.stopPropagation();
                    remove(slot.key);
                  }
                }}
                className="px-1 text-lg text-[var(--muted)] hover:text-[var(--red)]"
              >
                ✕
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
