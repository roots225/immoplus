import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth";
import { CommentCreateSchema } from "@/lib/validators";

type Params = { params: Promise<{ id: string }> };

// GET /api/deals/[id]/comments — commentaires racine + réponses (2 niveaux max)
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }

    const { id: dealId } = await params;
    const comments = await prisma.comment.findMany({
      where: { dealId, parentId: null },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { firstName: true, lastName: true, imageUrl: true } },
        _count: { select: { likes: true } },
        replies: {
          orderBy: { createdAt: "asc" },
          include: {
            user: { select: { firstName: true, lastName: true, imageUrl: true } },
            _count: { select: { likes: true } },
          },
        },
      },
    });
    return NextResponse.json({ comments });
  } catch (error) {
    console.error("[/api/deals/[id]/comments] GET:", error);
    return NextResponse.json({ error: "Erreur lors du chargement" }, { status: 500 });
  }
}

// POST /api/deals/[id]/comments — commenter (imbrication limitée à 2 niveaux)
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
    const parsed = CommentCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Commentaire invalide" }, { status: 400 });
    }

    const deal = await prisma.deal.findUnique({ where: { id: dealId } });
    if (!deal) {
      return NextResponse.json({ error: "Deal introuvable" }, { status: 404 });
    }

    if (parsed.data.parentId) {
      const parent = await prisma.comment.findUnique({ where: { id: parsed.data.parentId } });
      if (!parent || parent.dealId !== dealId) {
        return NextResponse.json({ error: "Commentaire parent introuvable" }, { status: 404 });
      }
      if (parent.parentId) {
        return NextResponse.json(
          { error: "Impossible de répondre à une réponse (2 niveaux max)" },
          { status: 400 }
        );
      }
    }

    const comment = await prisma.comment.create({
      data: {
        dealId,
        userId: user.id,
        content: parsed.data.content,
        parentId: parsed.data.parentId,
      },
      include: { user: { select: { firstName: true, lastName: true, imageUrl: true } } },
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error("[/api/deals/[id]/comments] POST:", error);
    return NextResponse.json({ error: "Impossible de publier le commentaire" }, { status: 500 });
  }
}
