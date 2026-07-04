import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { frFR } from "@clerk/localizations";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "ImmoPlatform — Le score de confiance de votre achat immobilier",
    template: "%s · ImmoPlatform",
  },
  description:
    "Analysez n'importe quelle annonce immobilière en 30 secondes : score IA /100, prix vs marché DVF, DPE, risques, transports. Par Astra Wave.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider localization={frFR}>
      <html lang="fr">
        <body className={`${inter.className} min-h-screen bg-surface text-slate-900 antialiased`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
