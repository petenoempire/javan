import { DesktopLayout } from "@/components/DesktopLayout";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, UserCircle, Bell, Lock, Palette, HelpCircle, ChevronRight, LogOut, KeyRound } from "lucide-react";
import { useIsDesktop } from "@/hooks/use-is-desktop";
import { useAuth } from "@/lib/auth";

const SETTINGS_TITLE = "Settings and Privacy · Javan";
const SETTINGS_DESC =
  "Control your Javan account, notifications, privacy, security and appearance settings all from one place.";

export const Route = createFileRoute("/settings/")({
  head: () => ({
    meta: [
      { title: SETTINGS_TITLE },
      { name: "description", content: SETTINGS_DESC },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: SETTINGS_TITLE },
      { property: "og:description", content: SETTINGS_DESC },
      { property: "og:url", content: "https://javan.lovable.app/settings" },
      { name: "twitter:title", content: SETTINGS_TITLE },
      { name: "twitter:description", content: SETTINGS_DESC },
    ],
    links: [{ rel: "canonical", href: "https://javan.lovable.app/settings" }],
  }),
  component: SettingsHome,
});


type Item = { to: string; label: string; icon: typeof UserCircle; hint?: string };
const groups: { title: string; items: Item[] }[] = [
  {
    title: "Account",
    items: [
      { to: "/settings/account", label: "Account", icon: UserCircle, hint: "Verification, identity" },
      { to: "/settings/security", label: "Password & Security", icon: KeyRound, hint: "Login, reset, safety" },
      { to: "/settings/privacy", label: "Privacy", icon: Lock, hint: "Who can see your content" },
    ],
  },
  {
    title: "Preferences",
    items: [
      { to: "/settings/notifications", label: "Notifications", icon: Bell, hint: "Pick what pings you" },
      { to: "/settings/appearance", label: "Appearance", icon: Palette, hint: "Theme & display" },
    ],
  },
  {
    title: "Support",
    items: [{ to: "/help", label: "Help center", icon: HelpCircle, hint: "Get answers or chat with us" }],
  },
];

function SettingsHome() {
  const isDesktop = useIsDesktop();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const renderItem = (item: Item, i: number) => {
    const Icon = item.icon;
    return (
      <Link
        key={item.label}
        to={item.to}
        className={`flex items-center gap-3 px-4 py-3.5 active:bg-primary/5 ${i > 0 ? "border-t border-border/40" : ""}`}
      >
        <div className="ring-1 ring-primary/20 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{item.label}</div>
          {item.hint && <div className="truncate text-[11px] text-muted-foreground">{item.hint}</div>}
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </Link>
    );
  };

  return (
    <>
    <DesktopLayout>
      <div className="max-w-4xl mx-auto py-10">
        <h2 className="text-4xl font-black text-chrome mb-8 tracking-tight">Settings & Privacy</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           {groups.map(g => (
             <div key={g.title}>
                <h2 className="text-xs font-black uppercase tracking-widest text-white/40 mb-4 ml-2">{g.title}</h2>
                <div className="glass rounded-[2rem] border border-white/5 overflow-hidden">
                   {g.items.map((item, i) => {
                     const Icon = item.icon;
                     return (
                       <Link key={item.label} to={item.to as any} className={`flex items-center gap-4 p-5 hover:bg-white/5 transition-all ${i > 0 ? "border-t border-white/5" : ""}`}>
                          <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                             <Icon className="h-6 w-6 text-cyan-400" />
                          </div>
                          <div className="flex-1">
                             <p className="font-bold text-white">{item.label}</p>
                             <p className="text-xs text-white/40 mt-1">{item.hint}</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-white/20" />
                       </Link>
                     )
                   })}
                </div>
             </div>
           ))}
        </div>
        <div className="mt-12 max-w-md">
           <button 
              onClick={() => signOut().then(() => navigate({ to: "/auth" }))}
              className="w-full glass p-5 rounded-2xl border border-rose-500/20 text-rose-500 font-bold hover:bg-rose-500/5 transition-all flex items-center justify-center gap-2"
           >
              <LogOut className="h-5 w-5" /> Sign Out
           </button>
        </div>
      </div>
    </DesktopLayout>
    {isDesktop === false && (
    <div className="mx-auto min-h-[100dvh] max-w-[480px] bg-[#020210] pb-24 lg:hidden">
      <header className="glass-strong sticky top-0 z-10 flex items-center gap-3 border-b border-white/5 px-4 py-3">
        <Link to="/profile" className="p-1" aria-label="Back to profile"><ArrowLeft className="h-5 w-5" /></Link>
        <h2 className="font-display text-lg font-bold text-chrome">Settings</h2>
      </header>

      <div className="space-y-6 px-4 pt-5">
        {groups.map((g) => (
          <div key={g.title}>
            <div className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{g.title}</div>
            <div className="glass overflow-hidden rounded-3xl">{g.items.map((item, i) => renderItem(item, i))}</div>
          </div>
        ))}

        <button
          onClick={() => signOut().then(() => navigate({ to: "/auth" }))}
          className="glass mt-4 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-destructive"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </div>
    )}
    </>
  );
}
