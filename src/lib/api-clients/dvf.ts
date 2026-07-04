import { getCached, setCached, TTL } from "@/lib/db/redis";
import type { PropertyType } from "@prisma/client";

// DVF Etalab — transactions immobilières réelles (gratuit, licence Etalab)
const DVF_API_URL = process.env.DVF_API_URL ?? "https://api.data.gouv.fr/api/dvf/v1";

export interface DvfStats {
  medianPricePerSqm: number;
  transactionCount: number;
  radius: number;
  sample: Array<{ price: number; surface: number; date: string }>;
}

export async function getDvfStats(
  lat: number,
  lng: number,
  radius = 500,
  type: PropertyType = "APARTMENT"
): Promise<DvfStats | null> {
  const cacheKey = `dvf:${lat.toFixed(4)}:${lng.toFixed(4)}:${radius}:${type}`;
  const cached = await getCached<DvfStats>(cacheKey);
  if (cached) return cached;

  try {
    const dvfType = type === "HOUSE" ? "Maison" : "Appartement";
    const url = `${DVF_API_URL}/mutations?lat=${lat}&lon=${lng}&dist=${radius}&type_local=${encodeURIComponent(dvfType)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`DVF HTTP ${res.status}`);

    const data = await res.json();
    const mutations: Array<{
      valeur_fonciere: number;
      surface_reelle_bati: number;
      date_mutation: string;
    }> = data.mutations ?? data.resultats ?? [];

    const pricesPerSqm = mutations
      .filter((m) => m.valeur_fonciere > 0 && m.surface_reelle_bati > 8)
      .map((m) => m.valeur_fonciere / m.surface_reelle_bati)
      .sort((a, b) => a - b);

    if (pricesPerSqm.length === 0) return null;

    const median = pricesPerSqm[Math.floor(pricesPerSqm.length / 2)];
    const result: DvfStats = {
      medianPricePerSqm: Math.round(median),
      transactionCount: pricesPerSqm.length,
      radius,
      sample: mutations.slice(0, 20).map((m) => ({
        price: m.valeur_fonciere,
        surface: m.surface_reelle_bati,
        date: m.date_mutation,
      })),
    };

    await setCached(cacheKey, result, TTL.DAY);
    return result;
  } catch (error) {
    console.error("[api-clients/dvf] getDvfStats failed:", error);
    return null;
  }
}
