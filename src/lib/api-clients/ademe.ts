import { getCached, setCached, TTL } from "@/lib/db/redis";

// ADEME — diagnostics DPE (gratuit, licence Etalab)
const ADEME_API_URL =
  process.env.ADEME_API_URL ?? "https://data.ademe.fr/data-fair/api/v1/datasets";
const DPE_DATASET = "dpe-v2-logements-existants";

export type DpeGrade = "A" | "B" | "C" | "D" | "E" | "F" | "G";

export interface DpeResult {
  grade: DpeGrade;
  gesGrade: DpeGrade | null;
  consumption: number | null; // kWh/m²/an
  establishedAt: string | null;
}

export async function getDpe(address: string, postalCode: string): Promise<DpeResult | null> {
  const cacheKey = `ademe:${encodeURIComponent(address)}:${postalCode}`;
  const cached = await getCached<DpeResult>(cacheKey);
  if (cached) return cached;

  try {
    const q = encodeURIComponent(`${address} ${postalCode}`);
    const url = `${ADEME_API_URL}/${DPE_DATASET}/lines?q=${q}&size=1&sort=-date_etablissement_dpe`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`ADEME HTTP ${res.status}`);

    const data = await res.json();
    const line = data.results?.[0];
    if (!line?.etiquette_dpe) return null;

    const result: DpeResult = {
      grade: line.etiquette_dpe as DpeGrade,
      gesGrade: (line.etiquette_ges as DpeGrade) ?? null,
      consumption: line.conso_5_usages_par_m2_ep ?? null,
      establishedAt: line.date_etablissement_dpe ?? null,
    };

    await setCached(cacheKey, result, TTL.DAY);
    return result;
  } catch (error) {
    console.error("[api-clients/ademe] getDpe failed:", error);
    return null;
  }
}
