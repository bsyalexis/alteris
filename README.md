# Altéris — Outil pour Dofus

App Next.js : simulateur de build (moteur de calcul pur + suggesteur), impact des
patchs entre versions, routes de farm XP / familles / kamas.

**Mise à jour automatique quotidienne** : un workflow GitHub Actions vérifie chaque
jour la version du jeu (API dofusdude), met à jour `data/*.json` et pousse.
Vercel (connecté en Git) rebuild sur push.

## Démarrer

```bash
npm install
npm run dev     # http://localhost:3000
npm test        # tests du moteur (vitest)
```

## Structure

```
lib/engine/          # MOTEUR PUR — aucune dépendance React/DB/réseau
  stats.ts           # computeBuildStats, setBonus, effectValue
  compare.ts         # deltas entre deux builds
  suggest.ts         # suggesteur de build (caps PA 12 / PM 6, panoplies)
  statOrder.ts       # ordre canonique des stats, tableau élémentaire
  encode.ts          # liens de partage (compatibles anciens liens #b=)
lib/store/           # état du simulateur (zustand)
lib/data/            # chargement données + types patch/farm
components/          # UI : simulator/, farm/
app/                 # pages : / , /simulateur , /patchs , /farm
build/capture.mjs    # capture dofusdude -> data/*.json (pipeline quotidien)
scripts/sync-data.mjs# data/ -> public/data/ (lancé par prebuild)
data/                # données commitées (servent au diff entre versions)
```

## Règles

- **Tout calcul de stats passe par `lib/engine`** — jamais dans les composants.
- Le format des liens de partage (`lvl!id.id...`) est figé : les anciens liens
  du site restent valides.
- `public/data/` est généré (gitignoré) — la source de vérité est `data/`.

## Roadmap (cf. alteris-mvp-architecture.md)

2. PostgreSQL + Prisma + ingestion — 3. Comptes (Auth Discord) + sauvegarde des
builds — 4. Partage `/b/[slug]` SSR + OG tags — 5. Patch tracking en DB +
avant/après par build.
