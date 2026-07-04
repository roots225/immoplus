import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCurrentUser } from "@/lib/auth";
import { getOrCreateSubscription } from "@/lib/quotas";
import { getStripe, STRIPE_PRICE_BY_PLAN } from "@/lib/stripe";
import { CheckoutSchema } from "@/lib/validators";
import { prisma } from "@/lib/db/prisma";

// POST /api/stripe/checkout — crée une session Stripe Checkout pour un plan payant
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
    const parsed = CheckoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Plan invalide" }, { status: 400 });
    }

    const priceId = STRIPE_PRICE_BY_PLAN[parsed.data.plan];
    if (!priceId) {
      return NextResponse.json({ error: "Plan non configuré" }, { status: 500 });
    }

    const stripe = getStripe();

    // Réutilise le customer Stripe existant si présent
    const subscription = await getOrCreateSubscription(user.id);
    let customerId = subscription.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id, clerkId: user.clerkId },
      });
      customerId = customer.id;
      await prisma.subscription.update({
        where: { userId: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/parametres?checkout=success`,
      cancel_url: `${appUrl}/tarifs?checkout=cancel`,
      metadata: { userId: user.id, plan: parsed.data.plan },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[/api/stripe/checkout] POST:", error);
    return NextResponse.json({ error: "Impossible de démarrer le paiement" }, { status: 500 });
  }
}
