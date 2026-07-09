/**
 * Synchronise les données du pipeline de capture vers l'app :
 * - picker.json, zones.json -> public/data/ (chargés côté client)
 * - diff.json, version.json -> data/    (importés côté serveur, build statique)
 *
 * Source : ./data (repo fusionné) ou ../alteris/data (dev côte à côte).
 * À lancer après chaque `npm run capture`. Phase 2 : remplacé par l'ingestion en DB.
 */
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = [resolve(root, "data"), resolve(root, "../alteris/data")].find((d) =>
  existsSync(resolve(d, "picker.json")),
);
if (!source) {
  console.error("Aucune source de données trouvée (data/ ou ../alteris/data/).");
  process.exit(1);
}

const copies = [
  ["picker.json", "public/data/picker.json"],
  ["zones.json", "public/data/zones.json"],
  ["diff.json", "data/diff.json"],
  ["version.json", "data/version.json"],
];

for (const [from, to] of copies) {
  const src = resolve(source, from);
  const dest = resolve(root, to);
  if (src === dest) continue; // déjà au bon endroit (repo fusionné)
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(src, dest);
  console.log(`OK: ${from} -> ${to}`);
}
