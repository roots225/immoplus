"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "immo-theme";

// Bascule clair/sombre de l'espace marketing.
// Le thème est appliqué via la classe .dark sur <html> (Tailwind darkMode:"class")
// et persisté en localStorage ; un script inline dans le layout l'applique
// avant le premier rendu pour éviter le flash.
export function ThemeToggle() {
  const [dark, setDark] = useState<boolean | null>(null);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
    } catch {
      // stockage indisponible (navigation privée) : le choix vaut pour la session
    }
  }

  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Passer en mode clair" : "Passer en mode sombre"}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-400/30 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-200"
    >
      {/* null au premier rendu serveur : on affiche la lune par défaut */}
      {dark === false ? (
        <Moon aria-hidden className="h-4 w-4" />
      ) : (
        <Sun aria-hidden className="h-4 w-4" />
      )}
    </button>
  );
}
