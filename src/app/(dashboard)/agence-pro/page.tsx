import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { Card, CardTitle } from "@/components/ui/Card";

export const metadata: Metadata = { title: "AgencePro" };

export default async function AgenceProPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const membership = await prisma.agencyMember.findFirst({
    where: { userId: user.id },
    include: {
      agency: {
        include: {
          _count: { select: { buyers: true, members: true, reports: true } },
        },
      },
    },
  });

  if (!membership) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardTitle>AgencePro</CardTitle>
          <p className="mt-4 text-sm text-slate-600">
            Vous n'appartenez à aucune agence. AgencePro (99€/mois) offre analyses
            illimitées, CRM acheteurs, rapports white-label et jusqu'à 10 utilisateurs.
          </p>
          <Link
            href="/tarifs"
            className="mt-4 inline-block rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-white hover:bg-teal-dark"
          >
            Découvrir l'offre Agence
          </Link>
        </Card>
      </div>
    );
  }

  const { agency } = membership;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold text-navy">{agency.name}</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm text-slate-500">Acheteurs suivis</p>
          <p className="mt-1 text-xl font-bold text-navy">{agency._count.buyers}</p>
          <Link href="/agence-pro/acheteurs" className="mt-2 inline-block text-xs text-teal">
            Ouvrir le CRM →
          </Link>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Rapports générés</p>
          <p className="mt-1 text-xl font-bold text-navy">{agency._count.reports}</p>
          <Link href="/agence-pro/rapports" className="mt-2 inline-block text-xs text-teal">
            Voir les rapports →
          </Link>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Membres</p>
          <p className="mt-1 text-xl font-bold text-navy">{agency._count.members}/10</p>
        </Card>
      </div>
    </div>
  );
}
