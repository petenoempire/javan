import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { 
  Home, Compass, Radio, BookOpen, Film, Users, Music, TrendingUp, Heart, 
  Bell, Plus, Search, LogOut, ChevronRight, Mic2
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { SearchOverlay } from "./SearchOverlay";
import { useIsDesktop } from "@/hooks/use-is-desktop";

interface DesktopLayoutProps {
  children: ReactNode;
}

export function DesktopLayout({ children }: DesktopLayoutProps) {
  const isDesktop = useIsDesktop();
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const isHomepage = location.pathname === "/";

  if (isDesktop === false) return null;

  const navItems = [
    { icon: Home, label: "Home", href: "/" },
    { icon: Compass, label: "Explore", href: "/discover" },
    { icon: Radio, label: "Live", href: "/live", badge: "LIVE" },
    { icon: BookOpen, label: "STEM", href: "/stem" },
    { icon: Film, label: "Drama", href: "/drama" },
    { icon: Users, label: "Community", href: "/community" },
    { icon: Music, label: "Music", href: "/music" },
    { icon: Mic2, label: "For Artists", href: "/short-video-platform-for-musicians" },
    { icon: TrendingUp, label: "Trending", href: "/trending" },
    { icon: Heart, label: "Following", href: "/following" },
  ];

  const trendingCreators: any[] = [];

  return (
    <div className="hidden lg:flex min-h-screen bg-[#020210] text-white overflow-hidden">
      {/* Aurora Background */}
      <div className="aurora-bg">
        <div className="aurora-ribbon" style={{ top: '10%', opacity: 0.5 }}></div>
        <div className="aurora-ribbon" style={{ top: '40%', animationDelay: '-5s', opacity: 0.3 }}></div>
        <div className="aurora-ribbon" style={{ top: '70%', animationDelay: '-10s', opacity: 0.4 }}></div>
      </div>

      {/* Left Sidebar */}
      <aside className="w-64 glass border-r border-white/10 flex flex-col z-10">
        <div className="p-6">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="JAVAN" className="h-12 w-12 rounded-xl object-cover shadow-glow" />
            <span className="text-2xl font-black text-chrome tracking-tighter uppercase">JAVAN</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto no-scrollbar">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.label}
                to={item.href as any}
                aria-label={item.label}
                className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all group ${
                  isActive 
                    ? "bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.1)]" 
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={`h-5 w-5 ${isActive ? "text-cyan-400 drop-shadow-[0_0_8px_rgba(0,212,255,0.8)]" : "group-hover:text-white"}`} />
                  <span className="font-medium">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="bg-rose-600 text-[10px] font-bold px-1.5 py-0.5 rounded-sm animate-pulse">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto space-y-4">
          {user ? (
            <Link to="/profile" className="block">
              <div className="glass-strong rounded-2xl p-4 border border-white/10 hover:bg-white/5 transition-colors group">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-10 w-10 border border-cyan-500/50">
                    <AvatarImage src={profile?.avatar_url || ""} alt={`${profile?.display_name || 'User'}'s avatar`} />
                    <AvatarFallback>{profile?.display_name?.[0] || "U"}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate group-hover:text-cyan-400 transition-colors">{profile?.display_name || "User"}</p>
                    <p className="text-[10px] text-white/50 truncate">@{profile?.handle || "user"}</p>
                  </div>
                </div>
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    signOut();
                  }}
                  className="mt-3 flex items-center gap-2 text-[10px] text-white/40 hover:text-white transition-colors"
                >
                  <LogOut className="h-3 w-3" />
                  Sign Out
                </button>
              </div>
            </Link>
          ) : (
            <Link to="/auth">
              <Button className="w-full bg-gradient-primary hover:opacity-90 shadow-glow rounded-xl py-6">
                Sign In
              </Button>
            </Link>
          )}
          
          <Link to="/create">
            <Button className="w-full bg-gradient-to-r from-rose-500 to-purple-600 hover:opacity-90 rounded-xl py-6 flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Upload
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Header - Only visible on Homepage */}
        {isHomepage && (
          <header className="h-20 flex items-center justify-between px-8 border-b border-white/5 bg-[#020210]/50 backdrop-blur-md">
            <div 
              onClick={() => setIsSearchOpen(true)}
              className="flex-1 max-w-2xl relative group cursor-pointer"
            >
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 group-hover:text-cyan-400 transition-colors" aria-hidden="true" />
              <div className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm text-white/40 hover:border-cyan-500/50 hover:bg-white/10 transition-all">
                Search for videos, creators, or genres...
              </div>
            </div>
            
            <div className="flex items-center gap-6 ml-8">
              <Link to="/notifications" aria-label="Notifications" className="relative p-2 text-white/60 hover:text-white transition-colors">
                <Bell className="h-6 w-6" />
              </Link>
              <Link to="/create">
                <Button className="bg-gradient-primary rounded-xl px-6">
                  + Create
                </Button>
              </Link>
            </div>
          </header>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
          {children}
        </div>
      </main>

      {/* Search Overlay */}
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Right Panel */}
      <aside className="w-80 border-l border-white/5 bg-[#020210]/30 backdrop-blur-sm p-6 space-y-8 z-10 overflow-y-auto no-scrollbar">
        <div>
          <h3 className="text-lg font-bold mb-4 flex items-center justify-between">
            Trending Creators
            <TrendingUp className="h-4 w-4 text-cyan-400" />
          </h3>
          <div className="space-y-4">
            <p className="text-xs text-white/20 italic">No trending creators yet.</p>
          </div>
          <Link to="/discover" className="w-full mt-6 py-2 text-xs text-white/40 hover:text-white flex items-center justify-center gap-1 transition-colors">
            Explore More <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </aside>
    </div>
  );
}
