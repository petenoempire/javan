import React, { ReactNode, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { Home, Users, Plus, Mail, User, Search } from "lucide-react";
import { SearchOverlay } from "./SearchOverlay";
import { useIsDesktop } from "@/hooks/use-is-desktop";

interface MobileShellProps {
  children: ReactNode;
  immersive?: boolean;
}

/**
 * Routes where the bottom navigation bar should be HIDDEN.
 * Root views that SHOW the nav: "/", "/friends", "/inbox", "/profile"
 * Everything else unmounts the bottom nav to prevent visual clutter.
 */
const ROOT_VIEWS = ["/", "/friends", "/inbox", "/profile"];

function shouldShowNav(pathname: string): boolean {
  return ROOT_VIEWS.includes(pathname);
}

export function MobileShell({ children, immersive = false }: MobileShellProps) {
  const isDesktop = useIsDesktop();
  const location = useLocation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const pathname = location.pathname;

  const showNav = !immersive && shouldShowNav(pathname);
  const isHomepage = pathname === "/";

  if (isDesktop === true) return null;

  const navItems = [
    { icon: Home, label: "Home", href: "/", glow: "rgba(0, 212, 255, 0.5)" },
    { icon: Users, label: "Friends", href: "/friends", glow: "rgba(124, 58, 237, 0.5)" },
    { icon: Plus, label: "Create", href: "/create", isCenter: true },
    { icon: Mail, label: "Inbox", href: "/inbox", glow: "rgba(255, 0, 128, 0.5)" },
    { icon: User, label: "Profile", href: "/profile", glow: "rgba(255, 215, 0, 0.5)" },
  ];

  return (
    <div className="lg:hidden flex flex-col min-h-[100dvh] bg-[#020210] text-white relative overflow-hidden">
      {/* Immersive Background Effects */}
      <div className="aurora-bg">
        <div className="aurora-ribbon" style={{ top: '20%', opacity: 0.3, filter: 'blur(80px)' }}></div>
        <div className="aurora-ribbon" style={{ top: '60%', animationDelay: '-8s', opacity: 0.2, filter: 'blur(80px)' }}></div>
      </div>

      {/* Main Content Area */}
      <main className={`flex-1 overflow-y-auto no-scrollbar ${immersive ? "" : showNav ? "pb-24" : "pb-4"}`}>
        {children}
      </main>

      {/* Search Overlay */}
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Bottom Navigation Bar — ONLY on root views */}
      {showNav && (
        <nav className="fixed bottom-6 left-5 right-5 z-50">
          <div className="glass-strong rounded-[2.5rem] px-4 py-3 flex items-center justify-around border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.6)]">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;

              if (item.isCenter) {
                return (
                  <Link
                    key={item.label}
                    to={item.href}
                    aria-label={item.label}
                    className="relative -top-6 flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-rose-500 via-purple-600 to-cyan-500 shadow-[0_0_25px_rgba(255,0,128,0.4)] active:scale-90 transition-transform"
                  >
                    <Plus className="h-8 w-8 text-white" />
                  </Link>
                );
              }

              return (
                <Link
                  key={item.label}
                  to={item.href}
                  aria-label={item.label}
                  className="relative flex flex-col items-center gap-1 group"
                >
                  <div className={`p-2 rounded-full transition-all duration-300 ${isActive ? "bg-white/10" : "group-active:scale-90"}`}>
                    <item.icon
                      className={`h-6 w-6 transition-all duration-300 ${
                        isActive ? "text-white" : "text-white/40 group-hover:text-white/70"
                      }`}
                      style={isActive ? { filter: `drop-shadow(0 0 8px ${item.glow})` } : {}}
                    />
                  </div>
                  {isActive && (
                    <div
                      className="absolute -bottom-1 w-1 h-1 rounded-full"
                      style={{ backgroundColor: item.glow, boxShadow: `0 0 8px ${item.glow}` }}
                    ></div>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
