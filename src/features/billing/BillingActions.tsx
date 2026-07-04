"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

// Ouvre le portail client Stripe (factures, changement de plan, résiliation)
export function BillingActions({ hasStripeCustomer }: { hasStripeCustomer: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openPortal() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Portail indisponible");
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inattendue");
      setLoading(false);
    }
  }

  return (
    <div className="mt-6">
      {hasStripeCustomer ? (
        <Button onClick={openPortal} disabled={loading}>
          {loading ? "Redirection…" : "Gérer mon abonnement (Stripe)"}
        </Button>
      ) : (
        <Button onClick={() => router.push("/tarifs")}>Passer à un plan payant</Button>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
