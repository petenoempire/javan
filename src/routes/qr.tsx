import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, QrCode, Share2, Download } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/qr")({
  head: () => ({
    meta: [
      { title: "Your QR Code · Javan" },
      { name: "description", content: "Share your Javan profile QR code so people can follow you instantly." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Your QR Code · Javan" },
      { property: "og:description", content: "Share your Javan profile QR code so people can follow you instantly." },
      { property: "og:url", content: "https://javan.lovable.app/qr" },
      { name: "twitter:title", content: "Your QR Code · Javan" },
      { name: "twitter:description", content: "Share your Javan profile QR code so people can follow you instantly." },
    ],
    links: [{ rel: "canonical", href: "https://javan.lovable.app/qr" }],
  }),
  component: QrPage,
});

function QrPage() {
  const { profile } = useAuth();
  const url = profile?.handle ? `${typeof window !== "undefined" ? window.location.origin : "https://javan.lovable.app"}/u/${profile.handle}` : "";
  const qrSrc = url ? `https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=8&data=${encodeURIComponent(url)}` : "";

  return (
    <div className="mx-auto min-h-[100dvh] max-w-[480px] bg-background pb-20">
      <header className="glass-strong sticky top-0 z-10 flex items-center gap-3 border-b border-border px-4 py-3">
        <Link to="/profile" aria-label="Back to profile" className="p-1"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="font-display text-lg font-bold">Your QR code</h1>
      </header>

      <div className="px-5 pt-6">
        <div className="bg-gradient-primary relative overflow-hidden rounded-[2rem] p-6 text-primary-foreground shadow-glow">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="text-[11px] uppercase tracking-[0.18em] opacity-80">Scan to follow</div>
          <div className="font-display mt-1 text-2xl font-bold">@{profile?.handle ?? "you"}</div>

          <div className="mx-auto mt-5 flex h-64 w-64 items-center justify-center rounded-3xl bg-white p-3 shadow-elegant">
            {qrSrc
              ? <img src={qrSrc} alt="Profile QR code" className="h-full w-full" />
              : <QrCode className="h-24 w-24 text-foreground" />}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <button onClick={() => import("@/lib/share").then(({ shareOrCopy }) => shareOrCopy({ url, title: `@${profile?.handle} on Javan` }))}
              className="flex items-center justify-center gap-2 rounded-2xl bg-white/15 py-3 text-sm font-bold backdrop-blur">
              <Share2 className="h-4 w-4" /> Share
            </button>
            <a href={qrSrc} download={`javan-${profile?.handle}.png`}
              className="flex items-center justify-center gap-2 rounded-2xl bg-white/15 py-3 text-sm font-bold backdrop-blur">
              <Download className="h-4 w-4" /> Save
            </a>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">Show this anywhere — flyers, IRL events, bios — and people land straight on your profile.</p>
      </div>
    </div>
  );
}
