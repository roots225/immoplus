import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth";
import { DealCreateSchema } from "@/lib/validators";

// GET /api/deals — liste paginée (tri hot/récent, filtre ville)
export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }

    const params = req.nextUrl.searchParams;
    const sort = params.get("sort") === "recent" ? "recent" : "hot";
    const city = params.get("city") ?? undefined;
    const page = Math.max(1, Number(params.get("page") ?? 1));
    const perPage = 20;

    const where = { status: "ACTIVE" as const, ...(city ? { city: { equals: city, mode: "insensitive" as const } } : {}) };

    const [deals, total] = await Promise.all([
      prisma.deal.findMany({
        where,
        orderBy: sort === "hot" ? { hotScore: "desc" } : { createdAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
        include: {
          user: { select: { firstName: true, lastName: true, imageUrl: true } },
          _count: { select: { votes: true, comments: true } },
        },
      }),
      prisma.deal.count({ where }),
    ]);

    return NextResponse.json({ deals, total, page, perPage });
  } catch (error) {
    console.error("[/api/deals] GET:", error);
    return NextResponse.json({ error: "Erreur lors du chargement des deals" }, { status: 500 });
  }
}

// POST /api/deals — publier un deal
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
    const parsed = DealCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const deal = await prisma.deal.create({
      data: { ...parsed.data, userId: user.id },
    });

    return NextResponse.json({ deal }, { status: 201 });
  } catch (error) {
    console.error("[/api/deals] POST:", error);
    return NextResponse.json({ error: "Impossible de publier le deal" }, { status: 500 });
  }
}
