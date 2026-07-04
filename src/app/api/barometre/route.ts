import { NextRequest, NextResponse } from "next/server";
import { getDvfStats } from "@/lib/api-clients/dvf";
import { BarometreQuerySchema } from "@/lib/validators";

// GET /api/barometre — données prix marché (PUBLIC, pas d'auth — page baromètre)
// Les données DVF sont déjà cachées 24h dans le client, pas d'appel Claude ici.
export async function GET(req: NextRequest) {
  try {
    const params = Object.fromEntries(req.nextUrl.searchParams);
    const parsed = BarometreQuerySchema.safeParse(params);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Coordonnées invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { lat, lng, radius } = parsed.data;
    const [apartments, houses] = await Promise.all([
      getDvfStats(lat, lng, radius, "APARTMENT"),
      getDvfStats(lat, lng, radius, "HOUSE"),
    ]);

    return NextResponse.json(
      {
        apartments: apartments
          ? { medianPricePerSqm: apartments.medianPricePerSqm, count: apartments.transactionCount }
          : null,
        houses: houses
          ? { medianPricePerSqm: houses.medianPricePerSqm, count: houses.transactionCount }
          : null,
        radius,
      },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } }
    );
  } catch (error) {
    console.error("[/api/barometre] GET:", error);
    return NextResponse.json({ error: "Données marché indisponibles" }, { status: 500 });
  }
}
