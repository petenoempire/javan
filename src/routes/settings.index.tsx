import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, UserCircle, Bell, Lock, Palette, HelpCircle, ChevronRight, LogOut, KeyRound } from "lucide-react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/settings/")({
  head: () => ({ meta: [{ title: "Settings and Privacy · Boogle" }] }),
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
    <div className="mx-auto min-h-[100dvh] max-w-[480px] bg-background pb-24">
      <header className="glass-strong sticky top-0 z-10 flex items-center gap-3 border-b border-border px-4 py-3">
        <Link to="/profile" className="p-1"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="font-display text-lg font-bold">Settings and Privacy</h1>
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
  );
}
