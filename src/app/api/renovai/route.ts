import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/db/redis";
import { checkAndConsumeQuota } from "@/lib/quotas";
import { RenovEstimateSchema } from "@/lib/validators";
import { analyzeRenovationPhotos } from "@/lib/api-clients/claude";
import type { RenovCategory } from "@prisma/client";

const VALID_CATEGORIES = new Set([
  "ROOF", "ELECTRICAL", "PLUMBING", "HEATING", "INSULATION", "WINDOWS",
  "KITCHEN", "BATHROOM", "FLOORING", "PAINTING", "FACADE", "OTHER",
]);

// POST /api/renovai — estimation travaux à partir de photos (Claude Vision, synchrone)
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
    const parsed = RenovEstimateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const rate = await checkRateLimit("renovai", user.id, 10);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Trop de demandes, réessayez dans une heure" },
        { status: 429 }
      );
    }

    const quota = await checkAndConsumeQuota(user.id, "renov");
    if (!quota.allowed) {
      return NextResponse.json(
        {
          error: `Quota RenovAI atteint (${quota.limit}/mois pour le plan ${quota.plan}). Passez au plan supérieur.`,
        },
        { status: 402 }
      );
    }

    const estimate = await prisma.renovEstimate.create({
      data: {
        userId: user.id,
        photoUrls: parsed.data.photoUrls,
        surface: parsed.data.surface,
        propertyType: parsed.data.propertyType,
        status: "PROCESSING",
      },
    });

    const vision = await analyzeRenovationPhotos(parsed.data.photoUrls, parsed.data.surface);
    if (!vision) {
      await prisma.renovEstimate.update({
        where: { id: estimate.id },
        data: { status: "FAILED" },
      });
      return NextResponse.json(
        { error: "L'analyse des photos a échoué, réessayez" },
        { status: 502 }
      );
    }

    const completed = await prisma.renovEstimate.update({
      where: { id: estimate.id },
      data: {
        status: "COMPLETED",
        totalMin: vision.totalMin,
        totalMax: vision.totalMax,
        aiNotes: vision.notes,
        items: {
          create: vision.items
            .filter((i) => VALID_CATEGORIES.has(i.category))
            .map((i) => ({
              category: i.category as RenovCategory,
              label: i.label,
              costMin: Math.round(i.costMin),
              costMax: Math.round(i.costMax),
              priority: Math.min(5, Math.max(1, Math.round(i.priority))),
            })),
        },
      },
      include: { items: true },
    });

    return NextResponse.json({ estimate: completed });
  } catch (error) {
    console.error("[/api/renovai] POST:", error);
    return NextResponse.json({ error: "Estimation impossible, réessayez" }, { status: 500 });
  }
}

// GET /api/renovai — historique des estimations
export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 401 });
    }

    const estimates = await prisma.renovEstimate.findMany({
      where: { userId: user.id },
      include: { items: true },
      orderBy: { createdAt: "desc" },
      take: 30,
    });
    return NextResponse.json({ estimates });
  } catch (error) {
    console.error("[/api/renovai] GET:", error);
    return NextResponse.json({ error: "Erreur lors du chargement" }, { status: 500 });
  }
}
