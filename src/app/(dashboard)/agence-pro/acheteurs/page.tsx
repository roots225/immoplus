import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatPrice } from "@/lib/utils/format";
import { PROPERTY_TYPE_LABELS } from "@/types";

export const metadata: Metadata = { title: "CRM Acheteurs" };

const STATUS_LABELS: Record<string, { label: string; tone: "teal" | "gold" | "green" | "slate" | "red" }> = {
  PROSPECT: { label: "Prospect", tone: "slate" },
  ACTIVE: { label: "Actif", tone: "teal" },
  OFFER_MADE: { label: "Offre en cours", tone: "gold" },
  CLOSED: { label: "Signé", tone: "green" },
  LOST: { label: "Perdu", tone: "red" },
};

export default async function AcheteursPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const membership = await prisma.agencyMember.findFirst({ where: { userId: user.id } });
  if (!membership) redirect("/agence-pro");

  const buyers = await prisma.agencyBuyer.findMany({
    where: { agencyId: membership.agencyId },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold text-navy">CRM Acheteurs</h1>
      <Card className="mt-6">
        <CardTitle>{buyers.length} acheteur{buyers.length > 1 ? "s" : ""}</CardTitle>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase text-slate-400">
                <th className="py-2 pr-4">Nom</th>
                <th className="py-2 pr-4">Statut</th>
                <th className="py-2 pr-4">Budget</th>
                <th className="py-2 pr-4">Villes</th>
                <th className="py-2">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {buyers.map((b) => {
                const status = STATUS_LABELS[b.status] ?? STATUS_LABELS.PROSPECT;
                return (
                  <tr key={b.id}>
                    <td className="py-3 pr-4 font-medium text-navy">
                      {b.firstName} {b.lastName}
                      {b.email && <p className="text-xs font-normal text-slate-400">{b.email}</p>}
                    </td>
                    <td className="py-3 pr-4">
                      <Badge tone={status.tone}>{status.label}</Badge>
                    </td>
                    <td className="py-3 pr-4">
                      {b.budgetMin || b.budgetMax
                        ? `${b.budgetMin ? formatPrice(b.budgetMin) : "—"} → ${b.budgetMax ? formatPrice(b.budgetMax) : "—"}`
                        : "—"}
                    </td>
                    <td className="py-3 pr-4">{b.cities.join(", ") || "—"}</td>
                    <td className="py-3">
                      {b.propertyType ? PROPERTY_TYPE_LABELS[b.propertyType] : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {buyers.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-500">
              Aucun acheteur — ajoutez-en via POST /api/agence/acheteurs ou l'interface à venir.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
