import { describe, expect, it } from "vitest";
import {
  compareBuilds,
  computeBuildStats,
  createIndex,
  decodeBuild,
  effectValue,
  encodeBuild,
  freeSlotFor,
  setBonus,
  statCategory,
  statElement,
} from "./index";
import type { GameData } from "./types";

/** Jeu de données minimal et déterministe */
const FIXTURE: GameData = {
  version: "test",
  items: [
    {
      id: 1,
      n: "Coiffe du Bouftou",
      t: "Chapeau",
      l: 20,
      s: "Coiffe",
      set: 1,
      e: [
        ["Force", 10, 30],
        ["Vitalité", 20, 50],
        ["Portée", 1, 0], // max=0 -> valeur fixe = min
        ["-special spell fertile", 1, 1], // masqué
      ],
    },
    {
      id: 2,
      n: "Cape du Bouftou",
      t: "Cape",
      l: 20,
      s: "Cape",
      set: 1,
      e: [
        ["Force", 5, 20],
        ["% Résistance Terre", 3, 5],
      ],
    },
    {
      id: 3,
      n: "Anneau solo",
      t: "Anneau",
      l: 50,
      s: "Anneau",
      e: [
        ["Agilité", 15, 25],
        ["Dommage Air", 2, 4],
        ["Fuite", -10, 0], // malus fixe
      ],
    },
  ],
  sets: {
    "1": {
      n: "Panoplie du Bouftou",
      b: {
        "2": [
          ["Force", 15],
          ["Vitalité", 30],
        ],
        "3": [
          ["Force", 40],
          ["Vitalité", 80],
        ],
      },
    },
  },
};

const index = createIndex(FIXTURE);

describe("effectValue", () => {
  it("prend le max si présent", () => {
    expect(effectValue(["Force", 10, 30])).toBe(30);
  });
  it("retombe sur le min si max nul ou absent (sémantique historique)", () => {
    expect(effectValue(["Portée", 1, 0])).toBe(1);
    expect(effectValue(["Sagesse", 25])).toBe(25);
  });
  it("gère les malus", () => {
    expect(effectValue(["Fuite", -10, 0])).toBe(-10);
  });
});

describe("computeBuildStats", () => {
  it("somme les stats des items et applique le bonus de panoplie au bon palier", () => {
    const { totals, activeSets } = computeBuildStats(index, {
      coiffe: 1,
      cape: 2,
    });
    // Force = 30 (coiffe) + 20 (cape) + 15 (bonus 2 pièces)
    expect(totals["Force"]).toBe(65);
    // Vitalité = 50 + 30 (bonus)
    expect(totals["Vitalité"]).toBe(80);
    expect(totals["Portée"]).toBe(1);
    expect(totals["% Résistance Terre"]).toBe(5);
    expect(activeSets).toHaveLength(1);
    expect(activeSets[0].count).toBe(2);
    expect(activeSets[0].bonus).toEqual([
      ["Force", 15],
      ["Vitalité", 30],
    ]);
  });

  it("n'applique aucun bonus de panoplie avec une seule pièce", () => {
    const { totals, activeSets } = computeBuildStats(index, { coiffe: 1 });
    expect(totals["Force"]).toBe(30);
    expect(activeSets[0].bonus).toEqual([]);
  });

  it("ignore les effets masqués", () => {
    const { totals } = computeBuildStats(index, { coiffe: 1 });
    expect(
      Object.keys(totals).find((k) => /special spell/i.test(k)),
    ).toBeUndefined();
  });

  it("détaille les contributions par source", () => {
    const { contributions } = computeBuildStats(index, { coiffe: 1, cape: 2 });
    const force = contributions["Force"];
    expect(force).toHaveLength(3);
    expect(force.filter((c) => c.fromSet)).toHaveLength(1);
    expect(force.find((c) => c.source === "Coiffe du Bouftou")?.value).toBe(30);
  });

  it("build vide -> aucun total", () => {
    const { totals, activeSets } = computeBuildStats(index, {});
    expect(Object.keys(totals)).toHaveLength(0);
    expect(activeSets).toHaveLength(0);
  });

  it("ignore les ids inconnus sans planter", () => {
    const { totals } = computeBuildStats(index, { coiffe: 99999 });
    expect(Object.keys(totals)).toHaveLength(0);
  });
});

describe("setBonus", () => {
  it("prend le palier le plus haut <= pièces équipées", () => {
    expect(setBonus(index, 1, 2)[0]).toEqual(["Force", 15]);
    expect(setBonus(index, 1, 3)[0]).toEqual(["Force", 40]);
    expect(setBonus(index, 1, 5)[0]).toEqual(["Force", 40]);
  });
  it("rien sous 2 pièces ou panoplie inconnue", () => {
    expect(setBonus(index, 1, 1)).toEqual([]);
    expect(setBonus(index, 42, 4)).toEqual([]);
  });
});

describe("compareBuilds", () => {
  it("calcule les deltas b - a, triés par ampleur, sans les stats égales", () => {
    const deltas = compareBuilds(
      index,
      { coiffe: 1 },
      { coiffe: 1, anneau1: 3 },
    );
    const byStat = Object.fromEntries(deltas.map((d) => [d.stat, d.delta]));
    expect(byStat["Agilité"]).toBe(25);
    expect(byStat["Dommage Air"]).toBe(4);
    expect(byStat["Fuite"]).toBe(-10);
    expect(byStat["Force"]).toBeUndefined(); // inchangée
    // tri décroissant par |delta|
    expect(Math.abs(deltas[0].delta)).toBeGreaterThanOrEqual(
      Math.abs(deltas[deltas.length - 1].delta),
    );
  });
});

describe("encode / decode", () => {
  it("roundtrip complet", () => {
    const draft = {
      level: 187,
      items: { coiffe: 1, cape: 2, anneau1: 3 },
    } as const;
    const code = encodeBuild(draft);
    expect(code.startsWith("187!")).toBe(true);
    const decoded = decodeBuild(code);
    expect(decoded).toEqual({ level: 187, items: { coiffe: 1, cape: 2, anneau1: 3 } });
  });

  it("accepte le format legacy #b= et les URLs complètes", () => {
    const code = encodeBuild({ level: 200, items: { coiffe: 1 } });
    expect(decodeBuild(`#b=${code}`)?.items.coiffe).toBe(1);
    expect(
      decodeBuild(`https://alteris.example/simulateur#b=${code}`)?.items.coiffe,
    ).toBe(1);
  });

  it("filtre les ids invalides via isValidId", () => {
    const code = encodeBuild({ level: 200, items: { coiffe: 1, cape: 2 } });
    const decoded = decodeBuild(code, (id) => id === 1);
    expect(decoded?.items).toEqual({ coiffe: 1 });
  });

  it("borne le niveau dans [1, 200]", () => {
    expect(decodeBuild("999!1")?.level).toBe(200);
    expect(decodeBuild("0!1")?.level).toBe(200); // 0 falsy -> défaut 200 (historique)
    expect(decodeBuild("-5!1")?.level).toBe(1);
  });

  it("rejette les codes malformés", () => {
    expect(decodeBuild("")).toBeNull();
    expect(decodeBuild("pasuncode")).toBeNull();
  });
});

describe("slots", () => {
  it("freeSlotFor respecte les slots multiples (anneaux, dofus)", () => {
    expect(freeSlotFor("Anneau", {})).toBe("anneau1");
    expect(freeSlotFor("Anneau", { anneau1: 3 })).toBe("anneau2");
    expect(freeSlotFor("Anneau", { anneau1: 3, anneau2: 3 })).toBeNull();
  });
});

describe("categorize", () => {
  it("classe les stats", () => {
    expect(statCategory("% Résistance Terre")).toBe("res");
    expect(statCategory("Dommage Air")).toBe("dmg");
    expect(statCategory("Force")).toBe("prim");
  });
  it("détecte l'élément, accents inclus", () => {
    expect(statElement("Agilité")).toBe("air");
    expect(statElement("% Résistance Feu")).toBe("feu");
    expect(statElement("Dommage Neutre")).toBe("neutre");
    expect(statElement("Vitalité")).toBeNull();
  });
});
