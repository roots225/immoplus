import type { Metadata } from "next";
import { PricingTable } from "@/features/billing/PricingTable";

export const metadata: Metadata = { title: "Tarifs" };

export default function TarifsPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="text-center text-3xl font-bold text-navy">
        Des tarifs simples, sans engagement
      </h1>
      <p className="mt-4 text-center text-slate-600">
        Commencez gratuitement, passez au plan supérieur quand vous en avez besoin.
      </p>
      <PricingTable />
    </section>
  );
}
