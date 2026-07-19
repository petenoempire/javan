import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { ArrowLeft, Lock, Mail, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/settings/security")({
  head: () => ({
    meta: [
      { title: "Password & Security · Javan" },
      { name: "description", content: "Update your password, set up account recovery, and review security tips for your Javan account." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Password & Security · Javan" },
      { property: "og:description", content: "Update your password, set up account recovery, and review security tips for your Javan account." },
      { property: "og:url", content: "https://javan.lovable.app/settings/security" },
      { name: "twitter:title", content: "Password & Security · Javan" },
      { name: "twitter:description", content: "Update your password, set up account recovery, and review security tips for your Javan account." },
    ],
    links: [{ rel: "canonical", href: "https://javan.lovable.app/settings/security" }],
  }),
  component: SecurityPage,
});

function SecurityPage() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);

  if (pathname !== "/settings/security") return <Outlet />;

  const submit = async () => {
    if (pw.length < 8) return toast.error("Password must be at least 8 characters.");
    if (pw !== pw2) return toast.error("Passwords do not match.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    setPw(""); setPw2("");
  };

  const resetByEmail = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return toast.error("No email on file.");
    const { error } = await supabase.auth.resetPasswordForEmail(user.email);
    if (error) return toast.error(error.message);
    toast.success("Password reset email sent");
  };

  return (
    <div className="mx-auto min-h-[100dvh] max-w-[480px] bg-background pb-20">
      <header className="glass-strong sticky top-0 z-10 flex items-center gap-3 border-b border-border px-4 py-3">
        <Link to="/settings/account" aria-label="Back to account settings" className="p-1"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="font-display text-lg font-bold">Password & Security</h1>
      </header>

      <div className="space-y-5 px-4 pt-5">
        <div className="glass rounded-3xl p-5">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-primary" />
            <div className="text-sm font-semibold">Change password</div>
          </div>
          <div className="mt-4 space-y-3">
            <label htmlFor="security-new-password" className="sr-only">New password</label>
            <input id="security-new-password" type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="New password"
              className="glass w-full rounded-xl px-4 py-3 text-sm outline-none" />
            <label htmlFor="security-confirm-password" className="sr-only">Confirm new password</label>
            <input id="security-confirm-password" type="password" value={pw2} onChange={e => setPw2(e.target.value)} placeholder="Confirm new password"
              className="glass w-full rounded-xl px-4 py-3 text-sm outline-none" />
            <button onClick={submit} disabled={busy}
              className="bg-gradient-primary w-full rounded-2xl py-3 text-sm font-bold text-primary-foreground shadow-glow disabled:opacity-60">
              {busy ? "Updating…" : "Update password"}
            </button>
          </div>
        </div>

        <button onClick={resetByEmail} className="glass flex w-full items-center gap-3 rounded-2xl p-4 text-left">
          <Mail className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <div className="text-sm font-semibold">Send reset email</div>
            <div className="text-[11px] text-muted-foreground">We'll email you a secure reset link.</div>
          </div>
        </button>

        <Link to="/settings/security/recovery" className="glass flex w-full items-center gap-3 rounded-2xl p-4 text-left">
          <Mail className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <div className="text-sm font-semibold">Account Recovery</div>
            <div className="text-[11px] text-muted-foreground">Open the dedicated recovery setup page.</div>
          </div>
        </Link>

        <div className="glass flex items-start gap-3 rounded-2xl border border-destructive/40 bg-destructive/5 p-4">
          <ShieldAlert className="mt-0.5 h-5 w-5 text-destructive" />
          <div>
            <div className="text-sm font-semibold">Stay safe</div>
            <div className="mt-1 text-[11px] text-muted-foreground">Use a unique password and never share your login codes. Javan staff will never ask for your password.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
