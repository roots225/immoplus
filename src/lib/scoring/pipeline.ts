// Pipeline d'analyse ImmoScore — exécuté par le worker BullMQ.
// 5–7 appels API en parallèle (Promise.allSettled), objectif < 5s (CLAUDE.md §12).

import { prisma } from "@/lib/db/prisma";
import { parseListing } from "@/lib/api-clients/stream-estate";
import { geocodeAddress } from "@/lib/api-clients/ban";
import { getDvfStats } from "@/lib/api-clients/dvf";
import { getDpe, type DpeGrade } from "@/lib/api-clients/ademe";
import { getRisks } from "@/lib/api-clients/georisques";
import { getTransportData } from "@/lib/api-clients/mapbox";
import { getDistrictData } from "@/lib/api-clients/insee";
import { generateAnalysisSummary } from "@/lib/api-clients/claude";
import { computeGlobalScore } from "@/lib/scoring/algorithm";

function settled<T>(result: PromiseSettledResult<T | null>): T | null {
  return result.status === "fulfilled" ? result.value : null;
}

export async function runAnalysisPipeline(analysisId: string): Promise<void> {
  const analysis = await prisma.analysis.findUniqueOrThrow({ where: { id: analysisId } });

  await prisma.analysis.update({
    where: { id: analysisId },
    data: { status: "PROCESSING" },
  });

  try {
    // 1. Parser l'annonce (Stream Estate — seule option légale)
    const listing = await parseListing(analysis.sourceUrl);
    if (!listing) {
      throw new Error("Impossible de parser l'annonce (Stream Estate indisponible ou URL non supportée)");
    }

    // 2. Géocoder l'adresse
    const fullAddress = listing.address
      ? `${listing.address} ${listing.postalCode} ${listing.city}`
      : `${listing.postalCode} ${listing.city}`;
    const geo = await geocodeAddress(fullAddress);
    if (!geo) {
      throw new Error("Géocodage impossible pour cette adresse");
    }

    // 3. Appels données en parallèle
    const [dvfR, dpeR, risksR, transportR, districtR] = await Promise.allSettled([
      getDvfStats(geo.latitude, geo.longitude, 500, listing.propertyType),
      getDpe(listing.address ?? geo.label, listing.postalCode),
      getRisks(geo.latitude, geo.longitude),
      getTransportData(geo.latitude, geo.longitude),
      getDistrictData(geo.citycode),
    ]);

    const dvf = settled(dvfR);
    const dpe = settled(dpeR);
    const risks = settled(risksR);
    const transport = settled(transportR);
    const district = settled(districtR);

    // 4. Calcul des scores
    const pricePerSqm = listing.surface ? listing.price / listing.surface : null;
    const priceGapPercent =
      pricePerSqm && dvf
        ? ((pricePerSqm - dvf.medianPricePerSqm) / dvf.medianPricePerSqm) * 100
        : null;
    const dpeGrade = (dpe?.grade ?? listing.dpeGrade ?? null) as DpeGrade | null;

    const scores = computeGlobalScore({ priceGapPercent, dpeGrade, risks, transport, district });

    // 5. Résumé IA (pas d'appel Claude si score < 30 — géré dans le client)
    const aiSummary = await generateAnalysisSummary({
      scoreGlobal: scores.scoreGlobal,
      title: listing.title,
      price: listing.price,
      city: listing.city,
      priceGapPercent: priceGapPercent !== null ? Math.round(priceGapPercent * 10) / 10 : null,
      dpeGrade,
      riskCount: risks?.riskCount ?? 0,
    });

    // 6. Persistance
    await prisma.analysis.update({
      where: { id: analysisId },
      data: {
        status: "COMPLETED",
        title: listing.title,
        price: listing.price,
        surface: listing.surface,
        rooms: listing.rooms,
        propertyType: listing.propertyType,
        address: listing.address,
        city: listing.city,
        postalCode: listing.postalCode,
        latitude: geo.latitude,
        longitude: geo.longitude,
        scoreGlobal: scores.scoreGlobal,
        scorePrice: scores.scorePrice,
        scoreDpe: scores.scoreDpe,
        scoreRisks: scores.scoreRisks,
        scoreTransport: scores.scoreTransport,
        scoreDistrict: scores.scoreDistrict,
        pricePerSqm,
        marketMedianSqm: dvf?.medianPricePerSqm ?? null,
        priceGapPercent: priceGapPercent !== null ? Math.round(priceGapPercent * 10) / 10 : null,
        negotiationMargin: scores.negotiationMargin,
        aiSummary: aiSummary || null,
        dvfData: dvf ? JSON.parse(JSON.stringify(dvf)) : undefined,
        dpeData: dpe ? JSON.parse(JSON.stringify(dpe)) : undefined,
        risksData: risks ? JSON.parse(JSON.stringify(risks)) : undefined,
        transportData: transport ? JSON.parse(JSON.stringify(transport)) : undefined,
        districtData: district ? JSON.parse(JSON.stringify(district)) : undefined,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: analysis.userId,
        action: "analysis.complete",
        entity: "Analysis",
        entityId: analysisId,
      },
    });
  } catch (error) {
    console.error("[pipeline] analyse failed:", analysisId, error);
    await prisma.analysis.update({
      where: { id: analysisId },
      data: {
        status: "FAILED",
        errorMessage: error instanceof Error ? error.message : "Erreur inconnue",
      },
    });
    throw error;
  }
}
