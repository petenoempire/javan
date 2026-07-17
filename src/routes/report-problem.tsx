import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { MobileShell } from "@/components/MobileShell";
import { ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/report-problem")({
  head: () => ({ meta: [{ title: "Report a Problem · Javan" }] }),
  component: ReportProblemPage,
});

const CATEGORIES = [
  { value: "bug", label: "Something's broken" },
  { value: "account", label: "Account issue" },
  { value: "payment", label: "Wallet / Payment issue" },
  { value: "safety", label: "Safety concern" },
  { value: "other", label: "Something else" },
];

function generateTicketNumber() {
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `JVN-${rand}`;
}

function ReportProblemPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [category, setCategory] = useState("bug");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);

  const submit = async () => {
    if (!user) {
      toast.error("Sign in to report a problem");
      return;
    }
    if (!subject.trim() || !description.trim()) {
      toast.error("Please fill in both fields");
      return;
    }

    setSubmitting(true);
    try {
      const ticketNum = generateTicketNumber();
      const { error } = await supabase.from("support_tickets").insert({
        ticket_number: ticketNum,
        user_id: user.id,
        category,
        subject: subject.trim(),
        description: description.trim(),
      });
      if (error) throw error;

      setTicketNumber(ticketNum);
      toast.success("Report submitted");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit report");
    } finally {
      setSubmitting(false);
    }
  };

  if (ticketNumber) {
    return (
      <MobileShell>
        <div className="flex min-h-[80dvh] flex-col items-center justify-center px-8 text-center">
          <CheckCircle2 className="h-12 w-12 text-emerald-400 mb-4" />
          <h2 className="font-display text-lg font-bold text-white">Report submitted</h2>
          <p className="mt-2 text-sm text-white/60">We'll look into this. Your ticket number is:</p>
          <p className="mt-2 rounded-xl bg-white/10 px-4 py-2 font-mono text-sm font-bold text-white">{ticketNumber}</p>
          <Link
            to="/help"
            className="mt-6 rounded-full bg-gradient-to-r from-fuchsia-600 to-rose-600 px-6 py-2.5 text-sm font-bold text-white"
          >
            Back to Help Center
          </Link>
        </div>
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      <div className="px-4 pt-4 pb-20">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/help" className="text-white/50 p-1">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="font-display text-lg font-black">Report a Problem</h1>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-white/50">Category</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-neutral-900/50 px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-fuchsia-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value} className="bg-neutral-900">
                  {c.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-white/50">Subject</span>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief summary of the issue"
              className="w-full rounded-xl border border-white/10 bg-neutral-900/50 px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-fuchsia-500"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-white/50">What happened?</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              placeholder="Describe the issue in as much detail as you can..."
              className="w-full resize-none rounded-xl border border-white/10 bg-neutral-900/50 px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-fuchsia-500"
            />
          </label>

          <button
            onClick={submit}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-600 to-rose-600 py-3 text-sm font-bold disabled:opacity-50 active:scale-95 transition-all"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
              </>
            ) : (
              "Submit Report"
            )}
          </button>
        </div>
      </div>
    </MobileShell>
  );
}
