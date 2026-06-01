import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, UserCircle, Bell, Lock, Palette, HelpCircle, ChevronRight, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/settings/")({
  head: () => ({ meta: [{ title: "Settings and Privacy · Admiralty" }] }),
  component: SettingsHome,
});

const groups = [
  {
    title: "Account",
    items: [
      { to: "/settings/account", label: "Account", icon: UserCircle, hint: "Verification, security, identity" },
      { to: "/settings/privacy", label: "Privacy", icon: Lock, hint: "Who can see your content" },
    ],
  },
  {
    title: "Preferences",
    items: [
      { to: "/settings/notifications", label: "Notifications", icon: Bell },
      { to: "/settings/appearance", label: "Appearance", icon: Palette },
    ],
  },
  {
    title: "Support",
    items: [{ to: "/settings/help", label: "Help center", icon: HelpCircle }],
  },
];

function SettingsHome() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="mx-auto min-h-[100dvh] max-w-[480px] bg-background pb-24">
      <header className="glass-strong sticky top-0 z-10 flex items-center gap-3 border-b border-border px-4 py-3">
        <Link to="/profile" className="p-1"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="font-display text-lg font-bold">Settings and Privacy</h1>
      </header>

      <div className="space-y-6 px-4 pt-5">
        {groups.map((g) => (
          <div key={g.title}>
            <div className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              {g.title}
            </div>
            <div className="glass overflow-hidden rounded-3xl">
              {g.items.map((item, i) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-3 px-4 py-3.5 active:bg-primary/5 ${
                      i > 0 ? "border-t border-border/40" : ""
                    }`}
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
              })}
            </div>
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
