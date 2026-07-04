import type { Metadata } from "next";
import { BarometreExplorer } from "@/features/barometre/BarometreExplorer";

export const metadata: Metadata = { title: "Baromètre des prix" };

// Page publique — carte des prix du marché alimentée par DVF (GET /api/barometre)
export default function BarometrePage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-center text-3xl font-bold text-navy">Baromètre des prix du marché</h1>
      <p className="mt-4 text-center text-slate-600">
        Médianes calculées sur les transactions réelles DVF (Etalab), rayon de 500 m.
      </p>
      <BarometreExplorer />
    </section>
  );
}
