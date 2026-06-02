import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, UserCircle, Bell, Lock, Palette, HelpCircle, ChevronRight, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/settings/")({
  head: () => ({ meta: [{ title: "Settings and Privacy · Admiralty" }] }),
  component: SettingsHome,
});

type Item = { to?: string; label: string; icon: typeof UserCircle; hint?: string; soon?: boolean };
const groups: { title: string; items: Item[] }[] = [
  {
    title: "Account",
    items: [
      { to: "/settings/account", label: "Account", icon: UserCircle, hint: "Verification, security, identity" },
      { label: "Privacy", icon: Lock, hint: "Who can see your content", soon: true },
    ],
  },
  {
    title: "Preferences",
    items: [
      { label: "Notifications", icon: Bell, soon: true },
      { label: "Appearance", icon: Palette, soon: true },
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
    const inner = (
      <>
        <div className="ring-1 ring-primary/20 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="truncate text-sm font-semibold">{item.label}</div>
            {item.soon && (
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                Soon
              </span>
            )}
          </div>
          {item.hint && <div className="truncate text-[11px] text-muted-foreground">{item.hint}</div>}
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </>
    );
    const cls = `flex items-center gap-3 px-4 py-3.5 active:bg-primary/5 ${i > 0 ? "border-t border-border/40" : ""}`;
    return item.to ? (
      <Link key={item.label} to={item.to} className={cls}>{inner}</Link>
    ) : (
      <button key={item.label} onClick={() => toast.info(`${item.label} is coming soon`)} className={`${cls} text-left w-full`}>
        {inner}
      </button>
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
            <div className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              {g.title}
            </div>
            <div className="glass overflow-hidden rounded-3xl">
              {g.items.map((item, i) => renderItem(item, i))}
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
