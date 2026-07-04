import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth";
import { DealUpdateSchema } from "@/lib/validators";

type Params = { params: Promise<{ id: string }> };

// GET /api/deals/[id] — fiche deal complète
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }

    const { id } = await params;
    const deal = await prisma.deal.findUnique({
      where: { id },
      include: {
        user: { select: { firstName: true, lastName: true, imageUrl: true } },
        votes: true,
        _count: { select: { comments: true, savedBy: true } },
      },
    });
    if (!deal) {
      return NextResponse.json({ error: "Deal introuvable" }, { status: 404 });
    }
    return NextResponse.json({ deal });
  } catch (error) {
    console.error("[/api/deals/[id]] GET:", error);
    return NextResponse.json({ error: "Erreur lors du chargement" }, { status: 500 });
  }
}

// PATCH /api/deals/[id] — modifier son deal
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 401 });
    }

    const { id } = await params;
    const deal = await prisma.deal.findUnique({ where: { id } });
    if (!deal) {
      return NextResponse.json({ error: "Deal introuvable" }, { status: 404 });
    }
    if (deal.userId !== user.id) {
      return NextResponse.json({ error: "Action non autorisée" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = DealUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await prisma.deal.update({ where: { id }, data: parsed.data });
    return NextResponse.json({ deal: updated });
  } catch (error) {
    console.error("[/api/deals/[id]] PATCH:", error);
    return NextResponse.json({ error: "Modification impossible" }, { status: 500 });
  }
}

// DELETE /api/deals/[id] — supprimer son deal
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 401 });
    }

    const { id } = await params;
    const deal = await prisma.deal.findUnique({ where: { id } });
    if (!deal) {
      return NextResponse.json({ error: "Deal introuvable" }, { status: 404 });
    }
    if (deal.userId !== user.id) {
      return NextResponse.json({ error: "Action non autorisée" }, { status: 403 });
    }

    await prisma.deal.delete({ where: { id } });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("[/api/deals/[id]] DELETE:", error);
    return NextResponse.json({ error: "Suppression impossible" }, { status: 500 });
  }
}
