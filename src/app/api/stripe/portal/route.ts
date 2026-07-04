import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { getStripe } from "@/lib/stripe";

// POST /api/stripe/portal — ouvre le portail client Stripe (gestion abonnement/factures)
export async function POST() {
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
    if (!subscription?.stripeCustomerId) {
      return NextResponse.json({ error: "Aucun abonnement actif" }, { status: 404 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const session = await getStripe().billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${appUrl}/parametres`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[/api/stripe/portal] POST:", error);
    return NextResponse.json({ error: "Impossible d'ouvrir le portail" }, { status: 500 });
  }
}
