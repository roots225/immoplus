import Link from "next/link";

const FOOTER_LINK = "transition-colors hover:text-slate-900 dark:hover:text-slate-200";

// Footer marketing — design "Immo Plateforme — Accueil", clair/sombre
export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-400/10 dark:bg-night-deepest dark:text-slate-400">
      <div className="mx-auto max-w-6xl px-6 pb-10 pt-14">
        <div className="grid gap-10 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-sky-400 to-sky-500 text-[13px] font-bold text-white dark:text-night-deepest">
                I
              </span>
              <span className="text-[15px] font-semibold text-slate-900 dark:text-slate-200">
                ImmoPlatform
              </span>
            </div>
            <p className="mt-3.5 max-w-[260px] text-[13px] leading-relaxed text-slate-500">
              L'analyse indépendante des annonces immobilières, fondée sur les données
              publiques. Par Astra Wave.
            </p>
          </div>
          <div className="flex flex-col gap-2.5 text-sm">
            <p className="mb-1 text-xs uppercase tracking-wider text-slate-500">Explorer</p>
            <Link href="/barometre" className={FOOTER_LINK}>
              Baromètre
            </Link>
            <Link href="/fonctionnalites" className={FOOTER_LINK}>
              Fonctionnalités
            </Link>
            <Link href="/immodeal" className={FOOTER_LINK}>
              Top Deals
            </Link>
            <Link href="/tarifs" className={FOOTER_LINK}>
              Offre agences
            </Link>
          </div>
          <div className="flex flex-col gap-2.5 text-sm">
            <p className="mb-1 text-xs uppercase tracking-wider text-slate-500">Légal</p>
            <Link href="/tarifs" className={FOOTER_LINK}>
              CGV
            </Link>
            <Link href="/" className={FOOTER_LINK}>
              Mentions légales
            </Link>
            <Link href="/" className={FOOTER_LINK}>
              Confidentialité
            </Link>
          </div>
          <div className="flex flex-col gap-2.5 text-sm">
            <p className="mb-1 text-xs uppercase tracking-wider text-slate-500">Contact</p>
            <a href="mailto:contact@astrawave.fr" className={FOOTER_LINK}>
              contact@astrawave.fr
            </a>
            <p className="text-xs leading-relaxed text-slate-500">
              Données DVF, ADEME, Géorisques, BAN, INSEE — licence Etalab.
            </p>
          </div>
        </div>
        <div className="mt-11 border-t border-slate-200 pt-6 text-[13px] text-slate-500 dark:border-slate-400/10 dark:text-slate-600">
          © {new Date().getFullYear()} Astra Wave · ImmoPlatform — Tous droits réservés
        </div>
      </div>
    </footer>
  );
}
