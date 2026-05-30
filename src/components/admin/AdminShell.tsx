import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Users, Film, DollarSign, Settings, Shield, LogOut, ArrowLeft, ShieldCheck, Flag, ArrowDownToLine } from "lucide-react";
import { useAuth } from "@/lib/auth";
import type { ReactNode } from "react";

const nav: Array<{ to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean }> = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/verifications", label: "Verifications", icon: ShieldCheck },
  { to: "/admin/reports", label: "Reports", icon: Flag },
  { to: "/admin/content", label: "Content", icon: Film },
  { to: "/admin/revenue", label: "Revenue", icon: DollarSign },
  { to: "/admin/payouts", label: "Payouts", icon: ArrowDownToLine },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminShell({ children, title, subtitle }: { children: ReactNode; title: string; subtitle?: string }) {
  const { profile, signOut } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-primary flex h-8 w-8 items-center justify-center rounded-xl shadow-glow">
              <Shield className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="leading-tight">
              <div className="font-display text-sm font-bold tracking-wide">ADMIRALTY</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Admin Console</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/" className="glass hidden items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium md:flex">
              <ArrowLeft className="h-3 w-3" /> Back to app
            </Link>
            <div className="hidden text-right md:block">
              <div className="text-xs font-semibold">{profile?.display_name ?? "Admin"}</div>
              <div className="text-[10px] text-muted-foreground">@{profile?.handle ?? "admin"}</div>
            </div>
            <button onClick={() => signOut()} className="glass flex h-8 w-8 items-center justify-center rounded-full" title="Sign out">
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 lg:px-8">
        <aside className="hidden w-56 shrink-0 lg:block">
          <nav className="sticky top-20 space-y-1">
            {nav.map((n) => {
              const active = n.exact ? path === n.to : path.startsWith(n.to);
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                    active ? "bg-gradient-primary text-primary-foreground shadow-glow" : "hover:bg-muted"
                  }`}
                >
                  <n.icon className="h-4 w-4" />
                  {n.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 pb-24 lg:pb-6">
          <div className="mb-6">
            <h1 className="font-display text-2xl font-bold md:text-3xl">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {children}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur-xl lg:hidden">
        <div className="no-scrollbar flex overflow-x-auto">
          {nav.map((n) => {
            const active = n.exact ? path === n.to : path.startsWith(n.to);
            return (
              <Link key={n.to} to={n.to} className={`flex min-w-[72px] flex-1 flex-col items-center gap-1 py-2.5 text-[10px] ${active ? "text-primary" : "text-muted-foreground"}`}>
                <n.icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
