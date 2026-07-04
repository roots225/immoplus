import type { Config } from "tailwindcss";

// Charte "azur" (refonte juillet 2026, inspirée dashboard sports) :
// les noms historiques navy/teal sont conservés comme alias pour ne pas
// réécrire les pages — seules les VALEURS changent (déviation CLAUDE.md §9
// actée : teal → bleu azur, navy → encre).
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  // Mode sombre piloté par la classe .dark sur <html> (bascule marketing)
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Tokens officiels de la charte
        primary: {
          DEFAULT: "#1E9BF0", // bleu azur — CTAs, liens, sélection
          dark: "#1876C8",
          soft: "#E8F4FE", // fonds d'état actif / hover
        },
        ink: "#0F1729", // titres, texte fort
        muted: "#8B95A5", // labels secondaires
        surface: "#F1F4F8", // fond de page
        pill: "#12213B", // badges sombres en pilule

        // Alias historiques (mêmes valeurs que ci-dessus)
        navy: "#0F1729",
        teal: {
          DEFAULT: "#1E9BF0",
          dark: "#1876C8",
        },
        gold: "#F59E0B",
        score: {
          good: "#10B981",
          medium: "#F59E0B",
          bad: "#EF4444",
        },
        // Landing dark (design Claude "Immo Plateforme — Accueil")
        night: {
          DEFAULT: "#0F172A", // fond de page
          deep: "#0C1425", // sections alternées
          deepest: "#0B1120", // footer
          card: "#131D36", // cartes / inputs
        },
      },
      fontFamily: {
        geist: ["var(--font-geist)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        card: "1.25rem", // 20px — cartes de la charte
      },
    },
  },
  plugins: [],
};

export default config;
