import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatPrice, formatRelativeDate, formatSurface } from "@/lib/utils/format";
import { PROPERTY_TYPE_LABELS } from "@/types";
import { DealActions } from "@/features/immodeal/components/DealActions";

export const dynamic = "force-dynamic";

export default async function DealPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deal = await prisma.deal.findUnique({
    where: { id },
    include: {
      user: { select: { firstName: true, lastName: true } },
      comments: {
        where: { parentId: null },
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { firstName: true, lastName: true } },
          replies: {
            orderBy: { createdAt: "asc" },
            include: { user: { select: { firstName: true, lastName: true } } },
          },
        },
      },
    },
  });
  if (!deal) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>{deal.title}</CardTitle>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <Badge tone="teal">{PROPERTY_TYPE_LABELS[deal.propertyType]}</Badge>
              <span>{deal.city} ({deal.postalCode})</span>
              {deal.surface && <span>· {formatSurface(deal.surface)}</span>}
              <span>· publié {formatRelativeDate(deal.createdAt)} par {deal.user.firstName ?? "un membre"}</span>
            </div>
          </div>
          <p className="shrink-0 text-2xl font-bold text-gold">{formatPrice(deal.price)}</p>
        </div>
        <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
          {deal.description}
        </p>
        {deal.sourceUrl && (
          <a
            href={deal.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block text-sm font-semibold text-teal"
          >
            Voir l'annonce d'origine →
          </a>
        )}
        <DealActions dealId={deal.id} hotScore={deal.hotScore} />
      </Card>

      <Card>
        <CardTitle>Commentaires ({deal.comments.length})</CardTitle>
        <ul className="mt-4 space-y-4">
          {deal.comments.map((c) => (
            <li key={c.id} className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs font-semibold text-navy">
                {c.user.firstName ?? "Membre"} ·{" "}
                <span className="font-normal text-slate-400">{formatRelativeDate(c.createdAt)}</span>
              </p>
              <p className="mt-1 text-sm text-slate-700">{c.content}</p>
              {c.replies.length > 0 && (
                <ul className="mt-3 space-y-2 border-l-2 border-slate-200 pl-4">
                  {c.replies.map((r) => (
                    <li key={r.id}>
                      <p className="text-xs font-semibold text-navy">
                        {r.user.firstName ?? "Membre"} ·{" "}
                        <span className="font-normal text-slate-400">
                          {formatRelativeDate(r.createdAt)}
                        </span>
                      </p>
                      <p className="mt-0.5 text-sm text-slate-700">{r.content}</p>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
