import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

const REASONS = [
  "Spam or scam",
  "Harassment or hate",
  "Nudity or sexual content",
  "Violence or dangerous acts",
  "Misinformation",
  "Intellectual property",
  "Other",
];

export function ReportDialog({
  target,
  onClose,
}: {
  target: { type: "user" | "video" | "comment" | "message"; id: string } | null;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [reason, setReason] = useState<string | null>(null);
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!user) { toast.info("Sign in to report"); return; }
    if (!target || !reason) return;
    setSubmitting(true);
    const { error } = await supabase.from("reports").insert({
      reporter_id: user.id,
      target_type: target.type,
      target_id: target.id,
      reason,
      details: details || null,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Report submitted. Admins will review it.");
    setReason(null); setDetails("");
    onClose();
  };

  return (
    <AnimatePresence>
      {target && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 z-40 bg-black/60" />
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="glass-strong fixed bottom-0 left-1/2 z-50 w-[min(480px,100vw)] -translate-x-1/2 rounded-t-3xl p-5 pb-8">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">Report</h3>
              <button onClick={onClose}><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-1.5">
              {REASONS.map((r) => (
                <button key={r} onClick={() => setReason(r)}
                  className={`w-full rounded-2xl px-4 py-2.5 text-left text-sm transition ${
                    reason === r ? "bg-gradient-primary text-primary-foreground shadow-glow" : "glass"
                  }`}>{r}</button>
              ))}
            </div>
            <textarea
              value={details} onChange={(e) => setDetails(e.target.value)}
              placeholder="Add details (optional)"
              rows={3}
              className="mt-3 w-full resize-none rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none"
            />
            <button onClick={submit} disabled={!reason || submitting}
              className="bg-gradient-primary mt-3 w-full rounded-full py-3 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-50">
              {submitting ? "Submitting…" : "Submit report"}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
