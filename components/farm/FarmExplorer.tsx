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

/** Carte de zone — markup d'origine (.zone/.zhead/.zrank/.zres/.rchip/.zmons/.zmon) */
function ZoneCard({
  zone,
  rank,
  element,
  note,
}: {
  zone: Zone;
  rank: number;
  element: ElementKey;
  note?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const weak = weakestElement(zone);
  const monsters = useMemo(
    () => [...zone.mons].sort((a, b) => a.r[element] - b.r[element]),
    [zone, element],
  );
  return (
    <div className={`zone ${open ? "open" : ""}`}>
      <div
        className="zhead"
        onClick={() => setOpen((o) => !o)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setOpen((o) => !o);
        }}
      >
        <div className="zrank">{rank}</div>
        <div className="zmain">
          <div className="zname">{zone.n}</div>
          <div className="zmeta">
            Niv {zone.lvl} · {zone.cnt} monstres
            {zone.fams?.length ? ` · 👹 ${zone.fams.join(", ")}` : ""}
            {note}
            {" · faible "}
            <b style={{ color: ELEMENT_CSS_VAR[weak] }}>{ELEMENT_LABEL[weak]}</b>
          </div>
        </div>
        <div className="zres">
          {ELEMENT_KEYS.map((key) => (
            <div
              key={key}
              className={`rchip ${key === element ? "sel" : ""}`}
              style={{ color: ELEMENT_CSS_VAR[key] }}
            >
              <small>{ELEMENT_LABEL[key]}</small>
              {zone.res[key] > 0 ? "+" : ""}
              {zone.res[key]}
            </div>
          ))}
        </div>
      </div>
      <div className="zmons">
        {monsters.map((m, i) => (
          <div key={i} className="zmon">
            <span className="zmn">{m.n}</span>
            {m.fm && <span className="zml">{m.fm}</span>}
            <span className="zml">niv {m.l}</span>
            <span className="zmr" style={{ color: ELEMENT_CSS_VAR[element] }}>
              {m.r[element] > 0 ? "+" : ""}
              {m.r[element]} rés
            </span>
          </div>
        ))}
      </div>
    </div>
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

  if (error) return <div className="empty">Impossible de charger les zones : {error}</div>;
  if (!data) return <div className="empty">Chargement des zones…</div>;

  const [, lo, hi] = BRACKETS[bracket];
  const inBracket = data.zones
    .filter((z) => z.lvl >= lo && z.lvl <= hi)
    .sort((a, b) => a.res[element] - b.res[element]);
  const bash = inBracket.filter((z) => !isDungeon(z)).slice(0, 3);
  const dungeons = inBracket.filter(isDungeon).slice(0, 2);

  const familyZones =
    mode === "fam"
      ? data.zones
          .map((z) => ({
            zone: z,
            count: z.mons.filter((m) => m.fm === activeFamily).length,
          }))
          .filter((o) => o.count > 0)
          .sort((a, b) => b.count - a.count || a.zone.lvl - b.zone.lvl)
          .slice(0, 12)
      : [];

  return (
    <>
      <div className="selectrow">
        <button
          type="button"
          className={`bp ${mode === "xp" ? "active" : ""}`}
          onClick={() => setMode("xp")}
        >
          ⚔️ XP par élément
        </button>
        <button
          type="button"
          className={`bp ${mode === "fam" ? "active" : ""}`}
          onClick={() => setMode("fam")}
        >
          👹 Par famille
        </button>
        <button
          type="button"
          className={`bp ${mode === "kamas" ? "active" : ""}`}
          onClick={() => setMode("kamas")}
        >
          💰 Kamas
        </button>
      </div>

      {mode === "xp" && (
        <div className="selectrow">
          {ELEMENT_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              className={`ep ${element === key ? "active" : ""}`}
              onClick={() => setElement(key)}
            >
              <span className="sw" style={{ background: ELEMENT_CSS_VAR[key] }} />
              {ELEMENT_LABEL[key]}
            </button>
          ))}
        </div>
      )}

      {mode !== "fam" && (
        <div className="selectrow">
          {BRACKETS.map((b, i) => (
            <button
              key={b[0]}
              type="button"
              className={`bp ${bracket === i ? "active" : ""}`}
              onClick={() => setBracket(i)}
            >
              {b[0]}
            </button>
          ))}
        </div>
      )}

      {mode === "fam" && (
        <div className="selectrow">
          <select
            className="fsel"
            value={activeFamily}
            onChange={(e) => setFamily(e.target.value)}
          >
            {families.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </div>
      )}

      {mode === "xp" && (
        <>
          <div className="farmnote">
            Résistance <b style={{ color: "var(--white)" }}>basse ou négative</b> dans ton
            élément = plus de dégâts = kills plus rapides.{" "}
            <b style={{ color: "var(--white)" }}>3 zones à bash + 1-2 donjons</b> par
            palier ; clique une zone pour voir chaque monstre.
          </div>
          <h2 style={{ fontSize: 15, margin: "4px 0 10px" }}>
            Zones à bash <span className="badge lime">{bash.length}</span>
          </h2>
          {bash.length ? (
            bash.map((z, i) => (
              <ZoneCard key={z.id} zone={z} rank={i + 1} element={element} />
            ))
          ) : (
            <div className="empty">Aucune zone de bashing dans ce palier.</div>
          )}
          <h2 style={{ fontSize: 15, margin: "22px 0 10px" }}>
            🏆 Donjons <span className="badge gold">{dungeons.length}</span>
          </h2>
          {dungeons.length ? (
            dungeons.map((z, i) => (
              <ZoneCard key={z.id} zone={z} rank={i + 1} element={element} />
            ))
          ) : (
            <div className="empty">Aucun donjon répertorié dans ce palier.</div>
          )}
          <footer>
            Bestiaire & zones : DofusDB. Résistances = moyenne des monstres de la zone
            (grade max).
          </footer>
        </>
      )}

      {mode === "fam" && (
        <>
          <div className="farmnote">
            👹 Zones où la famille{" "}
            <b style={{ color: "var(--white)" }}>{activeFamily}</b> est la plus présente —
            les groupes les plus purs. Idéal pour ressources, quêtes de famille ou XP
            ciblée. Clique une zone pour voir ses monstres.
          </div>
          <h2 style={{ fontSize: 15, margin: "4px 0 10px" }}>
            Meilleures zones · {activeFamily}{" "}
            <span className="badge vio">{familyZones.length}</span>
          </h2>
          {familyZones.length ? (
            familyZones.map((o, i) => (
              <ZoneCard
                key={o.zone.id}
                zone={o.zone}
                rank={i + 1}
                element={element}
                note={
                  <>
                    {" · "}
                    <b style={{ color: "var(--violet)" }}>{o.count}</b> de la famille
                  </>
                }
              />
            ))
          ) : (
            <div className="empty">Aucune zone pour cette famille.</div>
          )}
          <footer>Bestiaire & zones : DofusDB.</footer>
        </>
      )}

      {mode === "kamas" && (
        <>
          <div className="farmnote">
            💰 <b style={{ color: "var(--white)" }}>Pistes communautaires</b> (zones
            réelles), 3 par palier. La valeur kamas exacte dépend des prix HDV de ton
            serveur : utilise{" "}
            <a
              href="https://geneka.net/drops"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--lime-bright)" }}
            >
              geneka.net/drops
            </a>{" "}
            pour un kamas/h calibré.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {(KAMAS_SPOTS[bracket] ?? []).map((spot, i) => (
              <div key={i} className="zone">
                <div className="zhead" style={{ cursor: "default" }}>
                  <div className="zrank">{i + 1}</div>
                  <div className="zmain">
                    <div className="zname">{spot[0]}</div>
                    <div className="zmeta">
                      {spot[1]} — {spot[2]}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <h2 style={{ fontSize: 16, marginTop: 24 }}>
            Principes qui marchent à tous les niveaux
          </h2>
          <div className="empty" style={{ textAlign: "left", padding: "16px 18px" }}>
            <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8, color: "#ddd8cf" }}>
              {KAMAS_PRINCIPLES.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>
        </>
      )}
    </>
  );
}
