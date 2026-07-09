import { describe, expect, it } from "vitest";
import { createIndex } from "./stats";
import { groupStats, itemStatValue, statGroup, statRank } from "./statOrder";
import { basePA, suggestBuild } from "./suggest";
import type { GameData } from "./types";

const FIXTURE: GameData = {
  version: "test",
  items: [
    // Coiffes
    { id: 10, n: "Coiffe Force", t: "Chapeau", l: 100, s: "Coiffe", e: [["Force", 50, 80]] },
    { id: 11, n: "Coiffe Intel", t: "Chapeau", l: 100, s: "Coiffe", e: [["Intelligence", 50, 90]] },
    { id: 12, n: "Coiffe HL", t: "Chapeau", l: 180, s: "Coiffe", e: [["Force", 100, 150]] },
    // Capes
    { id: 20, n: "Cape Force", t: "Cape", l: 90, s: "Cape", e: [["Force", 30, 50]] },
    {
      id: 21, n: "Cape Set", t: "Cape", l: 90, s: "Cape", set: 7,
      e: [["Force", 10, 20]],
    },
    // Coiffe du même set : individuellement faible, mais bonus énorme
    {
      id: 13, n: "Coiffe Set", t: "Chapeau", l: 90, s: "Coiffe", set: 7,
      e: [["Force", 10, 20]],
    },
    // Anneaux identiques (test anti-doublon)
    { id: 30, n: "Anneau Unique", t: "Anneau", l: 50, s: "Anneau", e: [["Force", 20, 40]] },
    { id: 31, n: "Anneau Moindre", t: "Anneau", l: 50, s: "Anneau", e: [["Force", 10, 15]] },
    // Item sans stat visée ni objectif secondaire
    { id: 40, n: "Bottes Fuite", t: "Bottes", l: 50, s: "Bottes", e: [["Fuite", 10, 20]] },
    // PA / Vitalité purs (tests plafond + objectifs secondaires)
    { id: 32, n: "Anneau PA5 A", t: "Anneau", l: 50, s: "Anneau", e: [["PA", 5, 0]] },
    { id: 33, n: "Anneau PA5 B", t: "Anneau", l: 50, s: "Anneau", e: [["PA", 5, 0]] },
    { id: 34, n: "Anneau Vita", t: "Anneau", l: 50, s: "Anneau", e: [["Vitalité", 100, 150]] },
    // Ceintures : tie-break PM à stat visée égale
    { id: 50, n: "Ceinture Intel", t: "Ceinture", l: 50, s: "Ceinture", e: [["Intelligence", 40, 50]] },
    { id: 51, n: "Ceinture Intel PM", t: "Ceinture", l: 50, s: "Ceinture", e: [["Intelligence", 40, 50], ["PM", 1, 0]] },
    { id: 52, n: "Ceinture Intel Big", t: "Ceinture", l: 50, s: "Ceinture", e: [["Intelligence", 55, 60]] },
  ],
  sets: {
    "7": {
      n: "Panoplie Synergie",
      b: { "2": [["Force", 200]] }, // 2 pièces -> +200 Force : doit battre le greedy
    },
  },
};

const index = createIndex(FIXTURE);

describe("suggestBuild", () => {
  it("choisit les items maximisant la stat visée", () => {
    const build = suggestBuild(index, { level: 100, targets: { Intelligence: 1 } });
    expect(build.coiffe).toBe(11);
    expect(build.cape).toBeUndefined(); // aucune cape n'a d'Intelligence
  });

  it("respecte le niveau maximum", () => {
    const build = suggestBuild(index, { level: 100, targets: { Force: 1 } });
    expect(build.coiffe).not.toBe(12); // niveau 180 > 100
  });

  it("préfère une panoplie quand le bonus global bat les meilleurs items isolés", () => {
    const build = suggestBuild(index, { level: 100, targets: { Force: 1 } });
    // Coiffe Set (20) + Cape Set (20) + bonus 200 = 240 > Coiffe Force (80) + Cape Force (50)
    expect(build.coiffe).toBe(13);
    expect(build.cape).toBe(21);
  });

  it("n'équipe jamais deux fois le même item", () => {
    const build = suggestBuild(index, { level: 100, targets: { Force: 1 } });
    expect(build.anneau1).toBe(30);
    expect(build.anneau2).toBe(31); // pas 30 une seconde fois
  });

  it("ignore les items sans stat visée et rend {} sans cible", () => {
    const build = suggestBuild(index, { level: 100, targets: { Force: 1 } });
    expect(build.bottes).toBeUndefined();
    expect(suggestBuild(index, { level: 200, targets: {} })).toEqual({});
  });

  it("est déterministe", () => {
    const a = suggestBuild(index, { level: 100, targets: { Force: 2, Vitalité: 1 } });
    const b = suggestBuild(index, { level: 100, targets: { Force: 2, Vitalité: 1 } });
    expect(a).toEqual(b);
  });

  it("plafonne les PA à 12 : préfère la Vitalité aux PA excédentaires", () => {
    // Niveau 200 : base 7 PA, plafond 12 -> 5 PA d'équipement utiles.
    // Anneau PA5 A suffit ; un second +5 PA ne vaut rien -> Anneau Vita.
    const build = suggestBuild(index, { level: 200, targets: { Intelligence: 1 } });
    const rings = [build.anneau1, build.anneau2].sort();
    expect(rings).toEqual([32, 34]); // un seul anneau PA + l'anneau Vita, jamais 32+33
  });

  it("maximise PA/PM/Vitalité sans jamais sacrifier la stat visée", () => {
    const build = suggestBuild(index, { level: 100, targets: { Intelligence: 1 } });
    // À Intelligence égale (50), le PM départage : Ceinture Intel PM
    // ... sauf si une ceinture a plus d'Intelligence : Big (60) gagne malgré le PM.
    expect(build.ceinture).toBe(52);
  });

  it("à stat visée égale, le PM départage", () => {
    const noBig = createIndex({
      ...FIXTURE,
      items: FIXTURE.items.filter((i) => i.id !== 52),
    });
    const build = suggestBuild(noBig, { level: 100, targets: { Intelligence: 1 } });
    expect(build.ceinture).toBe(51); // Intel 50 + PM 1 > Intel 50
  });

  it("basePA suit le niveau", () => {
    expect(basePA(99)).toBe(6);
    expect(basePA(100)).toBe(7);
    expect(basePA(200)).toBe(7);
  });
});

describe("statOrder", () => {
  it("groupe les stats", () => {
    expect(statGroup("PA")).toBe("main");
    expect(statGroup("Vitalité")).toBe("main");
    expect(statGroup("Tacle")).toBe("secondary");
    expect(statGroup("% Résistance Feu")).toBe("elemental");
    expect(statGroup("dommages Neutre")).toBe("weapon");
    expect(statGroup("vol Air")).toBe("weapon");
    expect(statGroup("Échangeable :")).toBe("misc");
  });

  it("ordonne les principales dans l'ordre canonique", () => {
    const { main } = groupStats(["Vitalité", "PA", "Force", "PM", "% Critique"]);
    expect(main).toEqual(["PA", "PM", "% Critique", "Vitalité", "Force"]);
  });

  it("rang : PA avant tout, inconnu après tout", () => {
    expect(statRank("PA")).toBeLessThan(statRank("Vitalité"));
    expect(statRank("StatInconnue")).toBeGreaterThan(statRank("Puissance Pièges"));
  });

  it("itemStatValue lit la valeur effective", () => {
    const item = FIXTURE.items[0]; // Force 50-80
    expect(itemStatValue(item, "Force")).toBe(80);
    expect(itemStatValue(item, "Agilité")).toBe(0);
  });
});
