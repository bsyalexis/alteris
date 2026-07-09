"use client";

import { SLOTS } from "@/lib/engine";
import type { GameDataIndex, SlotKey } from "@/lib/engine";
import { itemImageUrl } from "@/lib/data/useGameData";
import { useBuildStore } from "@/lib/store/buildStore";

/** Grille des 16 slots — markup du site d'origine (.slots/.slot/.ph/.info/.x) */
export function SlotGrid({
  index,
  onPick,
}: {
  index: GameDataIndex;
  onPick: (slot: SlotKey) => void;
}) {
  const items = useBuildStore((s) => s.items);
  const remove = useBuildStore((s) => s.remove);

  return (
    <div className="slots">
      {SLOTS.map((slot) => {
        const id = items[slot.key];
        const item = id != null ? index.byId.get(id) : undefined;
        const setName =
          item?.set != null && item.set !== 0 ? index.sets[String(item.set)]?.n : undefined;
        const img = itemImageUrl(item?.img);
        return (
          <div
            key={slot.key}
            className="slot"
            onClick={() => onPick(slot.key)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") onPick(slot.key);
            }}
          >
            <div className="ph" style={item ? undefined : { opacity: 0.5 }}>
              {item && img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={img} alt="" width={38} height={38} loading="lazy" />
              ) : (
                slot.emoji
              )}
            </div>
            <div className="info">
              <div className="slabel">{slot.label}</div>
              {item ? (
                <>
                  <div className="iname">{item.n}</div>
                  {setName && <div className="setdot">◈ {setName}</div>}
                </>
              ) : (
                <div className="iname" style={{ color: "var(--muted)" }}>
                  Vide
                </div>
              )}
            </div>
            {item && (
              <div
                className="x"
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
              >
                ✕
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
