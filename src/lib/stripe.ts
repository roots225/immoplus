import Stripe from "stripe";
import type { Plan } from "@prisma/client";

// Initialisation paresseuse : le constructeur Stripe rejette une clé vide,
// ce qui casserait le build Next.js (collecte des pages) sans variables d'env.
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY manquante");
    }
    _stripe = new Stripe(key);
  }
  return _stripe;
}

export const STRIPE_PRICE_BY_PLAN: Partial<Record<Plan, string | undefined>> = {
  STARTER: process.env.STRIPE_PRICE_STARTER_MONTHLY,
  PRO: process.env.STRIPE_PRICE_PRO_MONTHLY,
  AGENCY: process.env.STRIPE_PRICE_AGENCY_MONTHLY,
};

export function planFromPriceId(priceId: string): Plan | null {
  if (priceId === process.env.STRIPE_PRICE_STARTER_MONTHLY) return "STARTER";
  if (priceId === process.env.STRIPE_PRICE_PRO_MONTHLY) return "PRO";
  if (priceId === process.env.STRIPE_PRICE_AGENCY_MONTHLY) return "AGENCY";
  return null;
}
