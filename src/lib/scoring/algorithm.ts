// Algorithme de scoring ImmoScore — CLAUDE.md §6
// Score global /100 = somme pondérée de 5 sous-scores.

import type { DpeGrade } from "@/lib/api-clients/ademe";
import type { RisksResult } from "@/lib/api-clients/georisques";
import type { TransportData } from "@/lib/api-clients/mapbox";
import type { DistrictData } from "@/lib/api-clients/insee";

export const WEIGHTS = {
  price: 0.3,
  dpe: 0.2,
  risks: 0.2,
  transport: 0.15,
  district: 0.15,
} as const;

// Barème prix : écart % par rapport à la médiane DVF
export function scorePrice(priceGapPercent: number): number {
  if (priceGapPercent < -15) return 100;
  if (priceGapPercent < -10) return 90;
  if (priceGapPercent < -5) return 80;
  if (priceGapPercent <= 0) return 70;
  if (priceGapPercent <= 5) return 60;
  if (priceGapPercent <= 10) return 45;
  if (priceGapPercent <= 20) return 30;
  return 15;
}

// Barème DPE : A→100 … G→10
const DPE_SCORES: Record<DpeGrade, number> = {
  A: 100,
  B: 85,
  C: 70,
  D: 55,
  E: 40,
  F: 25,
  G: 10,
};

export function scoreDpe(grade: DpeGrade | null): number {
  // Sans DPE connu, on retient une note médiane prudente (équivalent D/E)
  if (!grade) return 50;
  return DPE_SCORES[grade];
}

export function scoreRisks(risks: RisksResult | null): number {
  if (!risks) return 60;
  let score = 100;
  if (risks.flood) score -= 30;
  if (risks.claySwelling === "high") score -= 20;
  else if (risks.claySwelling === "medium") score -= 10;
  if (risks.seismic && risks.seismic >= 4) score -= 15;
  if (risks.radon && risks.radon >= 3) score -= 10;
  if (risks.technological) score -= 15;
  return Math.max(0, score);
}

export function scoreTransport(transport: TransportData | null): number {
  if (!transport?.walkArea15min) return 50;
  // Surface accessible à pied en 15 min : ~1,5 km² en zone dense, < 0,5 km² isolé
  const walk = transport.walkArea15min;
  if (walk >= 1.5) return 95;
  if (walk >= 1.0) return 80;
  if (walk >= 0.6) return 65;
  if (walk >= 0.3) return 45;
  return 25;
}

export function scoreDistrict(district: DistrictData | null): number {
  if (!district) return 55;
  let score = 55;
  if (district.medianIncome) {
    if (district.medianIncome > 26_000) score += 20;
    else if (district.medianIncome > 21_000) score += 10;
  }
  if (district.unemploymentRate !== null && district.unemploymentRate !== undefined) {
    if (district.unemploymentRate < 7) score += 15;
    else if (district.unemploymentRate > 12) score -= 15;
  }
  return Math.max(0, Math.min(100, score));
}

// Marge de négociation : base 3%, +5% si prix > marché, +5% si DPE F/G
export function negotiationMargin(priceGapPercent: number | null, dpe: DpeGrade | null): number {
  let margin = 3;
  if (priceGapPercent !== null && priceGapPercent > 0) margin += 5;
  if (dpe === "F" || dpe === "G") margin += 5;
  return margin;
}

export interface ScoreBreakdown {
  scoreGlobal: number;
  scorePrice: number;
  scoreDpe: number;
  scoreRisks: number;
  scoreTransport: number;
  scoreDistrict: number;
  negotiationMargin: number;
}

export function computeGlobalScore(input: {
  priceGapPercent: number | null;
  dpeGrade: DpeGrade | null;
  risks: RisksResult | null;
  transport: TransportData | null;
  district: DistrictData | null;
}): ScoreBreakdown {
  const sPrice = input.priceGapPercent !== null ? scorePrice(input.priceGapPercent) : 50;
  const sDpe = scoreDpe(input.dpeGrade);
  const sRisks = scoreRisks(input.risks);
  const sTransport = scoreTransport(input.transport);
  const sDistrict = scoreDistrict(input.district);

  const global = Math.round(
    sPrice * WEIGHTS.price +
      sDpe * WEIGHTS.dpe +
      sRisks * WEIGHTS.risks +
      sTransport * WEIGHTS.transport +
      sDistrict * WEIGHTS.district
  );

  return {
    scoreGlobal: global,
    scorePrice: sPrice,
    scoreDpe: sDpe,
    scoreRisks: sRisks,
    scoreTransport: sTransport,
    scoreDistrict: sDistrict,
    negotiationMargin: negotiationMargin(input.priceGapPercent, input.dpeGrade),
  };
}
