#!/usr/bin/env node
/**
 * Altéris — build : injecte data/*.json + police dans app-template.html -> index.html.
 * Ajoute aussi le favicon (SVG) et l'apple-touch-icon en data URL.
 */
import { readFile, writeFile } from "node:fs/promises";

const rd = (p) => readFile(p, "utf8");

const [tpl, font, diff, picker, zones, svg] = await Promise.all([
  rd("app-template.html"), rd("assets/titan.b64"),
  rd("data/diff.json"), rd("data/picker.json"), rd("data/zones.json"),
  rd("assets/alteris-icon.svg"),
]);
const appleB64 = (await readFile("assets/apple-touch-icon.png")).toString("base64");

const reps = [
  ["/*FONT_B64*/", font.trim()],
  ['/*DIFF_DATA*/{}/*END_DIFF*/', diff],
  ['/*PICKER_DATA*/{version:"",items:[],sets:{}}/*END_PICKER*/', picker],
  ['/*ZONES_DATA*/{version:"",zones:[]}/*END_ZONES*/', zones],
];
let html = tpl;
for (const [m, v] of reps) {
  if (!html.includes(m)) { console.error("Placeholder manquant:", m.slice(0, 30)); process.exit(1); }
  html = html.replace(m, v);
}
// favicon + apple-touch
const svgB64 = Buffer.from(svg).toString("base64");
const head = `
<meta name="description" content="Altéris — outil pour Dofus : simulateur de build, impact des patchs, routes de farm XP et kamas.">
<meta name="theme-color" content="#29272a">
<meta property="og:title" content="Altéris — Outil pour Dofus">
<meta property="og:description" content="Simulateur de build, impact des patchs, routes de farm.">
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml;base64,${svgB64}">
<link rel="apple-touch-icon" href="data:image/png;base64,${appleB64}">`;
html = html.replace("</title>", "</title>" + head);

await writeFile("index.html", html);
console.log("✓ index.html généré (" + html.length + " octets).");
