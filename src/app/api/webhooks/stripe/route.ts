import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/db/prisma";
import { getStripe, planFromPriceId } from "@/lib/stripe";

// POST /api/webhooks/stripe — sync abonnements Stripe → PostgreSQL
// Vérification de signature OBLIGATOIRE avant tout traitement.
export async function POST(req: NextRequest) {
  try {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) {
      console.error("[/api/webhooks/stripe] STRIPE_WEBHOOK_SECRET manquant");
      return NextResponse.json({ error: "Webhook non configuré" }, { status: 500 });
    }

    const payload = await req.text();
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return NextResponse.json({ error: "Signature manquante" }, { status: 401 });
    }

    const stripe = getStripe();

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(payload, signature, secret);
    } catch {
      return NextResponse.json({ error: "Signature invalide" }, { status: 401 });
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        if (userId && session.subscription) {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string);
          const priceId = sub.items.data[0]?.price.id;
          const plan = priceId ? planFromPriceId(priceId) : null;
          await prisma.subscription.update({
            where: { userId },
            data: {
              plan: plan ?? undefined,
              status: "ACTIVE",
              stripeSubscriptionId: sub.id,
              stripePriceId: priceId,
              currentPeriodEnd: new Date(sub.current_period_end * 1000),
              analysesUsed: 0,
              renovUsed: 0,
              quotaResetAt: new Date(),
            },
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object;
        const priceId = sub.items.data[0]?.price.id;
        const plan = priceId ? planFromPriceId(priceId) : null;
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: {
            plan: plan ?? undefined,
            status:
              sub.status === "active"
                ? "ACTIVE"
                : sub.status === "past_due"
                  ? "PAST_DUE"
                  : sub.status === "trialing"
                    ? "TRIALING"
                    : sub.status === "canceled"
                      ? "CANCELED"
                      : "INCOMPLETE",
            stripePriceId: priceId,
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
          },
        });
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object;
        // Retour au plan FREE à la résiliation
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: {
            plan: "FREE",
            status: "CANCELED",
            stripeSubscriptionId: null,
            stripePriceId: null,
          },
        });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        if (invoice.customer) {
          await prisma.subscription.updateMany({
            where: { stripeCustomerId: invoice.customer as string },
            data: { status: "PAST_DUE" },
          });
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[/api/webhooks/stripe] POST:", error);
    return NextResponse.json({ error: "Erreur webhook" }, { status: 500 });
  }
}
