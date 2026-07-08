#!/usr/bin/env node
/**
 * Altéris — capture de toute la donnée de jeu et génération des data/*.json.
 * Sources : dofusdude (items, sets, version) + DofusDB (bestiaire, sous-zones).
 * Zéro dépendance (Node 18+, fetch intégré).
 *
 * Produit :
 *   data/version.json  { version, release }
 *   data/picker.json   { version, items[], sets{} }   (simulateur)
 *   data/zones.json    { version, zones[] }            (routes de farm)
 *   data/diff.json     { from, to, summary, added, removed, changed }  (impact patch)
 *
 * Le diff compare la version courante à la PRÉCÉDENTE (data/picker.json commité).
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";

const DD = "https://api.dofusdu.de/dofus3/v1/fr";
const DD_BETA = "https://api.dofusdu.de/dofus3beta/v1/fr";
const DB = "https://api.dofusdb.fr";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(url, tries = 4) {
  for (let i = 1; i <= tries; i++) {
    try {
      const r = await fetch(url, { headers: { accept: "application/json", "user-agent": "Alteris/1.0" } });
      if (!r.ok) throw new Error("HTTP " + r.status);
      return await r.json();
    } catch (e) {
      if (i === tries) throw e;
      await sleep(300 * 2 ** i);
    }
  }
}

// ---- dofudude : pagination items/sets ----
async function ddPageAll(path, fields) {
  const all = [];
  let page = 1;
  while (true) {
    const url = `${DD}/${path}?page%5Bnumber%5D=${page}&page%5Bsize%5D=100&fields%5B${fields.key}%5D=${fields.val}`;
    const d = await getJson(url);
    const batch = d[fields.coll] || [];
    all.push(...batch);
    if (!d._links || !d._links.next || batch.length === 0) break;
    page++;
    await sleep(90);
  }
  return all;
}

// ---- dofudude : items d'équipement d'un canal (main/beta) ----
async function fetchEquip(base) {
  const all = [];
  let page = 1;
  while (true) {
    const url = `${base}/items/equipment?page%5Bnumber%5D=${page}&page%5Bsize%5D=100&fields%5Bitem%5D=effects,is_weapon,pods`;
    const d = await getJson(url);
    const b = d.items || [];
    all.push(...b);
    if (!d._links || !d._links.next || !b.length) break;
    page++;
    await sleep(90);
  }
  return all;
}

// ---- DofusDB : pagination $select ----
async function dbPageAll(coll, select) {
  const all = [];
  let skip = 0,
    total = 1;
  const sel = select.map((s) => "&$select[]=" + s).join("");
  while (skip < total) {
    const d = await getJson(`${DB}/${coll}?$limit=50&$skip=${skip}${sel}&lang=fr`);
    total = d.total;
    all.push(...d.data);
    skip += 50;
    if (!d.data.length) break;
    await sleep(70);
  }
  return all;
}

const SLOT = {
  Chapeau: "Coiffe", Cape: "Cape", Amulette: "Amulette", Anneau: "Anneau",
  Ceinture: "Ceinture", Bottes: "Bottes", Bouclier: "Bouclier",
  Dofus: "Dofus", Trophée: "Dofus", Prysmaradite: "Dofus",
  Familier: "Familier", Montilier: "Familier", Compagnon: "Familier",
  Muldo: "Familier", Volkorne: "Familier", Dragodinde: "Familier",
};
const slotOf = (it) => (it.is_weapon ? "Arme" : SLOT[it.type && it.type.name] || null);

async function main() {
  await mkdir("data", { recursive: true });

  // 1) version courante
  const meta = await getJson("https://api.dofusdu.de/dofus3/v1/meta/version");
  console.log("Version live:", meta.version);

  // 2) sets
  const rawSets = await ddPageAll("sets", { key: "set", val: "equipment_ids,effects", coll: "sets" });
  const sets = {};
  const itemSet = {};
  for (const s of rawSets) {
    const b = {};
    for (const k of Object.keys(s.effects || {}))
      if (s.effects[k]) b[k] = s.effects[k].map((e) => [e.type.name, e.int_minimum]);
    sets[s.ankama_id] = { n: s.name, b };
    for (const id of s.equipment_ids || []) itemSet[id] = s.ankama_id;
  }
  console.log("Panoplies:", Object.keys(sets).length);

  // 3) items d'équipement (full = pour le diff ; items = équipables pour le simulateur)
  const rawItems = await fetchEquip(DD);
  const iconOf = {};
  const full = [];
  const items = [];
  const usedSets = new Set();
  for (const it of rawItems) {
    const e = (it.effects || []).map((x) => [x.type.name, x.int_minimum, x.int_maximum]);
    iconOf[it.ankama_id] = it.image_urls && it.image_urls.icon;
    full.push({ id: it.ankama_id, n: it.name, t: it.type.name, l: it.level || 0, e });
    const s = slotOf(it);
    if (!s) continue;
    const setId = itemSet[it.ankama_id] || 0;
    if (setId) usedSets.add(setId);
    items.push({ id: it.ankama_id, n: it.name, t: it.type.name, l: it.level || 0, s, set: setId, e });
  }
  items.sort((a, b) => b.l - a.l || a.n.localeCompare(b.n));
  const outSets = {};
  for (const sid of usedSets) outSets[sid] = sets[sid];
  console.log("Items équipables:", items.length, "/ total", full.length);

  // 4) diff : patch réel si la version main a changé, sinon aperçu de la beta ("à venir")
  let diff;
  const prevVer = existsSync("data/version.json") ? JSON.parse(await readFile("data/version.json", "utf8")).version : null;
  const prevFull = existsSync("data/snapshot.json") ? JSON.parse(await readFile("data/snapshot.json", "utf8")) : null;
  if (prevFull && prevVer && prevVer !== meta.version) {
    diff = await buildDiff(prevFull, full, iconOf, prevVer, "préc.", meta.version, "live");
    console.log(`Patch réel ${prevVer} -> ${meta.version} : +${diff.summary.added} ~${diff.summary.changed}`);
  } else {
    try {
      const bMeta = await getJson("https://api.dofusdu.de/dofus3beta/v1/meta/version");
      const bRaw = await fetchEquip(DD_BETA);
      const bIcon = {};
      const bFull = bRaw.map((it) => {
        bIcon[it.ankama_id] = it.image_urls && it.image_urls.icon;
        return { id: it.ankama_id, n: it.name, t: it.type.name, l: it.level || 0,
          e: (it.effects || []).map((x) => [x.type.name, x.int_minimum, x.int_maximum]) };
      });
      diff = await buildDiff(full, bFull, bIcon, meta.version, "live", bMeta.version, "à venir");
      console.log(`Aperçu beta ${meta.version} -> ${bMeta.version} : +${diff.summary.added} ~${diff.summary.changed}`);
    } catch (e) {
      diff = { from: { v: meta.version, r: "live" }, to: { v: meta.version, r: "live" },
        summary: { added: 0, removed: 0, changed: 0 }, added: [], removed: [], changed: [] };
      console.log("Beta indisponible — diff vide.");
    }
  }

  // 5) bestiaire + zones (DofusDB)
  const mons = await dbPageAll("monsters", ["id", "name", "grades", "hideInBestiary"]);
  const M = {};
  for (const m of mons) {
    const g = m.grades || [];
    if (!g.length) continue;
    const t = g[g.length - 1];
    M[m.id] = { n: (m.name && m.name.fr) || "#" + m.id, lvl: t.level || 0, xp: t.gradeXp || 0,
      res: { t: t.earthResistance || 0, f: t.fireResistance || 0, e: t.waterResistance || 0, a: t.airResistance || 0, n: t.neutralResistance || 0 },
      hide: !!m.hideInBestiary };
  }
  const subs = await dbPageAll("subareas", ["id", "name", "level", "monsters"]);
  const zones = [];
  for (const s of subs) {
    const mem = (s.monsters || []).map((id) => M[id]).filter((m) => m && !m.hide && m.lvl > 0);
    if (!mem.length) continue;
    const keys = ["t", "f", "e", "a", "n"], sum = { t: 0, f: 0, e: 0, a: 0, n: 0 };
    let xp = 0, lv = 0;
    for (const m of mem) { for (const k of keys) sum[k] += m.res[k]; xp += m.xp; lv += m.lvl; }
    const avg = {}; for (const k of keys) avg[k] = Math.round(sum[k] / mem.length);
    zones.push({ id: s.id, n: (s.name && s.name.fr) || "#" + s.id, lvl: s.level > 0 ? s.level : Math.round(lv / mem.length),
      cnt: mem.length, xp: Math.round(xp / mem.length), res: avg,
      mons: mem.map((m) => ({ n: m.n, l: m.lvl, x: m.xp, r: m.res })).sort((a, b) => a.l - b.l) });
  }
  zones.sort((a, b) => a.lvl - b.lvl);
  console.log("Zones exploitables:", zones.length);

  // 6) écriture
  await writeFile("data/version.json", JSON.stringify({ version: meta.version, release: meta.release }));
  await writeFile("data/snapshot.json", JSON.stringify(full)); // base du prochain diff
  await writeFile("data/picker.json", JSON.stringify({ version: meta.version, items, sets: outSets }));
  await writeFile("data/zones.json", JSON.stringify({ version: "3.6 (DofusDB)", zones }));
  await writeFile("data/diff.json", JSON.stringify(diff));
  console.log("✓ data/*.json écrits.");
}

async function toDataUri(url) {
  try {
    const r = await fetch(url);
    const b = Buffer.from(await r.arrayBuffer());
    return "data:image/png;base64," + b.toString("base64");
  } catch { return null; }
}

async function buildDiff(oldItems, newItems, iconOf, fromV, fromR, toV, toR) {
  const norm = (s) => String(s || "").trim().toLowerCase();
  const mapA = new Map(oldItems.map((i) => [i.id, i]));
  const mapB = new Map(newItems.map((i) => [i.id, i]));
  const added = [], removed = [], changed = [];
  for (const it of newItems) if (!mapA.has(it.id)) added.push(it);
  for (const it of oldItems) if (!mapB.has(it.id)) removed.push({ name: it.n, type: it.t, level: it.l });
  for (const a of oldItems) {
    const b = mapB.get(a.id); if (!b) continue;
    const eA = new Map((a.e || []).map((e) => [norm(e[0]), e]));
    const eB = new Map((b.e || []).map((e) => [norm(e[0]), e]));
    const mods = [], addE = [], remE = [];
    for (const [k, e] of eB) if (!eA.has(k)) addE.push({ name: e[0], formatted: (e[2] ?? e[1]) + " " + e[0] });
    for (const [k, e] of eA) if (!eB.has(k)) remE.push({ name: e[0], formatted: (e[2] ?? e[1]) + " " + e[0] });
    for (const [k, ea] of eA) { const eb = eB.get(k); if (!eb) continue;
      if (ea[1] !== eb[1] || ea[2] !== eb[2]) mods.push({ name: eb[0], minF: ea[1], minT: eb[1], maxF: ea[2], maxT: eb[2] }); }
    if (mods.length || addE.length || remE.length) changed.push({ name: b.n, mods, addE, remE });
  }
  // icônes base64 pour les items ajoutés (bornées)
  const addedOut = [];
  for (const it of added.slice(0, 40))
    addedOut.push({ name: it.n, type: it.t, level: it.l, dataUri: await toDataUri(iconOf[it.id]) });
  return { from: { v: fromV, r: fromR }, to: { v: toV, r: toR },
    summary: { added: added.length, removed: removed.length, changed: changed.length },
    added: addedOut, removed, changed };
}

main().catch((e) => { console.error("✗", e.message); process.exit(1); });
