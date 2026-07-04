import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { Sidebar } from "@/components/layout/Sidebar";

// Pages par utilisateur (session Clerk + BDD) : jamais prérendues au build.
export const dynamic = "force-dynamic";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-100 bg-white px-6">
        <Link href="/dashboard" className="text-xl font-bold text-ink">
          Immo<span className="text-primary">Platform</span>
        </Link>
        <UserButton />
      </header>
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
