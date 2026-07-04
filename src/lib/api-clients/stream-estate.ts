import { getCached, setCached, TTL } from "@/lib/db/redis";
import type { PropertyType } from "@prisma/client";

// Stream Estate — SEULE option légale pour parser les annonces
// SeLoger/Leboncoin/PAP (CLAUDE.md §12). Ne jamais scraper directement.
const STREAM_ESTATE_BASE = "https://api.stream-estate.fr/v1";

export interface ListingData {
  title: string;
  price: number;
  surface: number | null;
  rooms: number | null;
  propertyType: PropertyType;
  address: string | null;
  city: string;
  postalCode: string;
  description: string | null;
  photos: string[];
  dpeGrade: string | null;
}

function mapPropertyType(raw: string | undefined): PropertyType {
  switch (raw?.toLowerCase()) {
    case "maison":
    case "house":
      return "HOUSE";
    case "terrain":
    case "land":
      return "LAND";
    case "local":
    case "commercial":
      return "COMMERCIAL";
    case "appartement":
    case "apartment":
      return "APARTMENT";
    default:
      return "OTHER";
  }
}

export async function parseListing(sourceUrl: string): Promise<ListingData | null> {
  const cacheKey = `analysis:url:${Buffer.from(sourceUrl).toString("base64url")}`;
  const cached = await getCached<ListingData>(cacheKey);
  if (cached) return cached;

  const apiKey = process.env.STREAM_ESTATE_API_KEY;
  if (!apiKey) {
    console.warn("[api-clients/stream-estate] STREAM_ESTATE_API_KEY manquante");
    return null;
  }

  try {
    const res = await fetch(`${STREAM_ESTATE_BASE}/listings/parse`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url: sourceUrl }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`Stream Estate HTTP ${res.status}`);

    const data = await res.json();
    const result: ListingData = {
      title: data.title ?? "Annonce sans titre",
      price: data.price,
      surface: data.surface ?? null,
      rooms: data.rooms ?? null,
      propertyType: mapPropertyType(data.property_type),
      address: data.address ?? null,
      city: data.city,
      postalCode: data.postal_code,
      description: data.description ?? null,
      photos: data.photos ?? [],
      dpeGrade: data.dpe ?? null,
    };

    await setCached(cacheKey, result, TTL.DAY);
    return result;
  } catch (error) {
    console.error("[api-clients/stream-estate] parseListing failed:", error);
    return null;
  }
}
