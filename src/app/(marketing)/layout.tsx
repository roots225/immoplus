import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

// Typos du design "Immo Plateforme — Accueil" : exposées en variables CSS
// pour les utilitaires Tailwind font-geist / font-display / font-mono.
const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});
const instrumentSerif = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

// Applique le thème persisté AVANT le premier rendu (anti-flash).
// Sombre par défaut — fidèle au design importé ; "light" si choisi via la bascule.
const THEME_SCRIPT = `try{var t=localStorage.getItem("immo-theme")||"dark";document.documentElement.classList.toggle("dark",t==="dark")}catch(e){}`;

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${geist.variable} ${geistMono.variable} ${instrumentSerif.variable} font-geist`}>
      <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      <Header />
      <main className="min-h-[calc(100vh-4rem)]">{children}</main>
      <Footer />
    </div>
  );
}
