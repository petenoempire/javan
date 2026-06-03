import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Compass, Plus, MessageCircle, User, Bell, Users } from "lucide-react";
import { motion } from "motion/react";
import type { ReactNode } from "react";

const nav: { to: string; label: string; icon: typeof Home; primary?: boolean }[] = [
  { to: "/", label: "Home", icon: Home },
  { to: "/friends", label: "Friends", icon: Users },
  { to: "/discover", label: "Discover", icon: Compass },
  { to: "/create", label: "Create", icon: Plus, primary: true },
  { to: "/inbox", label: "Inbox", icon: MessageCircle },
  { to: "/notifications", label: "Alerts", icon: Bell },
  { to: "/profile", label: "Profile", icon: User },
];

export function MobileShell({ children, immersive = false }: { children: ReactNode; immersive?: boolean }) {
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="relative mx-auto min-h-[100dvh] max-w-[480px] overflow-hidden bg-background">
      <main className={immersive ? "h-[100dvh]" : "min-h-[100dvh] pb-28"}>{children}</main>

      {/* Floating glass bottom nav */}
      <nav className="fixed bottom-4 left-1/2 z-50 w-[min(460px,calc(100vw-1.5rem))] -translate-x-1/2">
        <div className="glass-strong flex items-center justify-around rounded-3xl px-1.5 py-2 shadow-elegant">
          {nav.map((item) => {
            const active = item.to === "/" ? path === "/" : path.startsWith(item.to);
            const Icon = item.icon;
            if (item.primary) {
              return (
                <Link key={item.to} to={item.to} className="relative -mt-6">
                  <div className="bg-gradient-primary flex h-13 w-13 items-center justify-center rounded-2xl shadow-glow transition-transform active:scale-90" style={{ height: 52, width: 52 }}>
                    <Icon className="h-6 w-6 text-primary-foreground" strokeWidth={2.5} />
                  </div>
                </Link>
              );
            }
            return (
              <Link key={item.to} to={item.to} className="relative flex flex-1 flex-col items-center gap-1 py-2">
                <Icon
                  className={`h-5 w-5 transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}
                  strokeWidth={active ? 2.4 : 1.8}
                />
                {active && (
                  <motion.span
                    layoutId="navdot"
                    className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-primary"
                  />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
