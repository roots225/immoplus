import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatPrice } from "@/lib/utils/format";
import { PROPERTY_TYPE_LABELS } from "@/types";

export const metadata: Metadata = { title: "Alertes" };

const FREQ_LABELS: Record<string, string> = {
  INSTANT: "Instantanée",
  DAILY: "Quotidienne",
  WEEKLY: "Hebdomadaire",
};

export default async function AlertesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const alerts = await prisma.userAlert.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold text-navy">Mes alertes</h1>
      <p className="mt-2 text-sm text-slate-600">
        Recevez par email les nouveaux deals correspondant à vos critères (plans Pro et +).
      </p>
      <div className="mt-6 space-y-4">
        {alerts.length === 0 && (
          <Card>
            <p className="text-sm text-slate-500">
              Aucune alerte configurée. Créez-en via POST /api/alertes ou l'interface à venir.
            </p>
          </Card>
        )}
        {alerts.map((a) => (
          <Card key={a.id}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>{a.name}</CardTitle>
                <p className="mt-1 text-sm text-slate-600">
                  {a.city}
                  {a.propertyType && ` · ${PROPERTY_TYPE_LABELS[a.propertyType]}`}
                  {a.budgetMax && ` · jusqu'à ${formatPrice(a.budgetMax)}`}
                  {a.surfaceMin && ` · ${a.surfaceMin} m² min`}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Fréquence : {FREQ_LABELS[a.frequency]}
                </p>
              </div>
              <Badge tone={a.active ? "green" : "slate"}>
                {a.active ? "Active" : "En pause"}
              </Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
