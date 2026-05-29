import { createFileRoute, Link } from "@tanstack/react-router";
import { Radio, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/live/$id")({
  component: LiveDisabled,
});

function LiveDisabled() {
  return (
    <div className="mx-auto flex h-[100dvh] max-w-[480px] flex-col items-center justify-center bg-background px-8 text-center">
      <div className="bg-gradient-primary mb-4 flex h-14 w-14 items-center justify-center rounded-2xl shadow-glow">
        <Radio className="h-6 w-6 text-primary-foreground" />
      </div>
      <h1 className="font-display text-xl font-bold">Live streaming coming soon</h1>
      <p className="mt-2 text-sm text-muted-foreground">Real-time live streams will launch once creator tools are ready.</p>
      <Link to="/" className="bg-gradient-primary mt-5 inline-flex items-center gap-1 rounded-full px-5 py-2 text-sm font-semibold text-primary-foreground shadow-glow">
        <ArrowLeft className="h-3 w-3" /> Back to feed
      </Link>
    </div>
  );
}
