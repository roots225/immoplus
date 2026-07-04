import type { Metadata } from "next";
import { RenovUploadForm } from "@/features/renovai/components/RenovUploadForm";

export const metadata: Metadata = { title: "RenovAI" };

export default function RenovAIPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold text-navy">Estimer des travaux par photo</h1>
      <p className="mt-2 text-sm text-slate-600">
        Ajoutez jusqu'à 5 photos du bien. Notre IA identifie les travaux nécessaires et
        estime une fourchette de budget par poste (prix France 2026, TTC).
      </p>
      <RenovUploadForm />
    </div>
  );
}
