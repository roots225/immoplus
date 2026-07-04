import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Card, CardTitle } from "@/components/ui/Card";
import { formatDate } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Profil" };

export default async function ProfilPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-navy">Mon profil</h1>
      <Card className="mt-6">
        <CardTitle>
          {user.firstName} {user.lastName}
        </CardTitle>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">Email</dt>
            <dd className="font-medium text-navy">{user.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Membre depuis</dt>
            <dd className="font-medium text-navy">{formatDate(user.createdAt)}</dd>
          </div>
        </dl>
        <p className="mt-6 text-xs text-slate-400">
          La gestion du compte (email, mot de passe, suppression RGPD) se fait via le menu
          utilisateur en haut à droite. La suppression du compte efface toutes vos données
          (analyses, deals, alertes) conformément au RGPD.
        </p>
      </Card>
    </div>
  );
}
