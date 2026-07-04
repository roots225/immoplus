import type { Metadata } from "next";
import { AnalyseForm } from "@/features/immoscore/components/AnalyseForm";

export const metadata: Metadata = { title: "ImmoScore" };

export default function ImmoScorePage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold text-navy">Analyser une annonce</h1>
      <p className="mt-2 text-sm text-slate-600">
        Collez l'URL d'une annonce (SeLoger, Leboncoin, PAP…). L'analyse croise les
        transactions DVF, le DPE ADEME, Géorisques, les transports et le quartier.
      </p>
      <AnalyseForm />
    </div>
  );
}
