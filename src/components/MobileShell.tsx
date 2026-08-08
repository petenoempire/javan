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
 * The primary bottom tab navigation remains available across the five primary
 * product views so users can move between Home, Friends, Create, Inbox, and Profile
 * without relying on back buttons or hidden navigation.
 */
const BOTTOM_NAV_ALLOWED_PATHS = ["/", "/friends", "/create", "/inbox", "/profile"];

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

// Concept 01 uses a cyan / magenta / violet aurora accent system.
const AURORA_GLOW = "rgba(0, 212, 255, 0.65)";

// Reserved footprint for the bottom nav (bar height + its own vertical padding).
// Main content's bottom padding is derived from this so the two can never overlap.
const NAV_BAR_HEIGHT_PX = 44; // h-11
const NAV_CONTAINER_PADDING_PX = 24; // top+bottom breathing room inside the dedicated nav slot
const NAV_FOOTPRINT_PX = NAV_BAR_HEIGHT_PX + NAV_CONTAINER_PADDING_PX; // 68px, before safe-area

export function MobileShell({ children, immersive = false, showBack, backTo }: MobileShellProps) {
  const isDesktop = useIsDesktop();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const pathname = location.pathname;

  const showNav = !immersive && shouldShowNav(pathname);
  const showBackBtn = showBack !== undefined ? showBack : !BOTTOM_NAV_ALLOWED_PATHS.includes(pathname);
  const backTarget = backTo ?? getBackTarget(pathname);

  if (isDesktop === true) return null;

  const navItems = [
    { icon: Home, label: "Home", href: "/", glow: AURORA_GLOW },
    { icon: Users, label: "Friends", href: "/friends", glow: "rgba(168, 85, 247, 0.65)" },
    { icon: Plus, label: "Create", href: "/create", isCenter: true },
    { icon: Mail, label: "Inbox", href: "/inbox", glow: "rgba(244, 63, 94, 0.65)" },
    { icon: User, label: "Profile", href: "/profile", glow: "rgba(236, 72, 153, 0.65)" },
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

      {/* Main Content — padding-bottom is derived exactly from the nav's own footprint,
          so content can never sit behind or overlap the bar. Smooth native scroll,
          only activates when content actually overflows, no bounce/clip glitches. */}
      <main
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain scroll-smooth no-scrollbar"
        style={{
          paddingBottom: showNav
            ? `calc(${NAV_FOOTPRINT_PX}px + env(safe-area-inset-bottom, 0px) + 12px)`
            : "1rem",
          overscrollBehaviorY: "contain",
          WebkitOverflowScrolling: "touch",
        }}
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

      {/* Bottom Navigation Bar — its own dedicated, fixed-height slot.
          Gold-transparent glass, BIGO-style. Nothing inside it (including the
          center Create button) extends beyond this container's bounds. */}
      <AnimatePresence>
        {showNav && (
          <motion.nav
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex items-center justify-center px-3"
            style={{
              height: `calc(${NAV_FOOTPRINT_PX}px + env(safe-area-inset-bottom, 0px))`,
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
            }}
          >
            <div
              className="pointer-events-auto flex w-full max-w-[320px] items-center justify-around rounded-2xl border px-1.5 backdrop-blur-2xl"
              style={{
                height: NAV_BAR_HEIGHT_PX,
background:
                          "linear-gradient(180deg, rgba(18,14,45,0.82) 0%, rgba(4,6,24,0.92) 55%, rgba(2,2,16,0.96) 100%)",
                        borderColor: "rgba(111, 211, 255, 0.42)",
                        boxShadow: "0 8px 26px rgba(0,0,0,0.55), 0 0 24px rgba(0,212,255,0.16), inset 0 0 20px rgba(168,85,247,0.08)",
              }}
            >
              {navItems.map((item) => {
                const isActive = location.pathname === item.href;
                if (item.isCenter) {
                  return (
                    <Link
                      key={item.label}
                      to={item.href}
                      search={item.isCenter ? { mode: "live" } : undefined}
                      aria-label={item.label}
                      className="flex h-9 w-9 items-center justify-center rounded-full active:scale-90 transition-transform"
                      style={{
                        background: "linear-gradient(135deg, #ff0080, #7c3aed 55%, #00d4ff)",
                        boxShadow: "0 0 18px rgba(255,0,128,0.42), 0 0 26px rgba(0,212,255,0.24)",
                      }}
                    >
                      <Plus className="h-5 w-5 text-black" />
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
                      className={`p-1.5 rounded-full transition-all duration-300 ${isActive ? "bg-amber-400/10" : "group-active:scale-90"}`}
                    >
                      <item.icon
                        className={`h-5 w-5 transition-all duration-300 ${
                          isActive ? "text-cyan-300" : "text-white/45 group-hover:text-white/80"
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
