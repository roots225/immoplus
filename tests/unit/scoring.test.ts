import {
  scorePrice,
  scoreDpe,
  scoreRisks,
  negotiationMargin,
  computeGlobalScore,
} from "@/lib/scoring/algorithm";

describe("scorePrice — barème écart médiane DVF", () => {
  it.each([
    [-20, 100],
    [-12, 90],
    [-7, 80],
    [0, 70],
    [5, 60],
    [8, 45],
    [15, 30],
    [25, 15],
  ])("écart %d%% → %d pts", (gap, expected) => {
    expect(scorePrice(gap)).toBe(expected);
  });
});

describe("scoreDpe — barème A→100 … G→10", () => {
  it("note chaque classe selon le barème", () => {
    expect(scoreDpe("A")).toBe(100);
    expect(scoreDpe("D")).toBe(55);
    expect(scoreDpe("G")).toBe(10);
  });
  it("retourne 50 sans DPE connu", () => {
    expect(scoreDpe(null)).toBe(50);
  });
});

describe("scoreRisks", () => {
  it("pénalise l'inondation et les risques technologiques", () => {
    const score = scoreRisks({
      flood: true,
      claySwelling: null,
      seismic: 1,
      radon: 1,
      technological: true,
      riskCount: 2,
    });
    expect(score).toBe(55); // 100 - 30 (inondation) - 15 (techno)
  });
});

describe("negotiationMargin — base 3%, +5% prix>marché, +5% DPE F/G", () => {
  it("bien au prix du marché avec bon DPE → 3%", () => {
    expect(negotiationMargin(-5, "C")).toBe(3);
  });
  it("bien surcoté avec DPE G → 13%", () => {
    expect(negotiationMargin(10, "G")).toBe(13);
  });
});

describe("computeGlobalScore — pondération 30/20/20/15/15", () => {
  it("calcule le score global pondéré", () => {
    const result = computeGlobalScore({
      priceGapPercent: 0, // 70 pts × 0.3
      dpeGrade: "C", // 70 pts × 0.2
      risks: null, // 60 pts × 0.2
      transport: null, // 50 pts × 0.15
      district: null, // 55 pts × 0.15
    });
    expect(result.scoreGlobal).toBe(Math.round(70 * 0.3 + 70 * 0.2 + 60 * 0.2 + 50 * 0.15 + 55 * 0.15));
  });
});
