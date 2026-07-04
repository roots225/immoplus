import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth";
import { VoteSchema } from "@/lib/validators";

type Params = { params: Promise<{ id: string }> };

// POST /api/deals/[id]/vote — vote chaud/froid (unique par user+deal, re-voter change le vote)
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 401 });
    }

    const { id: dealId } = await params;
    const body = await req.json();
    const parsed = VoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Vote invalide" }, { status: 400 });
    }

    const deal = await prisma.deal.findUnique({ where: { id: dealId } });
    if (!deal || deal.status !== "ACTIVE") {
      return NextResponse.json({ error: "Deal introuvable ou inactif" }, { status: 404 });
    }

    // Upsert du vote + recalcul du hotScore dénormalisé, en transaction
    const hotScore = await prisma.$transaction(async (tx) => {
      await tx.vote.upsert({
        where: { dealId_userId: { dealId, userId: user.id } },
        update: { type: parsed.data.type },
        create: { dealId, userId: user.id, type: parsed.data.type },
      });
      const [hot, cold] = await Promise.all([
        tx.vote.count({ where: { dealId, type: "HOT" } }),
        tx.vote.count({ where: { dealId, type: "COLD" } }),
      ]);
      const score = hot - cold;
      await tx.deal.update({ where: { id: dealId }, data: { hotScore: score } });
      return score;
    });

    return NextResponse.json({ hotScore });
  } catch (error) {
    console.error("[/api/deals/[id]/vote] POST:", error);
    return NextResponse.json({ error: "Vote impossible" }, { status: 500 });
  }
}
