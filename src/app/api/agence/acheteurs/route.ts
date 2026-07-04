import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth";
import { BuyerCreateSchema } from "@/lib/validators";
import type { User } from "@prisma/client";

// Résout l'agence de l'utilisateur (membre requis)
async function getUserAgency(user: User) {
  const membership = await prisma.agencyMember.findFirst({
    where: { userId: user.id },
    include: { agency: true },
  });
  return membership;
}

// GET /api/agence/acheteurs — CRM acheteurs de l'agence
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

    const membership = await getUserAgency(user);
    if (!membership) {
      return NextResponse.json({ error: "Vous n'appartenez à aucune agence" }, { status: 403 });
    }

    const status = req.nextUrl.searchParams.get("status") ?? undefined;
    const buyers = await prisma.agencyBuyer.findMany({
      where: {
        agencyId: membership.agencyId,
        ...(status ? { status: status as never } : {}),
      },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json({ buyers });
  } catch (error) {
    console.error("[/api/agence/acheteurs] GET:", error);
    return NextResponse.json({ error: "Erreur lors du chargement" }, { status: 500 });
  }
}

// POST /api/agence/acheteurs — ajouter un acheteur au CRM
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

    const membership = await getUserAgency(user);
    if (!membership) {
      return NextResponse.json({ error: "Vous n'appartenez à aucune agence" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = BuyerCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const buyer = await prisma.agencyBuyer.create({
      data: { ...parsed.data, agencyId: membership.agencyId },
    });

    await prisma.auditLog.create({
      data: { userId: user.id, action: "buyer.create", entity: "AgencyBuyer", entityId: buyer.id },
    });

    return NextResponse.json({ buyer }, { status: 201 });
  } catch (error) {
    console.error("[/api/agence/acheteurs] POST:", error);
    return NextResponse.json({ error: "Impossible d'ajouter l'acheteur" }, { status: 500 });
  }
}

// PATCH /api/agence/acheteurs?id= — mettre à jour un acheteur
export async function PATCH(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 401 });
    }

    const membership = await getUserAgency(user);
    if (!membership) {
      return NextResponse.json({ error: "Vous n'appartenez à aucune agence" }, { status: 403 });
    }

    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Paramètre id requis" }, { status: 400 });
    }

    const existing = await prisma.agencyBuyer.findUnique({ where: { id } });
    if (!existing || existing.agencyId !== membership.agencyId) {
      return NextResponse.json({ error: "Acheteur introuvable" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = BuyerCreateSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }

    const buyer = await prisma.agencyBuyer.update({ where: { id }, data: parsed.data });
    return NextResponse.json({ buyer });
  } catch (error) {
    console.error("[/api/agence/acheteurs] PATCH:", error);
    return NextResponse.json({ error: "Mise à jour impossible" }, { status: 500 });
  }
}

// DELETE /api/agence/acheteurs?id= — retirer un acheteur (RGPD)
export async function DELETE(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 401 });
    }

    const membership = await getUserAgency(user);
    if (!membership) {
      return NextResponse.json({ error: "Vous n'appartenez à aucune agence" }, { status: 403 });
    }

    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Paramètre id requis" }, { status: 400 });
    }

    const existing = await prisma.agencyBuyer.findUnique({ where: { id } });
    if (!existing || existing.agencyId !== membership.agencyId) {
      return NextResponse.json({ error: "Acheteur introuvable" }, { status: 404 });
    }

    await prisma.agencyBuyer.delete({ where: { id } });
    await prisma.auditLog.create({
      data: { userId: user.id, action: "buyer.delete", entity: "AgencyBuyer", entityId: id },
    });

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("[/api/agence/acheteurs] DELETE:", error);
    return NextResponse.json({ error: "Suppression impossible" }, { status: 500 });
  }
}
