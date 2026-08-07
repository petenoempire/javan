import React, { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Home, Users, Plus, Mail, User, ArrowLeft } from "lucide-react";
import { SearchOverlay } from "./SearchOverlay";
import { useIsDesktop } from "@/hooks/use-is-desktop";
import { motion, AnimatePresence } from "motion/react";

interface MobileShellProps {
  children: ReactNode;
  immersive?: boolean;
  showBack?: boolean;
  backTo?: string;
}

/**
 * ABSOLUTE ROOT VISIBILITY CONSTRAINT:
 * The primary bottom tab navigation bar MUST ONLY be rendered and visible
 * when the user is actively viewing the primary root "Home" video feed ("/").
 * Friends, Inbox, Profile and ALL sub-pages unmount the bottom nav immediately.
 */
const BOTTOM_NAV_ALLOWED_PATHS = ["/"];

function shouldShowNav(pathname: string): boolean {
  return BOTTOM_NAV_ALLOWED_PATHS.includes(pathname);
}

/**
 * Drawer Nav Stack Fix: Back from settings/support/etc returns to Profile.
 * Back from Friends/Inbox returns to Home.
 */
function getBackTarget(pathname: string): string {
  if (pathname.startsWith("/settings")) return "/profile";
  if (pathname.startsWith("/help")) return "/profile";
  if (pathname.startsWith("/studio")) return "/profile";
  if (pathname.startsWith("/wallet")) return "/profile";
  if (pathname.startsWith("/rewards")) return "/profile";
  if (pathname.startsWith("/create")) return "/profile";
  if (pathname.startsWith("/notifications")) return "/profile";
  if (pathname.startsWith("/offline")) return "/profile";
  if (pathname.startsWith("/qr")) return "/profile";
  if (pathname.startsWith("/profile/viewers")) return "/profile";
  if (pathname.startsWith("/profile/edit")) return "/profile";
  if (pathname.startsWith("/artist")) return "/profile";
  if (pathname === "/friends" || pathname === "/inbox") return "/";
  return "/";
}

export function MobileShell({ children, immersive = false, showBack, backTo }: MobileShellProps) {
  const isDesktop = useIsDesktop();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const pathname = location.pathname;

  const showNav = !immersive && shouldShowNav(pathname);
  const showBackBtn = showBack !== undefined ? showBack : pathname !== "/";
  const backTarget = backTo ?? getBackTarget(pathname);

  if (isDesktop === true) return null;

  const navItems = [
    { icon: Home, label: "Home", href: "/", glow: "rgba(0, 212, 255, 0.5)" },
    { icon: Users, label: "Friends", href: "/friends", glow: "rgba(124, 58, 237, 0.5)" },
    { icon: Plus, label: "Create", href: "/create", isCenter: true },
    { icon: Mail, label: "Inbox", href: "/inbox", glow: "rgba(255, 0, 128, 0.5)" },
    { icon: User, label: "Profile", href: "/profile", glow: "rgba(255, 215, 0, 0.5)" },
  ];

  return (
    <div className="lg:hidden flex h-[100dvh] min-h-0 flex-col bg-[#020210] text-white relative overflow-hidden">
      {/* Aurora Background */}
      <div className="aurora-bg">
        <div
          className="aurora-ribbon"
          style={{ top: "20%", opacity: 0.3, filter: "blur(80px)" }}
        ></div>
        <div
          className="aurora-ribbon"
          style={{ top: "60%", animationDelay: "-8s", opacity: 0.2, filter: "blur(80px)" }}
        ></div>
      </div>

      {/* Main Content */}
      <main
        className={`min-h-0 flex-1 overflow-y-auto overscroll-contain scroll-smooth no-scrollbar ${showNav ? "pb-20" : "pb-4"}`}
      >
        {children}
      </main>

      {/* Search Overlay */}
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* UNIFIED TOP-LEFT BACK BUTTON MATRIX
       * High-contrast glowing back arrow auto-renders on all non-home views.
       * Tapping pops the view stack layer backwards cleanly.
       */}
      {showBackBtn && !showNav && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="fixed top-0 left-0 right-0 z-50 pointer-events-none"
        >
          <div className="flex items-center px-4 pt-4 pointer-events-auto">
            <button
              onClick={() => navigate({ to: backTarget as any })}
              className="flex items-center justify-center h-10 w-10 rounded-full bg-black/60 backdrop-blur-xl border border-cyan-500/30 shadow-[0_0_15px_rgba(0,212,255,0.3)] active:scale-90 transition-all"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5 text-white drop-shadow-[0_0_6px_rgba(0,212,255,0.8)]" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Bottom Navigation Bar — ONLY on Home root view */}
      <AnimatePresence>
        {showNav && (
          <motion.nav
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
          >
            <div className="pointer-events-auto flex h-14 w-full max-w-[360px] items-center justify-around rounded-2xl border border-white/10 bg-black/70 px-2 py-2 shadow-[0_8px_30px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
              {navItems.map((item) => {
                const isActive = location.pathname === item.href;
                if (item.isCenter) {
                  return (
                    <Link
                      key={item.label}
                      to={item.href}
                      search={item.isCenter ? { mode: "live" } : undefined}
                      aria-label={item.label}
                      className="relative -top-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 via-purple-600 to-cyan-500 shadow-[0_0_18px_rgba(255,0,128,0.4)] active:scale-90 transition-transform"
                    >
                      <Plus className="h-6 w-6 text-white" />
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
                    <div
                      className={`p-2 rounded-full transition-all duration-300 ${isActive ? "bg-white/10" : "group-active:scale-90"}`}
                    >
                      <item.icon
                        className={`h-5 w-5 transition-all duration-300 ${
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
          </motion.nav>
        )}
      </AnimatePresence>
    </div>
  );
}
