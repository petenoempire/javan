import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Globe, Lock, EyeOff, MessageSquare } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/settings/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Settings · Javan" },
      { name: "description", content: "Control who can view your account, send you messages, and download your videos on Javan." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Privacy Settings · Javan" },
      { property: "og:description", content: "Control who can view your account, send you messages, and download your videos on Javan." },
      { property: "og:url", content: "https://javan.lovable.app/settings/privacy" },
      { name: "twitter:title", content: "Privacy Settings · Javan" },
      { name: "twitter:description", content: "Control who can view your account, send you messages, and download your videos on Javan." },
    ],
    links: [{ rel: "canonical", href: "https://javan.lovable.app/settings/privacy" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const [priv, setPriv] = useState<"public" | "private">("public");
  const [allowDM, setAllowDM] = useState<"everyone" | "followers" | "none">("everyone");
  const [downloads, setDownloads] = useState(true);

  return (
    <div className="mx-auto min-h-[100dvh] max-w-[480px] bg-background pb-20">
      <header className="glass-strong sticky top-0 z-10 flex items-center gap-3 border-b border-border px-4 py-3">
        <Link to="/settings" aria-label="Back to settings" className="p-1"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="font-display text-lg font-bold">Privacy</h1>
      </header>

      <div className="space-y-5 px-4 pt-5">
        <div className="glass overflow-hidden rounded-3xl" role="radiogroup" aria-label="Account visibility">
          <div className="px-4 pt-4 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Account</div>
          <button onClick={() => setPriv("public")} role="radio" aria-checked={priv === "public"}
            className={`flex w-full items-center justify-between gap-3 px-4 py-4 ${priv === "public" ? "bg-primary/5" : ""}`}>
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-primary" />
              <div className="text-left">
                <div className="text-sm font-semibold">Public account</div>
                <div className="text-[11px] text-muted-foreground">Anyone can view your videos</div>
              </div>
            </div>
            <span className={`h-4 w-4 rounded-full border-2 ${priv === "public" ? "bg-primary border-primary" : "border-border"}`} />
          </button>
          <button onClick={() => setPriv("private")} role="radio" aria-checked={priv === "private"}
            className={`flex w-full items-center justify-between gap-3 border-t border-border/40 px-4 py-4 ${priv === "private" ? "bg-primary/5" : ""}`}>
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-primary" />
              <div className="text-left">
                <div className="text-sm font-semibold">Private account</div>
                <div className="text-[11px] text-muted-foreground">Only approved followers see your posts</div>
              </div>
            </div>
            <span className={`h-4 w-4 rounded-full border-2 ${priv === "private" ? "bg-primary border-primary" : "border-border"}`} />
          </button>
        </div>

        <div className="glass overflow-hidden rounded-3xl" role="radiogroup" aria-label="Who can message you">
          <div className="px-4 pt-4 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Messages</div>
          {(["everyone","followers","none"] as const).map((v, i) => (
            <button key={v} onClick={() => setAllowDM(v)} role="radio" aria-checked={allowDM === v}
              className={`flex w-full items-center justify-between gap-3 px-4 py-3.5 ${i > 0 ? "border-t border-border/40" : ""} ${allowDM === v ? "bg-primary/5" : ""}`}>
              <div className="flex items-center gap-3">
                <MessageSquare className="h-4 w-4 text-primary" />
                <div className="text-sm font-semibold capitalize">{v === "none" ? "No one" : v}</div>
              </div>
              <span className={`h-4 w-4 rounded-full border-2 ${allowDM === v ? "bg-primary border-primary" : "border-border"}`} />
            </button>
          ))}
        </div>

        <div className="glass flex items-center justify-between gap-3 rounded-3xl px-4 py-4">
          <div className="flex items-center gap-3">
            <EyeOff className="h-5 w-5 text-primary" />
            <div>
              <div className="text-sm font-semibold">Allow downloads</div>
              <div className="text-[11px] text-muted-foreground">Let viewers save your videos</div>
            </div>
          </div>
          <button onClick={() => setDownloads(d => !d)} role="switch" aria-checked={downloads} aria-label="Allow downloads"
            className={`relative h-6 w-11 rounded-full transition ${downloads ? "bg-primary" : "bg-muted"}`}>
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-background transition ${downloads ? "left-5" : "left-0.5"}`} />
          </button>
        </div>

        <button onClick={() => toast.success("Privacy preferences saved")}
          className="bg-gradient-primary w-full rounded-2xl py-3 text-sm font-bold text-primary-foreground shadow-glow">
          Save changes
        </button>
      </div>
    </div>
  );
}
