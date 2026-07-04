import { getCached, setCached, TTL } from "@/lib/db/redis";

// INSEE — données socio-économiques par commune (clé gratuite api.insee.fr)
const INSEE_BASE = "https://api.insee.fr";

export interface DistrictData {
  population: number | null;
  medianIncome: number | null;
  unemploymentRate: number | null;
  citycode: string;
}

export async function getDistrictData(citycode: string): Promise<DistrictData | null> {
  const cacheKey = `insee:${citycode}`;
  const cached = await getCached<DistrictData>(cacheKey);
  if (cached) return cached;

  const apiKey = process.env.INSEE_API_KEY;
  if (!apiKey) {
    console.warn("[api-clients/insee] INSEE_API_KEY manquante — données quartier désactivées");
    return null;
  }

  try {
    const res = await fetch(`${INSEE_BASE}/metadonnees/geo/commune/${citycode}`, {
      headers: { "X-INSEE-Api-Key-Integration": apiKey },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`INSEE HTTP ${res.status}`);

    const data = await res.json();
    const result: DistrictData = {
      population: data.population ?? null,
      medianIncome: data.medianIncome ?? null,
      unemploymentRate: data.unemploymentRate ?? null,
      citycode,
    };

    await setCached(cacheKey, result, TTL.MONTH);
    return result;
  } catch (error) {
    console.error("[api-clients/insee] getDistrictData failed:", error);
    return null;
  }
}
