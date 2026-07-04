import type { Metadata } from "next";
import Link from "next/link";
import { Flame, Snowflake } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatPrice, formatRelativeDate } from "@/lib/utils/format";
import { PROPERTY_TYPE_LABELS } from "@/types";

export const metadata: Metadata = { title: "ImmoDeal" };

// Interroge la BDD à chaque requête — pas de prérendu statique au build
export const dynamic = "force-dynamic";

export default async function ImmoDealPage() {
  const deals = await prisma.deal.findMany({
    where: { status: "ACTIVE" },
    orderBy: { hotScore: "desc" },
    take: 30,
    include: {
      user: { select: { firstName: true } },
      _count: { select: { comments: true } },
    },
  });

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="flex items-center gap-2 text-2xl font-bold text-navy">
        <Flame aria-hidden className="h-6 w-6 text-gold" /> Deals de la communauté
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        Les meilleures affaires repérées par les membres, classées par popularité.
      </p>
      <div className="mt-6 space-y-4">
        {deals.length === 0 && (
          <Card>
            <p className="text-sm text-slate-500">Aucun deal actif pour le moment.</p>
          </Card>
        )}
        {deals.map((deal) => (
          <Link key={deal.id} href={`/immodeal/${deal.id}`} className="block">
            <Card className="transition-shadow hover:shadow-md">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-semibold text-navy">{deal.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-600">{deal.description}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <Badge tone="teal">{PROPERTY_TYPE_LABELS[deal.propertyType]}</Badge>
                    <span>
                      {deal.city} ({deal.postalCode})
                    </span>
                    <span>· {formatRelativeDate(deal.createdAt)}</span>
                    <span>· {deal._count.comments} commentaire{deal._count.comments > 1 ? "s" : ""}</span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-lg font-bold text-gold">{formatPrice(deal.price)}</p>
                  <p className={`flex items-center justify-end gap-1 text-sm font-semibold ${deal.hotScore >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                    {deal.hotScore >= 0 ? (
                      <Flame aria-hidden className="h-4 w-4" />
                    ) : (
                      <Snowflake aria-hidden className="h-4 w-4" />
                    )}
                    {deal.hotScore}
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
