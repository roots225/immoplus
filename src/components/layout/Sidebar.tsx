"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Building2,
  Flame,
  LayoutDashboard,
  Search,
  Settings,
  Target,
  User,
  Wrench,
  type LucideIcon,
} from "lucide-react";

const NAV_SECTIONS: Array<{
  title: string;
  items: Array<{ href: string; label: string; icon: LucideIcon }>;
}> = [
  {
    title: "Analyse",
    items: [
      { href: "/dashboard", label: "Vue d'ensemble", icon: LayoutDashboard },
      { href: "/immoscore", label: "ImmoScore", icon: Target },
      { href: "/renovai", label: "RenovAI", icon: Wrench },
    ],
  },
  {
    title: "Marché",
    items: [
      { href: "/immodeal", label: "ImmoDeal", icon: Flame },
      { href: "/alertes", label: "Alertes", icon: Bell },
    ],
  },
  {
    title: "Espace pro",
    items: [{ href: "/agence-pro", label: "AgencePro", icon: Building2 }],
  },
  {
    title: "Compte",
    items: [
      { href: "/profil", label: "Profil", icon: User },
      { href: "/parametres", label: "Paramètres", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="no-scrollbar sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 overflow-y-auto border-r border-slate-100 bg-white md:block">
      <div className="p-4">
        <label className="flex items-center gap-2 rounded-full bg-surface px-4 py-2.5">
          <Search aria-hidden className="h-4 w-4 shrink-0 text-muted" />
          <input
            type="search"
            placeholder="Rechercher…"
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted"
          />
        </label>

        <nav className="mt-4 space-y-5">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title}>
              <p className="px-4 text-xs font-semibold uppercase tracking-wide text-muted">
                {section.title}
              </p>
              <div className="mt-1.5 space-y-1">
                {section.items.map((item) => {
                  const active = pathname.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors ${
                        active
                          ? "bg-primary-soft text-primary-dark"
                          : "text-slate-600 hover:bg-surface"
                      }`}
                    >
                      <Icon
                        aria-hidden
                        className={`h-4 w-4 shrink-0 ${active ? "text-primary" : "text-muted"}`}
                      />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}
