import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getOrCreateSubscription, PLAN_QUOTAS } from "@/lib/quotas";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PLAN_LABELS } from "@/types";
import { formatDate } from "@/lib/utils/format";
import { BillingActions } from "@/features/billing/BillingActions";

export const metadata: Metadata = { title: "Paramètres" };

export default async function ParametresPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const subscription = await getOrCreateSubscription(user.id);
  const quota = PLAN_QUOTAS[subscription.plan];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-navy">Abonnement & facturation</h1>
      <Card>
        <div className="flex items-center justify-between">
          <CardTitle>Plan {PLAN_LABELS[subscription.plan]}</CardTitle>
          <Badge tone={subscription.status === "ACTIVE" ? "green" : "amber"}>
            {subscription.status === "ACTIVE" ? "Actif" : subscription.status}
          </Badge>
        </div>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">Analyses ce mois</dt>
            <dd className="font-medium text-navy">
              {subscription.analysesUsed}
              {quota.analyses !== -1 ? ` / ${quota.analyses}` : " (illimité)"}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">RenovAI ce mois</dt>
            <dd className="font-medium text-navy">
              {subscription.renovUsed}
              {quota.renov !== -1 ? ` / ${quota.renov}` : " (illimité)"}
            </dd>
          </div>
          {subscription.currentPeriodEnd && (
            <div className="flex justify-between">
              <dt className="text-slate-500">Prochaine échéance</dt>
              <dd className="font-medium text-navy">{formatDate(subscription.currentPeriodEnd)}</dd>
            </div>
          )}
        </dl>
        <BillingActions hasStripeCustomer={Boolean(subscription.stripeCustomerId)} />
      </Card>
    </div>
  );
}
