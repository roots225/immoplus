import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth";
import { AlertCreateSchema } from "@/lib/validators";

// GET /api/alertes — alertes de l'utilisateur
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

    const alerts = await prisma.userAlert.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ alerts });
  } catch (error) {
    console.error("[/api/alertes] GET:", error);
    return NextResponse.json({ error: "Erreur lors du chargement" }, { status: 500 });
  }
}

// POST /api/alertes — créer une alerte (plans PRO+ uniquement)
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

    const subscription = await prisma.subscription.findUnique({ where: { userId: user.id } });
    if (!subscription || !["PRO", "AGENCY", "ENTERPRISE"].includes(subscription.plan)) {
      return NextResponse.json(
        { error: "Les alertes sont réservées aux plans Pro et supérieurs" },
        { status: 402 }
      );
    }

    const body = await req.json();
    const parsed = AlertCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Critères invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const alert = await prisma.userAlert.create({
      data: { ...parsed.data, userId: user.id },
    });
    return NextResponse.json({ alert }, { status: 201 });
  } catch (error) {
    console.error("[/api/alertes] POST:", error);
    return NextResponse.json({ error: "Impossible de créer l'alerte" }, { status: 500 });
  }
}

// DELETE /api/alertes?id= — supprimer une alerte
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

    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Paramètre id requis" }, { status: 400 });
    }

    const alert = await prisma.userAlert.findUnique({ where: { id } });
    if (!alert || alert.userId !== user.id) {
      return NextResponse.json({ error: "Alerte introuvable" }, { status: 404 });
    }

    await prisma.userAlert.delete({ where: { id } });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("[/api/alertes] DELETE:", error);
    return NextResponse.json({ error: "Suppression impossible" }, { status: 500 });
  }
}
