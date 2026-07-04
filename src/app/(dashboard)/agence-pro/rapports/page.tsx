import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { Card, CardTitle } from "@/components/ui/Card";
import { formatDate } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Rapports PDF" };

export default async function RapportsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const membership = await prisma.agencyMember.findFirst({ where: { userId: user.id } });
  if (!membership) redirect("/agence-pro");

  const reports = await prisma.report.findMany({
    where: { agencyId: membership.agencyId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { analysis: { select: { title: true, city: true, scoreGlobal: true } } },
  });

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold text-navy">Rapports PDF</h1>
      <Card className="mt-6">
        <CardTitle>{reports.length} rapport{reports.length > 1 ? "s" : ""} généré{reports.length > 1 ? "s" : ""}</CardTitle>
        {reports.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            Aucun rapport — générez-en depuis une analyse ImmoScore terminée.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {reports.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                <div>
                  <p className="font-medium text-navy">
                    {r.analysis.title ?? "Analyse"} {r.analysis.city ? `· ${r.analysis.city}` : ""}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatDate(r.createdAt)}
                    {r.whiteLabel && " · white-label"}
                  </p>
                </div>
                <a
                  href={r.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 font-semibold text-teal"
                >
                  Télécharger →
                </a>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
