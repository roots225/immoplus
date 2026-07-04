import { getCached, setCached, TTL } from "@/lib/db/redis";

// Mapbox — isochrones transports (quota gratuit 50 000 req/mois, à surveiller)
const MAPBOX_BASE = "https://api.mapbox.com";

export interface TransportData {
  // Surface accessible en 15 min (km²) par mode — proxy de qualité de desserte
  walkArea15min: number | null;
  cyclingArea15min: number | null;
  drivingArea15min: number | null;
}

async function isochroneArea(
  profile: "walking" | "cycling" | "driving",
  lat: number,
  lng: number,
  token: string
): Promise<number | null> {
  const url = `${MAPBOX_BASE}/isochrone/v1/mapbox/${profile}/${lng},${lat}?contours_minutes=15&polygons=true&access_token=${token}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`Mapbox HTTP ${res.status}`);
  const data = await res.json();
  const coords: number[][] = data.features?.[0]?.geometry?.coordinates?.[0] ?? [];
  if (coords.length < 3) return null;

  // Formule du lacet (shoelace) sur coordonnées approximées en km
  let area = 0;
  const kmPerDegLat = 111.32;
  const kmPerDegLng = 111.32 * Math.cos((lat * Math.PI) / 180);
  for (let i = 0; i < coords.length - 1; i++) {
    const [x1, y1] = [coords[i][0] * kmPerDegLng, coords[i][1] * kmPerDegLat];
    const [x2, y2] = [coords[i + 1][0] * kmPerDegLng, coords[i + 1][1] * kmPerDegLat];
    area += x1 * y2 - x2 * y1;
  }
  return Math.abs(area / 2);
}

export async function getTransportData(lat: number, lng: number): Promise<TransportData | null> {
  const cacheKey = `mapbox:iso:${lat.toFixed(4)}:${lng.toFixed(4)}`;
  const cached = await getCached<TransportData>(cacheKey);
  if (cached) return cached;

  const token = process.env.MAPBOX_SECRET_TOKEN ?? process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) {
    console.warn("[api-clients/mapbox] token manquant — score transports désactivé");
    return null;
  }

  try {
    const [walk, cycling, driving] = await Promise.allSettled([
      isochroneArea("walking", lat, lng, token),
      isochroneArea("cycling", lat, lng, token),
      isochroneArea("driving", lat, lng, token),
    ]);

    const result: TransportData = {
      walkArea15min: walk.status === "fulfilled" ? walk.value : null,
      cyclingArea15min: cycling.status === "fulfilled" ? cycling.value : null,
      drivingArea15min: driving.status === "fulfilled" ? driving.value : null,
    };

    await setCached(cacheKey, result, TTL.MONTH);
    return result;
  } catch (error) {
    console.error("[api-clients/mapbox] getTransportData failed:", error);
    return null;
  }
}
