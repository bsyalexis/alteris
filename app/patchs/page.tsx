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
    return <span className="font-bold text-[var(--lime-bright)]">↑ +{to - from}</span>;
  if (to < from)
    return <span className="font-bold text-[var(--red)]">↓ {to - from}</span>;
  return <span className="text-[var(--muted)]">=</span>;
}

function ChangeRow({ change }: { change: PatchChangedItem }) {
  return (
    <div className="panel mb-2 flex items-start gap-3 p-3">
      {change.dataUri && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={change.dataUri} alt="" className="h-10 w-10 flex-shrink-0" />
      )}
      <div className="min-w-0">
        <div className="text-sm font-bold">{change.name}</div>
        {(change.mods ?? []).map((mod, i) => (
          <div key={i} className="text-[13px] text-[var(--muted)]">
            {mod.name} : {mod.minF}–{mod.maxF} →{" "}
            <strong className="text-white">
              {mod.minT}–{mod.maxT}
            </strong>{" "}
            (<Arrow from={mod.minF} to={mod.minT} /> /{" "}
            <Arrow from={mod.maxF} to={mod.maxT} />)
          </div>
        ))}
        {(change.addE ?? []).map((e, i) => (
          <div key={`a${i}`} className="text-[13px]">
            <span className="font-bold text-[var(--lime-bright)]">
              + {e.formatted ?? e.name}
            </span>{" "}
            <span className="text-[var(--muted)]">(nouvel effet)</span>
          </div>
        ))}
        {(change.remE ?? []).map((e, i) => (
          <div key={`r${i}`} className="text-[13px]">
            <span className="font-bold text-[var(--red)]">− {e.formatted ?? e.name}</span>{" "}
            <span className="text-[var(--muted)]">(retiré)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatTile({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="panel flex-1 p-4 text-center">
      <div className="text-2xl font-extrabold" style={{ color }}>
        {value}
      </div>
      <div className="mt-1 text-xs text-[var(--muted)]">{label}</div>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="panel p-5 text-center text-sm text-[var(--muted)]">{children}</div>
  );
}

export default function PatchsPage() {
  const { up, down } = bucketChanges(diff.changed ?? []);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-extrabold">
        Impact du <span className="text-[var(--lime-bright)]">patch</span>
      </h1>

      <div className="mt-4 flex items-center gap-3">
        <div className="panel px-4 py-2 font-extrabold">
          {diff.from.v}{" "}
          <small className="font-normal text-[var(--muted)]">{diff.from.r} (live)</small>
        </div>
        <span className="text-[var(--lime-bright)]">➜</span>
        <div className="panel border-[var(--gold)] px-4 py-2 font-extrabold">
          {diff.to.v}{" "}
          <small className="font-normal text-[var(--muted)]">{diff.to.r}</small>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <StatTile value={diff.summary.added} label="Nouveaux items" color="var(--gold)" />
        <StatTile value={up.length} label="Items renforcés" color="var(--lime-bright)" />
        <StatTile value={down.length} label="Items affaiblis" color="var(--red)" />
        <StatTile value={diff.summary.removed} label="Items retirés" color="var(--violet)" />
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-extrabold">
          ▲ Items renforcés{" "}
          <span className="chip pos align-middle">{up.length}</span>
        </h2>
        {up.length ? (
          up.map((c, i) => <ChangeRow key={i} change={c} />)
        ) : (
          <Empty>Aucun item renforcé dans ce patch.</Empty>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-extrabold">
          ▼ Items affaiblis <span className="chip neg align-middle">{down.length}</span>
        </h2>
        {down.length ? (
          down.map((c, i) => <ChangeRow key={i} change={c} />)
        ) : (
          <Empty>Aucun item affaibli dans ce patch.</Empty>
        )}
      </section>

      {(diff.summary.changed ?? 0) === 0 && (
        <Empty>
          <strong className="text-white">
            Ce patch ({diff.to.v}) ne rééquilibre aucun item.
          </strong>
          <br />
          Tous les patchs ne touchent pas les stats — ici, surtout de nouveaux items.
        </Empty>
      )}

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-extrabold">
          ✦ Nouveaux items{" "}
          <span className="chip pos align-middle">{diff.summary.added}</span>
        </h2>
        {diff.added.length ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {diff.added.map((item, i) => (
              <div key={i} className="panel flex items-center gap-3 p-3">
                {item.dataUri && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.dataUri} alt="" className="h-10 w-10 flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold">{item.name}</div>
                  <div className="text-xs text-[var(--muted)]">
                    {item.type ?? "Objet"}
                    {item.level ? ` · Niv ${item.level}` : ""}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty>Aucun nouvel item.</Empty>
        )}
      </section>

      <p className="mt-8 text-xs text-[var(--muted)]">
        Données : dofusdude / DofusDB · mise à jour quotidienne automatique.
      </p>
    </div>
  );
}
