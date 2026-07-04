import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/db/redis";
import { checkAndConsumeQuota } from "@/lib/quotas";
import { AnalyseUrlSchema } from "@/lib/validators";
import { getAnalyseQueue } from "@/lib/queue";

// POST /api/analyse — lance le pipeline d'analyse d'une annonce (asynchrone via BullMQ)
export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = AnalyseUrlSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "URL invalide", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Rate limiting (protège Stream Estate + APIs tierces)
    const rate = await checkRateLimit("analyse", user.id, 30);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Trop de demandes, réessayez dans une heure" },
        { status: 429 }
      );
    }

    // Déduplication : analyse récente de la même URL déjà en BDD (< 24h)
    const existing = await prisma.analysis.findFirst({
      where: {
        sourceUrl: parsed.data.url,
        userId: user.id,
        status: "COMPLETED",
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      orderBy: { createdAt: "desc" },
    });
    if (existing) {
      return NextResponse.json({ analysis: existing, cached: true });
    }

    // Quota selon le plan
    const quota = await checkAndConsumeQuota(user.id, "analyses");
    if (!quota.allowed) {
      return NextResponse.json(
        {
          error: `Quota d'analyses atteint (${quota.limit}/mois pour le plan ${quota.plan}). Passez au plan supérieur.`,
        },
        { status: 402 }
      );
    }

    const analysis = await prisma.analysis.create({
      data: { userId: user.id, sourceUrl: parsed.data.url, status: "PENDING" },
    });

    await getAnalyseQueue().add("analyse", {
      analysisId: analysis.id,
      sourceUrl: parsed.data.url,
      userId: user.id,
    });

    await prisma.auditLog.create({
      data: { userId: user.id, action: "analysis.create", entity: "Analysis", entityId: analysis.id },
    });

    return NextResponse.json({ analysis, cached: false }, { status: 202 });
  } catch (error) {
    console.error("[/api/analyse] POST:", error);
    return NextResponse.json(
      { error: "Impossible de lancer l'analyse, réessayez plus tard" },
      { status: 500 }
    );
  }
}

// GET /api/analyse — liste les analyses de l'utilisateur (ou une seule via ?id=)
export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 401 });
    }

    const id = req.nextUrl.searchParams.get("id");
    if (id) {
      const analysis = await prisma.analysis.findFirst({ where: { id, userId: user.id } });
      if (!analysis) {
        return NextResponse.json({ error: "Analyse introuvable" }, { status: 404 });
      }
      return NextResponse.json({ analysis });
    }

    const analyses = await prisma.analysis.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json({ analyses });
  } catch (error) {
    console.error("[/api/analyse] GET:", error);
    return NextResponse.json({ error: "Erreur lors du chargement" }, { status: 500 });
  }
}
