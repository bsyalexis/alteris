import type { Metadata } from "next";
import diffJson from "@/data/diff.json";
import { bucketChanges } from "@/lib/data/patch";
import type { PatchChangedItem, PatchDiff } from "@/lib/data/patch";

export const metadata: Metadata = {
  title: "Patchs — Altéris",
  description: "Impact des patchs Dofus sur les items : nouveaux, renforcés, affaiblis.",
};

const diff = diffJson as unknown as PatchDiff;

function Arrow({ from, to }: { from: number; to: number }) {
  if (to > from)
    return <span className="font-extrabold text-[var(--lime-bright)]">↑ +{to - from}</span>;
  if (to < from)
    return <span className="font-extrabold text-[var(--red)]">↓ {to - from}</span>;
  return <span className="text-[var(--muted)]">=</span>;
}

function ChangeRow({ change, kind }: { change: PatchChangedItem; kind: "up" | "down" }) {
  return (
    <div className={`change ${kind}`}>
      {change.dataUri && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={change.dataUri} alt="" className="h-10 w-10 flex-shrink-0" />
      )}
      <div className="min-w-0">
        <div className="mb-1.5 text-[15px] font-bold">{change.name}</div>
        {(change.mods ?? []).map((mod, i) => (
          <div key={i} className="py-0.5 text-[13px] text-[#ddd8cf]">
            {mod.name} : {mod.minF}–{mod.maxF} →{" "}
            <strong className="text-white">
              {mod.minT}–{mod.maxT}
            </strong>{" "}
            (<Arrow from={mod.minF} to={mod.minT} /> /{" "}
            <Arrow from={mod.maxF} to={mod.maxT} />)
          </div>
        ))}
        {(change.addE ?? []).map((e, i) => (
          <div key={`a${i}`} className="py-0.5 text-[13px]">
            <span className="font-extrabold text-[var(--lime-bright)]">
              + {e.formatted ?? e.name}
            </span>{" "}
            <span className="text-[var(--muted)]">(nouvel effet)</span>
          </div>
        ))}
        {(change.remE ?? []).map((e, i) => (
          <div key={`r${i}`} className="py-0.5 text-[13px]">
            <span className="font-extrabold text-[var(--red)]">
              − {e.formatted ?? e.name}
            </span>{" "}
            <span className="text-[var(--muted)]">(retiré)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatTile({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="stat-tile" style={{ "--tile-color": color } as React.CSSProperties}>
      <div className="num">{value}</div>
      <div className="lbl">{label}</div>
    </div>
  );
}

export default function PatchsPage() {
  const { up, down } = bucketChanges(diff.changed ?? []);

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-5 text-center">
        <h1 className="text-[32px]">
          Impact du <span className="accent">patch</span>
        </h1>
        <p className="mx-auto mt-2 max-w-[620px] text-[15px] text-[var(--muted)]">
          Ce qui change entre deux versions du jeu, item par item.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <div className="pill">
            {diff.from.v}
            <small>{diff.from.r} (live)</small>
          </div>
          <span className="text-[22px] font-extrabold text-[var(--lime-bright)]">➜</span>
          <div className="pill beta">
            {diff.to.v}
            <small>{diff.to.r}</small>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile value={diff.summary.added} label="Nouveaux items" color="var(--gold)" />
        <StatTile value={up.length} label="Items renforcés" color="var(--lime-bright)" />
        <StatTile value={down.length} label="Items affaiblis" color="var(--red)" />
        <StatTile value={diff.summary.removed} label="Items retirés" color="var(--muted)" />
      </div>

      <section className="mt-8">
        <h2 className="mb-3 flex items-center gap-2 text-[19px]">
          ▲ Items renforcés <span className="badge lime">{up.length}</span>
        </h2>
        {up.length ? (
          up.map((c, i) => <ChangeRow key={i} change={c} kind="up" />)
        ) : (
          <div className="empty">Aucun item renforcé dans ce patch.</div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 flex items-center gap-2 text-[19px]">
          ▼ Items affaiblis <span className="badge red">{down.length}</span>
        </h2>
        {down.length ? (
          down.map((c, i) => <ChangeRow key={i} change={c} kind="down" />)
        ) : (
          <div className="empty">Aucun item affaibli dans ce patch.</div>
        )}
      </section>

      {(diff.summary.changed ?? 0) === 0 && (
        <div className="empty mt-4">
          <strong>Ce patch ({diff.to.v}) ne rééquilibre aucun item.</strong>
          <br />
          Tous les patchs ne touchent pas les stats — ici, surtout de nouveaux items.
        </div>
      )}

      <section className="mt-8">
        <h2 className="mb-3 flex items-center gap-2 text-[19px]">
          ✦ Nouveaux items <span className="badge gold">{diff.summary.added}</span>
        </h2>
        {diff.added.length ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {diff.added.map((item, i) => (
              <div key={i} className="panel card-hover flex items-center gap-3 p-3">
                {item.dataUri && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.dataUri}
                    alt=""
                    className="h-11 w-11 flex-shrink-0 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
                  />
                )}
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold">{item.name}</div>
                  <div className="mt-0.5 text-[11px] text-[var(--muted)]">
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
    </div>
  );
}
