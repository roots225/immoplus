"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface PlanDef {
  key: "FREE" | "STARTER" | "PRO" | "AGENCY" | "ENTERPRISE";
  name: string;
  price: string;
  features: string[];
  highlight?: boolean;
}

const PLANS: PlanDef[] = [
  { key: "FREE", name: "Gratuit", price: "0€", features: ["2 analyses/mois", "Score /100 complet"] },
  {
    key: "STARTER",
    name: "Starter",
    price: "9€/mois",
    features: ["20 analyses/mois", "3 RenovAI/mois", "Rapports PDF", "Comparateur 2 biens"],
  },
  {
    key: "PRO",
    name: "Pro",
    price: "29€/mois",
    features: ["Analyses illimitées", "20 RenovAI/mois", "Alertes email", "Accès API"],
    highlight: true,
  },
  {
    key: "AGENCY",
    name: "Agence",
    price: "99€/mois",
    features: ["Tout illimité", "White-label PDF", "10 utilisateurs", "CRM acheteurs"],
  },
  {
    key: "ENTERPRISE",
    name: "Enterprise",
    price: "Sur devis",
    features: ["SSO", "SLA", "Support dédié"],
  },
];

export function PricingTable() {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function subscribe(plan: PlanDef["key"]) {
    if (plan === "FREE") {
      router.push(isSignedIn ? "/dashboard" : "/sign-up");
      return;
    }
    if (plan === "ENTERPRISE") {
      window.location.href = "mailto:contact@astrawave.fr?subject=Offre Enterprise";
      return;
    }
    if (!isSignedIn) {
      router.push("/sign-up");
      return;
    }
    setLoading(plan);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur inconnue");
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Le paiement est indisponible");
      setLoading(null);
    }
  }

  return (
    <div className="mt-12">
      {error && (
        <p className="mb-6 rounded-lg bg-red-50 p-3 text-center text-sm text-red-700">{error}</p>
      )}
      <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-5">
        {PLANS.map((plan) => (
          <div
            key={plan.key}
            className={`flex flex-col rounded-xl border bg-white p-6 shadow-sm ${
              plan.highlight ? "border-teal ring-2 ring-teal/30" : "border-slate-200"
            }`}
          >
            <h3 className="font-semibold text-navy">{plan.name}</h3>
            <p className="mt-2 text-2xl font-bold text-navy">{plan.price}</p>
            <ul className="mt-4 flex-1 space-y-2 text-sm text-slate-600">
              {plan.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <Check aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {f}
                </li>
              ))}
            </ul>
            <Button
              className="mt-6 w-full"
              variant={plan.highlight ? "primary" : "secondary"}
              disabled={loading !== null}
              onClick={() => subscribe(plan.key)}
            >
              {loading === plan.key ? "Redirection…" : plan.key === "FREE" ? "Commencer" : "Choisir"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
