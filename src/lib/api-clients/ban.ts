import { getCached, setCached, TTL } from "@/lib/db/redis";

// BAN — Base Adresse Nationale (géocodage gratuit, licence Etalab)
const BAN_API_URL = process.env.BAN_API_URL ?? "https://api-adresse.data.gouv.fr";

export interface GeocodedAddress {
  label: string;
  city: string;
  postalCode: string;
  citycode: string; // code INSEE commune
  latitude: number;
  longitude: number;
  score: number;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function geocodeAddress(address: string): Promise<GeocodedAddress | null> {
  const cacheKey = `ban:${slugify(address)}`;
  const cached = await getCached<GeocodedAddress>(cacheKey);
  if (cached) return cached;

  try {
    const url = `${BAN_API_URL}/search/?q=${encodeURIComponent(address)}&limit=1`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`BAN HTTP ${res.status}`);

    const data = await res.json();
    const feature = data.features?.[0];
    if (!feature) return null;

    const result: GeocodedAddress = {
      label: feature.properties.label,
      city: feature.properties.city,
      postalCode: feature.properties.postcode,
      citycode: feature.properties.citycode,
      longitude: feature.geometry.coordinates[0],
      latitude: feature.geometry.coordinates[1],
      score: feature.properties.score,
    };

    await setCached(cacheKey, result, TTL.DAY);
    return result;
  } catch (error) {
    console.error("[api-clients/ban] geocodeAddress failed:", error);
    return null;
  }
}
