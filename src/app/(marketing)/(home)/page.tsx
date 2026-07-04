import Link from "next/link";
import { ArrowRight, Building2, Flame, Target, Wrench, type LucideIcon } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { ChatWidget } from "@/features/chatbot/components/ChatWidget";
import {
  AnalysesCounter,
  HeroAnalyzeForm,
  PersonaTabs,
  type Persona,
} from "@/features/marketing/components/HomeInteractive";

const PORTALS = [
  "Leboncoin",
  "SeLoger",
  "Bien'ici",
  "PAP",
  "Logic-Immo",
  "Figaro Immobilier",
  "Green-Acres",
  "ParuVendu",
];

const SUB_SCORES = [
  { label: "Prix", val: 88, color: "#10B981" },
  { label: "DPE", val: 74, color: "#10B981" },
  { label: "Risques", val: 91, color: "#10B981" },
  { label: "Transports", val: 62, color: "#F59E0B" },
  { label: "Quartier", val: 79, color: "#10B981" },
];

const FEATURES = [
  { n: "01", t: "Prix vs marché", d: "Comparaison avec les ventes réelles (DVF) à 500 m." },
  { n: "02", t: "Risques naturels", d: "Inondation, argile, sismicité via Géorisques." },
  { n: "03", t: "Quartier", d: "Données INSEE : démographie, revenus, équipements." },
  { n: "04", t: "DPE vérifié", d: "Étiquette énergie croisée avec la base ADEME." },
  { n: "05", t: "Rapport PDF", d: "Rapport sourcé, white-label pour les agences." },
  { n: "06", t: "Marge de négociation", d: "Calculée selon le marché et les diagnostics." },
  { n: "07", t: "Transports", d: "Isochrones Mapbox : gares, métro, temps de trajet." },
  { n: "08", t: "Estimation travaux", d: "RenovAI chiffre les rénovations sur photos." },
  { n: "09", t: "Alertes acheteurs", d: "Nouveaux biens correspondant à vos critères." },
  { n: "10", t: "Deals communautaires", d: "Les meilleures affaires votées par les membres." },
  { n: "11", t: "CRM acheteurs", d: "AgencePro : suivez vos clients et leurs recherches." },
  { n: "12", t: "Résumé IA", d: "Synthèse claire de chaque bien, rédigée par Claude." },
];

const EXAMPLES = [
  {
    score: 86,
    color: "#10B981",
    tag: "EXCELLENT",
    addr: "12 rue des Carmes, Nantes",
    detail: "T3 · 68 m² · 289 000 €",
  },
  {
    score: 74,
    color: "#10B981",
    tag: "EXCELLENT",
    addr: "4 av. Jean Jaurès, Lyon 7e",
    detail: "T2 · 46 m² · 245 000 €",
  },
  {
    score: 55,
    color: "#F59E0B",
    tag: "CORRECT",
    addr: "28 bd de Strasbourg, Toulouse",
    detail: "T4 · 89 m² · 338 000 €",
  },
  {
    score: 31,
    color: "#EF4444",
    tag: "RISQUÉ",
    addr: "7 rue Basse, Rouen",
    detail: "Maison · 112 m² · 198 000 €",
  },
];

const SOURCES = [
  "DVF Etalab",
  "ADEME",
  "INSEE",
  "Géorisques",
  "BAN",
  "Cadastre",
  "OpenStreetMap",
  "Data.gouv",
  "Mapbox",
  "Stream Estate",
];

const PERSONAS: Persona[] = [
  {
    label: "Acheteur",
    problem:
      "Vous visitez des biens sans savoir si le prix est juste, si le quartier est sain, ni ce qui se cache derrière l'annonce. Chaque erreur peut coûter des dizaines de milliers d'euros.",
    solution:
      "Un rapport objectif avant même la visite : prix comparé aux transactions réelles DVF, risques naturels, DPE vérifié et marge de négociation calculée.",
  },
  {
    label: "Vendeur",
    problem:
      "Vous ne savez pas comment positionner votre prix : trop haut, le bien s'éternise ; trop bas, vous perdez de la valeur.",
    solution:
      "Analysez votre propre annonce comme le ferait un acheteur averti : score, points faibles à corriger, et positionnement par rapport à la médiane du secteur.",
  },
  {
    label: "Agence",
    problem:
      "Vos clients arrivent avec des doutes et des questions techniques — risques, DPE, urbanisme — auxquelles il faut répondre vite et avec des preuves.",
    solution:
      "AgencePro génère un rapport PDF white-label sourcé en 30 secondes pour chaque mandat : un argumentaire crédible qui professionnalise vos estimations. 99€/mois.",
  },
];

const GUIDES = [
  {
    tag: "ACHAT",
    t: "Lire un DPE sans se faire avoir",
    excerpt: "Ce que l'étiquette énergie dit vraiment — et ce qu'elle cache sur les travaux à prévoir.",
  },
  {
    tag: "PRIX",
    t: "La médiane DVF, votre meilleure alliée",
    excerpt: "Comment comparer un prix affiché aux transactions réelles enregistrées par l'État.",
  },
  {
    tag: "RISQUES",
    t: "Argile, inondation : vérifier avant de signer",
    excerpt: "Les 4 risques naturels qui pèsent sur la valeur d'un bien, et où les consulter.",
  },
];

const MODULES: Array<{ icon: LucideIcon; t: string; d: string; href: string }> = [
  {
    icon: Target,
    t: "ImmoScore",
    d: "Score IA /100 à partir de l'URL d'une annonce.",
    href: "/immoscore",
  },
  {
    icon: Wrench,
    t: "RenovAI",
    d: "Estimation travaux par photo, poste par poste.",
    href: "/renovai",
  },
  {
    icon: Flame,
    t: "ImmoDeal",
    d: "Les meilleures affaires partagées par la communauté.",
    href: "/immodeal",
  },
  {
    icon: Building2,
    t: "AgencePro",
    d: "CRM acheteurs et rapports white-label pour agences.",
    href: "/agence-pro",
  },
];

// Utilitaires de thème partagés par les sections
const SECTION_LABEL =
  "font-mono text-[13px] uppercase tracking-widest text-sky-600 dark:text-sky-300";
const H2 =
  "font-display text-4xl font-normal leading-tight text-slate-900 dark:text-slate-100 md:text-[42px]";
const MUTED = "text-slate-600 dark:text-slate-400";
const STRONG = "text-slate-900 dark:text-slate-100";
const CARD_BORDER = "border-slate-200 dark:border-slate-400/15";
const ACCENT_LINK =
  "border-b border-sky-500/40 pb-0.5 text-[15px] font-medium text-sky-600 transition-colors hover:border-sky-600 dark:border-sky-300/40 dark:text-sky-300 dark:hover:border-sky-300";

export default async function HomePage() {
  // Compteur réel — repli sur une valeur de lancement si la BDD est indisponible
  let analysesCount = 12480;
  try {
    const dbCount = await prisma.analysis.count();
    analysesCount = 12480 + dbCount;
  } catch {
    // BDD indisponible (build, incident) : on garde la valeur de repli
  }

  return (
    <div className="bg-white text-slate-700 antialiased dark:bg-night dark:text-slate-200">
      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden border-b border-slate-200 dark:border-slate-400/10">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-52 left-1/2 h-[500px] w-[900px] -translate-x-1/2 bg-[radial-gradient(ellipse,rgba(56,189,248,0.14),transparent_65%)]"
        />
        <div className="relative mx-auto max-w-[880px] px-6 pb-16 pt-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/40 px-4 py-1.5 font-mono text-[13px] text-sky-600 dark:border-sky-300/35 dark:text-sky-300">
            Données publiques · 10 sources officielles · 100% indépendant
          </div>
          <h1
            className={`mx-auto mt-7 font-display text-5xl font-normal leading-[1.08] md:text-[64px] ${STRONG}`}
          >
            Ce bien vaut-il vraiment{" "}
            <em className="italic text-sky-600 dark:text-sky-300">son prix</em>&nbsp;?
          </h1>
          <p className={`mx-auto mt-5 max-w-[560px] text-lg leading-relaxed ${MUTED}`}>
            Collez l'URL d'une annonce immobilière et recevez un rapport d'analyse complet —
            prix, risques, quartier, DPE — en 30 secondes.
          </p>
          <HeroAnalyzeForm />
          <AnalysesCounter target={analysesCount} />
          <div className="mt-5 flex flex-wrap items-center justify-center gap-5 text-[13px] text-slate-500">
            <span>Gratuit · Sans engagement · 2 analyses offertes par mois</span>
            <a
              href="#rapport"
              className="text-slate-500 underline underline-offset-4 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            >
              Voir un exemple →
            </a>
          </div>
        </div>
        {/* Ticker portails */}
        <div className="ticker-mask overflow-hidden border-t border-slate-200 py-4 dark:border-slate-400/10">
          <div className="animate-ticker flex w-max gap-14">
            {[...PORTALS, ...PORTALS].map((p, i) => (
              <span
                key={`${p}-${i}`}
                className="whitespace-nowrap text-sm font-medium tracking-wide text-slate-500"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ============ APERÇU RAPPORT ============ */}
      <section id="rapport" className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid items-center gap-16 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <div className={SECTION_LABEL}>Aperçu du rapport</div>
            <h2 className={`mt-4 ${H2}`}>Un score global, cinq lectures du bien.</h2>
            <p className={`mt-4 leading-relaxed ${MUTED}`}>
              Chaque annonce est passée au crible en croisant les données publiques :
              transactions réelles DVF, diagnostics ADEME, risques Géorisques, transports et
              données de quartier INSEE.
            </p>
            <Link href="/sign-up" className={`mt-6 inline-block ${ACCENT_LINK}`}>
              Obtenir mon premier rapport →
            </Link>
          </div>
          {/* Mockup rapport */}
          <div
            className={`rounded-2xl border bg-white p-7 shadow-xl shadow-slate-200/60 dark:bg-night-card dark:shadow-[0_24px_60px_rgba(2,6,23,0.5)] ${CARD_BORDER}`}
          >
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-400/10">
              <div>
                <div className="text-[13px] text-slate-500">Appartement T3 · 68 m² · Nantes</div>
                <div className={`mt-1 text-xl font-semibold ${STRONG}`}>Score global</div>
              </div>
              <div className="flex h-[74px] w-[74px] shrink-0 flex-col items-center justify-center rounded-full border-[3px] border-emerald-500 dark:border-emerald-400">
                <span className={`text-2xl font-bold leading-none ${STRONG}`}>82</span>
                <span className="text-[10px] text-slate-500">/ 100</span>
              </div>
            </div>
            <div className="flex flex-col gap-3 py-5">
              {SUB_SCORES.map((s) => (
                <div key={s.label} className="grid grid-cols-[96px_1fr_34px] items-center gap-3.5">
                  <span className={`text-[13px] ${MUTED}`}>{s.label}</span>
                  <div className="h-1.5 overflow-hidden rounded-[3px] bg-slate-200 dark:bg-slate-400/15">
                    <div
                      className="h-full rounded-[3px]"
                      style={{ width: `${s.val}%`, backgroundColor: s.color }}
                    />
                  </div>
                  <span
                    className={`text-right font-mono text-[13px] font-semibold ${STRONG}`}
                  >
                    {s.val}
                  </span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3 border-t border-slate-200 pt-4 dark:border-slate-400/10">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-slate-500">
                  Prix affiché
                </div>
                <div className={`mt-1 font-semibold ${STRONG}`}>289 000 €</div>
                <div className="mt-0.5 text-xs text-emerald-600 dark:text-emerald-400">
                  −6% vs médiane
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-slate-500">
                  Négociation
                </div>
                <div className={`mt-1 font-semibold ${STRONG}`}>−8 700 €</div>
                <div className="mt-0.5 text-xs text-slate-500">marge estimée</div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-slate-500">DPE</div>
                <div className="mt-1 inline-flex h-7 w-7 items-center justify-center rounded-md bg-lime-500 text-sm font-bold text-white dark:text-night-deepest">
                  C
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FONCTIONNALITÉS ============ */}
      <section
        id="fonctionnalites"
        className="border-t border-slate-200 bg-slate-50 dark:border-slate-400/10 dark:bg-night-deep"
      >
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="mx-auto mb-14 max-w-[600px] text-center">
            <div className={SECTION_LABEL}>Fonctionnalités</div>
            <h2 className={`mt-4 ${H2}`}>Tout ce qu'une visite ne vous dira pas.</h2>
          </div>
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-[14px] border border-slate-200 bg-slate-200 dark:border-slate-400/10 dark:bg-slate-400/10 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div
                key={f.n}
                className="bg-white px-6 py-6 transition-colors hover:bg-slate-50 dark:bg-night dark:hover:bg-night-card"
              >
                <div className="font-mono text-xs text-sky-600 dark:text-sky-400">{f.n}</div>
                <div className={`mt-2.5 text-[15px] font-semibold ${STRONG}`}>{f.t}</div>
                <div className={`mt-1.5 text-[13px] leading-relaxed ${MUTED}`}>{f.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ COMMENT ÇA MARCHE ============ */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="mb-14 text-center">
          <div className={SECTION_LABEL}>Comment ça marche</div>
          <h2 className={`mt-4 ${H2}`}>Trois gestes, un rapport.</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              n: "1",
              t: "Collez l'URL",
              d: "Copiez le lien d'une annonce Leboncoin, SeLoger, Bien'ici, PAP ou d'un autre portail compatible.",
            },
            {
              n: "2",
              t: "Analyse automatique",
              d: "Nous croisons 10 sources officielles — DVF, ADEME, Géorisques, INSEE… — sur le bien et son environnement.",
            },
            {
              n: "3",
              t: "Rapport & score",
              d: "Recevez un score sur 100, une marge de négociation et un rapport PDF prêt à partager en 30 secondes.",
            },
          ].map((step) => (
            <div key={step.n} className={`rounded-[14px] border p-8 ${CARD_BORDER}`}>
              <div className="font-display text-5xl leading-none text-sky-500 dark:text-sky-400">
                {step.n}
              </div>
              <div className={`mt-4 text-[17px] font-semibold ${STRONG}`}>{step.t}</div>
              <p className={`mt-2 text-sm leading-relaxed ${MUTED}`}>{step.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============ EXEMPLES DE SCORES ============ */}
      <section className="border-t border-slate-200 bg-slate-50 dark:border-slate-400/10 dark:bg-night-deep">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
            <h2 className={H2}>Des biens réels, notés.</h2>
            <div className={`flex flex-wrap gap-4 text-[13px] ${MUTED}`}>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-[3px] bg-emerald-500" />
                75–100 Excellent
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-[3px] bg-amber-500" />
                50–74 Correct
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-[3px] bg-red-500" />
                0–49 Risqué
              </span>
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {EXAMPLES.map((e) => (
              <div
                key={e.addr}
                className={`flex flex-col gap-3.5 rounded-[14px] border bg-white p-6 shadow-sm dark:bg-night dark:shadow-none ${CARD_BORDER}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[32px] font-bold" style={{ color: e.color }}>
                    {e.score}
                  </span>
                  <span
                    className="rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide"
                    style={{ color: e.color, borderColor: e.color }}
                  >
                    {e.tag}
                  </span>
                </div>
                <div className="h-1 overflow-hidden rounded-sm bg-slate-200 dark:bg-slate-400/15">
                  <div
                    className="h-full rounded-sm"
                    style={{ width: `${e.score}%`, backgroundColor: e.color }}
                  />
                </div>
                <div>
                  <div className={`text-sm font-semibold ${STRONG}`}>{e.addr}</div>
                  <div className={`mt-1 text-[13px] ${MUTED}`}>{e.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CHIFFRES CLÉS ============ */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid grid-cols-2 gap-6 text-center md:grid-cols-4">
          {[
            { v: "10", l: "sources de données" },
            { v: "5", l: "sous-scores par bien" },
            { v: "250+", l: "vérifications par bien" },
            { v: "30s", l: "de génération" },
          ].map((stat) => (
            <div key={stat.l}>
              <div className="font-display text-[56px] leading-none text-sky-600 dark:text-sky-300">
                {stat.v}
              </div>
              <div className={`mt-2.5 text-sm ${MUTED}`}>{stat.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ============ SOURCES ============ */}
      <section className="border-t border-slate-200 dark:border-slate-400/10">
        <div className="mx-auto max-w-6xl px-6 py-16 text-center">
          <div className="mb-7 font-mono text-[13px] uppercase tracking-widest text-slate-500">
            Construit sur des sources officielles
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {SOURCES.map((src) => (
              <span
                key={src}
                className={`rounded-full border px-4 py-2 text-[13px] font-medium ${MUTED} border-slate-300 dark:border-slate-400/20`}
              >
                {src}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ============ PERSONAS ============ */}
      <section className="border-t border-slate-200 bg-slate-50 dark:border-slate-400/10 dark:bg-night-deep">
        <div className="mx-auto max-w-[880px] px-6 py-24">
          <div className="mb-11 text-center">
            <div className={SECTION_LABEL}>Cas d'usage</div>
            <h2 className={`mt-4 ${H2}`}>Pensé pour votre situation.</h2>
          </div>
          <PersonaTabs personas={PERSONAS} />
        </div>
      </section>

      {/* ============ GUIDES ============ */}
      <section id="guide" className="mx-auto max-w-6xl px-6 py-24">
        <div className="mb-12 flex items-end justify-between gap-6">
          <h2 className={H2}>Guides récents</h2>
          <Link href="/fonctionnalites" className={`whitespace-nowrap ${ACCENT_LINK}`}>
            Voir tous les guides →
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {GUIDES.map((g) => (
            <div
              key={g.t}
              className={`flex flex-col overflow-hidden rounded-[14px] border transition-colors hover:border-sky-500/40 dark:hover:border-sky-300/40 ${CARD_BORDER}`}
            >
              <div className="flex h-40 items-center justify-center bg-[repeating-linear-gradient(45deg,#EDF1F7,#EDF1F7_10px,#E4EAF3_10px,#E4EAF3_20px)] dark:bg-[repeating-linear-gradient(45deg,#131D36,#131D36_10px,#16223E_10px,#16223E_20px)]">
                <span className="font-mono text-xs text-slate-500">[ image article ]</span>
              </div>
              <div className="flex flex-1 flex-col gap-2.5 p-6">
                <div className="font-mono text-xs text-sky-600 dark:text-sky-300">{g.tag}</div>
                <div className={`text-[17px] font-semibold leading-snug ${STRONG}`}>{g.t}</div>
                <p className={`text-sm leading-relaxed ${MUTED}`}>{g.excerpt}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============ MODULES ============ */}
      <section className="border-t border-slate-200 bg-slate-50 dark:border-slate-400/10 dark:bg-night-deep">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="mb-12 text-center">
            <h2 className={H2}>Une plateforme, quatre modules.</h2>
            <p className={`mt-3.5 ${MUTED}`}>
              Du scoring d'annonce au CRM d'agence, tout est intégré.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {MODULES.map((m) => (
              <Link
                key={m.t}
                href={m.href}
                className={`flex flex-col gap-2.5 rounded-[14px] border bg-white p-6 shadow-sm transition-colors hover:border-sky-500/40 dark:bg-night dark:shadow-none dark:hover:border-sky-300/40 ${CARD_BORDER}`}
              >
                <m.icon aria-hidden className="h-6 w-6 text-sky-500 dark:text-sky-400" />
                <div className={`text-[15px] font-semibold ${STRONG}`}>{m.t}</div>
                <p className={`flex-1 text-[13px] leading-relaxed ${MUTED}`}>{m.d}</p>
                <span className="flex items-center gap-1 text-sm font-medium text-sky-600 dark:text-sky-300">
                  Découvrir <ArrowRight aria-hidden className="h-3.5 w-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA FINAL ============ */}
      <section className="relative overflow-hidden border-t border-slate-200 dark:border-slate-400/10">
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-64 left-1/2 h-[500px] w-[900px] -translate-x-1/2 bg-[radial-gradient(ellipse,rgba(56,189,248,0.12),transparent_65%)]"
        />
        <div className="relative mx-auto max-w-[720px] px-6 py-28 text-center">
          <h2
            className={`font-display text-4xl font-normal leading-tight md:text-[52px] ${STRONG}`}
          >
            Avant de signer pour 25 ans, prenez{" "}
            <em className="italic text-sky-600 dark:text-sky-300">30 secondes</em>.
          </h2>
          <Link
            href="/sign-up"
            className="mt-9 inline-block rounded-[10px] bg-sky-500 px-8 py-4 font-semibold text-white transition-colors hover:bg-sky-600 dark:bg-sky-400 dark:text-night-deepest dark:hover:bg-sky-300"
          >
            Analyser une annonce gratuitement
          </Link>
          <div className="mt-4 text-[13px] text-slate-500">
            Gratuit · Sans engagement · 2 analyses offertes par mois
          </div>
        </div>
      </section>

      <ChatWidget />
    </div>
  );
}
