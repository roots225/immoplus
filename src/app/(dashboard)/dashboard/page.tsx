import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ArrowUpRight, Plus } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { getOrCreateSubscription, PLAN_QUOTAS } from "@/lib/quotas";
import { Card, SectionHeader } from "@/components/ui/Card";
import { Badge, ScoreBadge } from "@/components/ui/Badge";
import { formatPrice, formatRelativeDate } from "@/lib/utils/format";
import { PLAN_LABELS } from "@/types";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const [subscription, analyses, alertCount] = await Promise.all([
    getOrCreateSubscription(user.id),
    prisma.analysis.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.userAlert.count({ where: { userId: user.id, active: true } }),
  ]);

  const quota = PLAN_QUOTAS[subscription.plan];
  const recent = analyses.slice(0, 4);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">Bonjour {user.firstName ?? "👋"}</h1>
        <Link
          href="/immoscore"
          className="flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
        >
          <Plus aria-hidden className="h-4 w-4" /> Nouvelle analyse
        </Link>
      </div>

      {/* Rangée horizontale d'analyses récentes — pattern "matchs à venir" */}
      <section className="space-y-4">
        <SectionHeader
          title="Analyses récentes"
          action={
            <Link href="/immoscore" className="flex items-center gap-1 text-sm font-semibold text-primary">
              Voir tout <ArrowUpRight aria-hidden className="h-4 w-4" />
            </Link>
          }
        />
        <div className="no-scrollbar flex gap-4 overflow-x-auto pb-1">
          {recent.map((a) => (
            <Link
              key={a.id}
              href="/immoscore"
              className="w-56 shrink-0 rounded-card border border-slate-100 bg-white p-4 transition-shadow hover:ring-2 hover:ring-primary"
            >
              <div className="flex items-center justify-between text-xs font-semibold text-muted">
                <span>{a.city ?? "—"}</span>
                {a.status === "COMPLETED" && a.scoreGlobal !== null ? (
                  <Badge tone="ink">{a.scoreGlobal}</Badge>
                ) : (
                  <Badge tone="slate">{a.status === "FAILED" ? "Échec" : "…"}</Badge>
                )}
              </div>
              <p className="mt-3 truncate text-sm font-semibold text-ink">
                {a.title ?? a.sourceUrl}
              </p>
              <p className="mt-1 text-xs text-muted">
                {a.price ? formatPrice(a.price) : "Prix inconnu"} ·{" "}
                {formatRelativeDate(a.createdAt)}
              </p>
            </Link>
          ))}

          {/* Carte d'ajout en pointillés — pattern "Add player" */}
          <Link
            href="/immoscore"
            className="flex w-56 shrink-0 flex-col items-center justify-center gap-3 rounded-card border-2 border-dashed border-primary/40 p-4 text-sm font-semibold text-primary transition-colors hover:bg-primary-soft"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white">
              <Plus aria-hidden className="h-5 w-5" />
            </span>
            Nouvelle analyse
          </Link>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm text-muted">Plan actuel</p>
          <p className="mt-1 text-xl font-bold text-ink">{PLAN_LABELS[subscription.plan]}</p>
          <Link href="/parametres" className="mt-2 inline-block text-xs font-semibold text-primary">
            Gérer l'abonnement →
          </Link>
        </Card>
        <Card>
          <p className="text-sm text-muted">Analyses ce mois</p>
          <p className="mt-1 text-xl font-bold text-ink">
            {subscription.analysesUsed}
            {quota.analyses !== -1 && ` / ${quota.analyses}`}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-muted">Alertes actives</p>
          <p className="mt-1 text-xl font-bold text-ink">{alertCount}</p>
        </Card>
      </div>

      {/* Historique — pattern table de joueurs */}
      <section className="space-y-4">
        <SectionHeader
          title="Historique"
          action={
            <Link href="/immoscore" className="flex items-center gap-1 text-sm font-semibold text-primary">
              Analyser une annonce <ArrowUpRight aria-hidden className="h-4 w-4" />
            </Link>
          }
        />
        <Card className="p-0">
          {analyses.length === 0 ? (
            <p className="p-6 text-sm text-muted">
              Aucune analyse pour l'instant.{" "}
              <Link href="/immoscore" className="font-semibold text-primary">
                Analysez votre première annonce
              </Link>
              .
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold text-muted">
                    <th className="px-6 py-4">Bien</th>
                    <th className="px-4 py-4">Ville</th>
                    <th className="px-4 py-4">Prix</th>
                    <th className="px-4 py-4">Date</th>
                    <th className="px-4 py-4">Score</th>
                    <th className="px-6 py-4" />
                  </tr>
                </thead>
                <tbody>
                  {analyses.map((a) => (
                    <tr key={a.id} className="border-t border-slate-100">
                      <td className="max-w-64 truncate px-6 py-3 font-semibold text-ink">
                        {a.title ?? a.sourceUrl}
                      </td>
                      <td className="px-4 py-3 text-muted">{a.city ?? "—"}</td>
                      <td className="px-4 py-3 text-ink">
                        {a.price ? formatPrice(a.price) : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {formatRelativeDate(a.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        {a.status === "COMPLETED" && a.scoreGlobal !== null ? (
                          <ScoreBadge score={a.scoreGlobal} />
                        ) : (
                          <span className="text-xs text-muted">
                            {a.status === "FAILED" ? "Échec" : "En cours…"}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <Link
                          href="/immoscore"
                          aria-label="Ouvrir l'analyse"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-primary-dark"
                        >
                          <ArrowRight aria-hidden className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}
