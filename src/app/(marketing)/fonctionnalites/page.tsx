import type { Metadata } from "next";
import { Check } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/Card";

export const metadata: Metadata = { title: "Fonctionnalités" };

const FEATURES = [
  {
    module: "ImmoScore",
    items: [
      "Score global /100 pondéré : prix (30%), DPE (20%), risques (20%), transports (15%), quartier (15%)",
      "Prix comparé à la médiane DVF des transactions réelles à 500 m",
      "Marge de négociation calculée automatiquement",
      "Résumé IA de l'analyse en langage clair",
    ],
  },
  {
    module: "RenovAI",
    items: [
      "Estimation travaux par photo (Claude Vision)",
      "Devis par poste : toiture, électricité, plomberie, isolation…",
      "Fourchette basse/haute en euros TTC, prix France 2026",
      "Priorisation des travaux de 1 (urgent) à 5 (confort)",
    ],
  },
  {
    module: "AgencePro",
    items: [
      "Analyses et estimations illimitées",
      "CRM acheteurs : budgets, villes cibles, statuts de suivi",
      "Rapports PDF white-label à votre marque",
      "Jusqu'à 10 utilisateurs par agence",
    ],
  },
  {
    module: "ImmoDeal",
    items: [
      "Deals partagés par la communauté",
      "Votes chaud/froid et commentaires",
      "Alertes email personnalisées (ville, budget, type de bien)",
      "Sauvegarde de vos deals favoris",
    ],
  },
];

export default function FonctionnalitesPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="text-center text-3xl font-bold text-navy">Fonctionnalités</h1>
      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {FEATURES.map((f) => (
          <Card key={f.module}>
            <CardTitle>{f.module}</CardTitle>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              {f.items.map((item) => (
                <li key={item} className="flex gap-2">
                  <Check aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </section>
  );
}
