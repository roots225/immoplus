import { getCached, setCached, TTL } from "@/lib/db/redis";

// Géorisques — risques naturels et technologiques (clé gratuite georisques.gouv.fr)
const GEORISQUES_BASE = "https://georisques.gouv.fr/api/v1";

export interface RisksResult {
  flood: boolean; // inondation
  claySwelling: "low" | "medium" | "high" | null; // retrait-gonflement argiles
  seismic: number | null; // zone sismique 1–5
  radon: number | null; // potentiel radon 1–3
  technological: boolean; // sites industriels / SEVESO à proximité
  riskCount: number;
}

export async function getRisks(lat: number, lng: number): Promise<RisksResult | null> {
  const cacheKey = `georisques:${lat.toFixed(4)}:${lng.toFixed(4)}`;
  const cached = await getCached<RisksResult>(cacheKey);
  if (cached) return cached;

  try {
    const url = `${GEORISQUES_BASE}/resultats_rapport_risque?latlon=${lng},${lat}`;
    const res = await fetch(url, {
      headers: process.env.GEORISQUES_API_KEY
        ? { "X-Api-Key": process.env.GEORISQUES_API_KEY }
        : undefined,
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`Géorisques HTTP ${res.status}`);

    const data = await res.json();
    const risques: Array<{ libelle_risque_long?: string; present?: boolean }> =
      data.risquesNaturels
        ? Object.values(data.risquesNaturels)
        : (data.risques ?? []);

    const has = (label: string) =>
      risques.some(
        (r) => r.present && r.libelle_risque_long?.toLowerCase().includes(label)
      );

    const result: RisksResult = {
      flood: has("inondation"),
      claySwelling: has("argile") ? "medium" : null,
      seismic: data.zoneSismicite ?? null,
      radon: data.potentielRadon ?? null,
      technological: Boolean(
        data.risquesTechnologiques &&
          Object.values(data.risquesTechnologiques).some(
            (r) => (r as { present?: boolean }).present
          )
      ),
      riskCount: risques.filter((r) => r.present).length,
    };

    await setCached(cacheKey, result, TTL.MONTH);
    return result;
  } catch (error) {
    console.error("[api-clients/georisques] getRisks failed:", error);
    return null;
  }
}
