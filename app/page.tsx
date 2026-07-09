import Link from "next/link";
import diffJson from "@/data/diff.json";
import { CountUp } from "@/components/CountUp";
import { bucketChanges } from "@/lib/data/patch";
import type { PatchChangedItem, PatchDiff } from "@/lib/data/patch";

const diff = diffJson as unknown as PatchDiff;

function Arrow({ from, to }: { from: number; to: number }) {
  if (to > from) return <span className="up">↑ +{to - from}</span>;
  if (to < from) return <span className="down">↓ {to - from}</span>;
  return <>=</>;
}

function ChangeRow({ change, kind }: { change: PatchChangedItem; kind: "up" | "down" }) {
  return (
    <div className={`change ${kind}`}>
      {change.dataUri && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={change.dataUri} alt="" style={{ width: 40, height: 40 }} />
      )}
      <div>
        <div className="nm">{change.name}</div>
        {(change.mods ?? []).map((mod, i) => (
          <div key={i} className="eff">
            {mod.name} : {mod.minF}–{mod.maxF} →{" "}
            <strong>
              {mod.minT}–{mod.maxT}
            </strong>{" "}
            (<Arrow from={mod.minF} to={mod.minT} /> /{" "}
            <Arrow from={mod.maxF} to={mod.maxT} />)
          </div>
        ))}
        {(change.addE ?? []).map((e, i) => (
          <div key={`a${i}`} className="eff">
            <span className="up">+ {e.formatted ?? e.name}</span> (nouvel effet)
          </div>
        ))}
        {(change.remE ?? []).map((e, i) => (
          <div key={`r${i}`} className="eff">
            <span className="down">− {e.formatted ?? e.name}</span> (retiré)
          </div>
        ))}
      </div>
    </div>
  );
}

const SYNTH: { item: PatchChangedItem; kind: "up" | "down" }[] = [
  {
    kind: "up",
    item: {
      name: "Item exemple A",
      mods: [
        { name: "Force", minF: 20, minT: 35, maxF: 40, maxT: 60 },
        { name: "Vitalité", minF: 50, minT: 80, maxF: 50, maxT: 80 },
      ],
    },
  },
  {
    kind: "down",
    item: {
      name: "Item exemple B",
      mods: [{ name: "Puissance", minF: 15, minT: 8, maxF: 30, maxT: 15 }],
      remE: [{ name: "20 Sagesse" }],
    },
  },
];

export default function HomePage() {
  const { up, down } = bucketChanges(diff.changed ?? []);

  return (
    <div className="view-anim">
      <header>
        <h1>
          Impact des <span className="accent">patchs</span>
        </h1>
        <p className="tagline">
          Le seul simulateur qui suit le temps : ce qui change entre deux versions du jeu,
          item par item.
        </p>
        <div className="vbar">
          <div className="pill">
            {diff.from.v}
            <small>{diff.from.r} (live)</small>
          </div>
          <div className="arrow">➜</div>
          <div className="pill beta">
            {diff.to.v}
            <small>{diff.to.r} (à venir)</small>
          </div>
        </div>
        <Link href="/simulateur" className="cta">
          ⚔️ Ouvrir le simulateur →
        </Link>
      </header>

      <div className="stats">
        <div className="stat added">
          <div className="num">
            <CountUp value={diff.summary.added} />
          </div>
          <div className="lbl">Nouveaux items</div>
        </div>
        <div className="stat up">
          <div className="num">
            <CountUp value={up.length} />
          </div>
          <div className="lbl">Items renforcés</div>
        </div>
        <div className="stat down">
          <div className="num">
            <CountUp value={down.length} />
          </div>
          <div className="lbl">Items affaiblis</div>
        </div>
        <div className="stat rem">
          <div className="num">
            <CountUp value={diff.summary.removed} />
          </div>
          <div className="lbl">Items retirés</div>
        </div>
      </div>

      <section>
        <h2>
          ▲ Items renforcés <span className="badge lime">{up.length}</span>
        </h2>
        {up.length ? (
          up.map((c, i) => <ChangeRow key={i} change={c} kind="up" />)
        ) : (
          <div className="empty">Aucun item renforcé dans ce patch.</div>
        )}
      </section>

      <section>
        <h2>
          ▼ Items affaiblis <span className="badge red">{down.length}</span>
        </h2>
        {down.length ? (
          down.map((c, i) => <ChangeRow key={i} change={c} kind="down" />)
        ) : (
          <div className="empty">Aucun item affaibli dans ce patch.</div>
        )}
      </section>

      {(diff.summary.changed ?? 0) === 0 && (
        <>
          <div className="empty" style={{ marginTop: 6 }}>
            <strong>Ce patch (beta {diff.to.v}) ne rééquilibre aucun item.</strong>
            <br />
            Tous les patchs ne touchent pas les stats — ici, surtout de nouveaux items.
          </div>
          <details className="synth">
            <summary>
              ▸ Voir à quoi ressemble le rendu buff / nerf (exemple synthétique)
            </summary>
            <div className="inner">
              <div className="note">
                ⚠️ Données inventées à titre d&apos;illustration — pas un vrai patch.
              </div>
              {SYNTH.map((s, i) => (
                <ChangeRow key={i} change={s.item} kind={s.kind} />
              ))}
            </div>
          </details>
        </>
      )}

      <section>
        <h2>
          ✦ Nouveaux items <span className="badge gold">{diff.summary.added}</span>
        </h2>
        {diff.added.length ? (
          <div className="grid">
            {diff.added.map((item, i) => (
              <div key={i} className="card">
                {item.dataUri && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.dataUri} alt="" />
                )}
                <div style={{ minWidth: 0 }}>
                  <div className="nm">{item.name}</div>
                  <div className="meta">
                    {item.type ?? "Objet"}
                    {item.level ? ` · Niv ${item.level}` : ""}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty">Aucun nouvel item.</div>
        )}
      </section>

      <footer>
        Données : dofusdude & DofusDB (APIs communautaires, non affiliées à Ankama) ·
        Dofus™ Ankama.
      </footer>
    </div>
  );
}
