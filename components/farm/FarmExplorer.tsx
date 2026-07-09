"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BRACKETS,
  ELEMENT_CSS_VAR,
  ELEMENT_KEYS,
  ELEMENT_LABEL,
  KAMAS_PRINCIPLES,
  KAMAS_SPOTS,
  allFamilies,
  isDungeon,
  weakestElement,
} from "@/lib/data/farm";
import type { ElementKey, FarmData, Zone } from "@/lib/data/farm";

type Mode = "xp" | "fam" | "kamas";

function ZoneCard({
  zone,
  rank,
  element,
  note,
}: {
  zone: Zone;
  rank: number;
  element: ElementKey;
  note?: string;
}) {
  const [open, setOpen] = useState(false);
  const weak = weakestElement(zone);
  const monsters = useMemo(
    () => [...zone.mons].sort((a, b) => a.r[element] - b.r[element]),
    [zone, element],
  );
  return (
    <div className="panel mb-2 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 p-3 text-left"
      >
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--panel2)] font-extrabold text-[var(--lime-bright)]">
          {rank}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold">{zone.n}</span>
          <span className="block text-xs text-[var(--muted)]">
            Niv {zone.lvl} · {zone.cnt} monstres
            {zone.fams?.length ? ` · 👹 ${zone.fams.join(", ")}` : ""}
            {note ? <span dangerouslySetInnerHTML={{ __html: note }} /> : null}
            {" · faible "}
            <b style={{ color: ELEMENT_CSS_VAR[weak] }}>{ELEMENT_LABEL[weak]}</b>
          </span>
        </span>
        <span className="hidden flex-shrink-0 gap-1 sm:flex">
          {ELEMENT_KEYS.map((key) => (
            <span
              key={key}
              className={`rounded-md px-1.5 py-0.5 text-center text-[11px] font-bold ${
                key === element ? "bg-[var(--panel2)] ring-1 ring-[var(--line)]" : ""
              }`}
              style={{ color: ELEMENT_CSS_VAR[key] }}
            >
              <small className="block text-[9px] opacity-80">{ELEMENT_LABEL[key]}</small>
              {zone.res[key] > 0 ? "+" : ""}
              {zone.res[key]}
            </span>
          ))}
        </span>
      </button>
      {open && (
        <div className="border-t border-[var(--line)] px-3 py-2">
          {monsters.map((m, i) => (
            <div key={i} className="flex items-center gap-2 py-0.5 text-[13px]">
              <span className="min-w-0 flex-1 truncate font-semibold">{m.n}</span>
              {m.fm && (
                <span className="hidden text-[11px] text-[var(--muted)] sm:inline">
                  {m.fm}
                </span>
              )}
              <span className="text-[11px] text-[var(--muted)]">niv {m.l}</span>
              <span
                className="w-16 text-right text-[12px] font-bold"
                style={{ color: ELEMENT_CSS_VAR[element] }}
              >
                {m.r[element] > 0 ? "+" : ""}
                {m.r[element]} rés
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-bold transition-colors ${
        active
          ? "border-[var(--lime)] text-[var(--lime-bright)]"
          : "border-[var(--line)] text-[var(--muted)] hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

let cache: FarmData | null = null;

export function FarmExplorer() {
  const [data, setData] = useState<FarmData | null>(cache);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("xp");
  const [element, setElement] = useState<ElementKey>("f");
  const [bracket, setBracket] = useState(0);
  const [family, setFamily] = useState<string>("");

  useEffect(() => {
    if (cache) return;
    fetch("/data/zones.json")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<FarmData>;
      })
      .then((d) => {
        cache = d;
        setData(d);
      })
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "Erreur de chargement"),
      );
  }, []);

  const families = useMemo(() => (data ? allFamilies(data.zones) : []), [data]);
  const activeFamily = family || families[0] || "";

  if (error)
    return (
      <div className="panel p-8 text-center text-[var(--red)]">
        Impossible de charger les zones : {error}
      </div>
    );
  if (!data)
    return (
      <div className="panel p-8 text-center text-[var(--muted)]">
        Chargement des zones…
      </div>
    );

  const [, lo, hi] = BRACKETS[bracket];
  const inBracket = data.zones
    .filter((z) => z.lvl >= lo && z.lvl <= hi)
    .sort((a, b) => a.res[element] - b.res[element]);
  const bash = inBracket.filter((z) => !isDungeon(z)).slice(0, 3);
  const dungeons = inBracket.filter(isDungeon).slice(0, 2);

  const familyZones =
    mode === "fam"
      ? data.zones
          .map((z) => ({ zone: z, count: z.mons.filter((m) => m.fm === activeFamily).length }))
          .filter((o) => o.count > 0)
          .sort((a, b) => b.count - a.count || a.zone.lvl - b.zone.lvl)
          .slice(0, 12)
      : [];

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        <Pill active={mode === "xp"} onClick={() => setMode("xp")}>
          ⚔️ XP par élément
        </Pill>
        <Pill active={mode === "fam"} onClick={() => setMode("fam")}>
          👹 Par famille
        </Pill>
        <Pill active={mode === "kamas"} onClick={() => setMode("kamas")}>
          💰 Kamas
        </Pill>
      </div>

      {mode === "xp" && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {ELEMENT_KEYS.map((key) => (
            <Pill key={key} active={element === key} onClick={() => setElement(key)}>
              <span
                className="mr-1 inline-block h-2 w-2 rounded-full"
                style={{ background: ELEMENT_CSS_VAR[key] }}
              />
              {ELEMENT_LABEL[key]}
            </Pill>
          ))}
        </div>
      )}

      {mode !== "fam" && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {BRACKETS.map((b, i) => (
            <Pill key={b[0]} active={bracket === i} onClick={() => setBracket(i)}>
              {b[0]}
            </Pill>
          ))}
        </div>
      )}

      {mode === "fam" && (
        <div className="mb-4">
          <select
            value={activeFamily}
            onChange={(e) => setFamily(e.target.value)}
            className="w-64 rounded-lg border border-[var(--line)] bg-[var(--panel2)] px-2 py-2 text-sm text-white"
          >
            {families.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </div>
      )}

      {mode === "xp" && (
        <>
          <p className="mb-4 text-[13px] text-[var(--muted)]">
            Résistance <b className="text-white">basse ou négative</b> dans ton élément =
            plus de dégâts = kills plus rapides. <b className="text-white">3 zones à bash
            + 1-2 donjons</b> par palier ; clique une zone pour voir chaque monstre.
          </p>
          <h2 className="mb-2 text-[15px] font-extrabold">
            Zones à bash <span className="chip pos align-middle">{bash.length}</span>
          </h2>
          {bash.length ? (
            bash.map((z, i) => <ZoneCard key={z.id} zone={z} rank={i + 1} element={element} />)
          ) : (
            <div className="panel p-5 text-center text-sm text-[var(--muted)]">
              Aucune zone de bashing dans ce palier.
            </div>
          )}
          <h2 className="mb-2 mt-6 text-[15px] font-extrabold">
            🏆 Donjons <span className="chip pos align-middle">{dungeons.length}</span>
          </h2>
          {dungeons.length ? (
            dungeons.map((z, i) => (
              <ZoneCard key={z.id} zone={z} rank={i + 1} element={element} />
            ))
          ) : (
            <div className="panel p-5 text-center text-sm text-[var(--muted)]">
              Aucun donjon répertorié dans ce palier.
            </div>
          )}
          <p className="mt-6 text-xs text-[var(--muted)]">
            Bestiaire & zones : DofusDB. Résistances = moyenne des monstres de la zone
            (grade max).
          </p>
        </>
      )}

      {mode === "fam" && (
        <>
          <p className="mb-4 text-[13px] text-[var(--muted)]">
            👹 Zones où la famille <b className="text-white">{activeFamily}</b> est la plus
            présente — les groupes les plus purs. Idéal pour ressources, quêtes de famille
            ou XP ciblée.
          </p>
          {familyZones.length ? (
            familyZones.map((o, i) => (
              <ZoneCard
                key={o.zone.id}
                zone={o.zone}
                rank={i + 1}
                element={element}
                note={` · <b style="color:var(--violet)">${o.count}</b> de la famille`}
              />
            ))
          ) : (
            <div className="panel p-5 text-center text-sm text-[var(--muted)]">
              Aucune zone pour cette famille.
            </div>
          )}
        </>
      )}

      {mode === "kamas" && (
        <>
          <p className="mb-4 text-[13px] text-[var(--muted)]">
            💰 <b className="text-white">Pistes communautaires</b> (zones réelles), 3 par
            palier. La valeur exacte dépend des prix HDV de ton serveur — utilise{" "}
            <a
              href="https://geneka.net/drops"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--lime-bright)]"
            >
              geneka.net/drops
            </a>{" "}
            pour un kamas/h calibré.
          </p>
          <div className="space-y-2">
            {(KAMAS_SPOTS[bracket] ?? []).map((spot, i) => (
              <div key={i} className="panel flex items-center gap-3 p-3">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--panel2)] font-extrabold text-[var(--gold)]">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-bold">{spot[0]}</div>
                  <div className="text-xs text-[var(--muted)]">
                    {spot[1]} — {spot[2]}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <h2 className="mb-2 mt-6 text-[15px] font-extrabold">
            Principes qui marchent à tous les niveaux
          </h2>
          <ul className="panel list-disc space-y-1.5 p-4 pl-8 text-[13px] leading-relaxed text-[#ddd8cf]">
            {KAMAS_PRINCIPLES.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
