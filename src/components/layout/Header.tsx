import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { ThemeToggle } from "@/features/marketing/components/ThemeToggle";

const NAV_LINK =
  "transition-colors hover:text-slate-900 dark:hover:text-slate-200";
const CTA =
  "whitespace-nowrap rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-600 dark:bg-sky-400 dark:text-night-deepest dark:hover:bg-sky-300";

// Header marketing — design "Immo Plateforme — Accueil", clair/sombre
export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/85 backdrop-blur-md dark:border-slate-400/10 dark:bg-night/85">
      <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between gap-6 px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-gradient-to-br from-sky-400 to-sky-500 text-[15px] font-bold text-white dark:text-night-deepest">
            I
          </span>
          <span className="text-[17px] font-semibold tracking-tight text-slate-900 dark:text-slate-200">
            ImmoPlatform
          </span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-slate-600 dark:text-slate-400 md:flex">
          <Link href="/" className="text-slate-900 dark:text-slate-200">
            Accueil
          </Link>
          <Link href="/fonctionnalites" className={NAV_LINK}>
            Fonctionnalités
          </Link>
          <Link href="/tarifs" className={NAV_LINK}>
            Tarifs
          </Link>
          <Link href="/barometre" className={NAV_LINK}>
            Baromètre
          </Link>
          <Link href="/immodeal" className={NAV_LINK}>
            Top Deals
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <SignedOut>
            <Link
              href="/sign-in"
              className="hidden text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 sm:block"
            >
              Connexion
            </Link>
            <Link href="/sign-up" className={CTA}>
              Analyser une annonce
            </Link>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard" className={CTA}>
              Tableau de bord
            </Link>
            <UserButton />
          </SignedIn>
        </div>
      </div>
    </header>
  );
}
