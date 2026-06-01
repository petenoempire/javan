import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Camera, Loader2, Copy, Check, Pencil } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/profile/edit")({
  head: () => ({ meta: [{ title: "Edit profile · Admiralty" }] }),
  component: EditProfile,
});

function EditProfile() {
  const { profile, user, refreshProfile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    display_name: "", handle: "", bio: "", location: "", website: "",
    avatar_url: "" as string | null, cover_url: "" as string | null,
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<null | "avatar" | "cover">(null);
  const [copied, setCopied] = useState(false);
  const avatarInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth" });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (profile) {
      setForm({
        display_name: profile.display_name ?? "",
        handle: profile.handle ?? "",
        bio: profile.bio ?? "",
        location: profile.location ?? "",
        website: profile.website ?? "",
        avatar_url: profile.avatar_url,
        cover_url: profile.cover_url,
      });
    }
  }, [profile]);

  const upload = async (file: File, kind: "avatar" | "cover") => {
    if (!user) return;
    setUploading(kind);
    try {
      const bucket = kind === "avatar" ? "avatars" : "covers";
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      setForm((p) => ({ ...p, [`${kind}_url`]: data.publicUrl }));
      toast.success(`${kind === "avatar" ? "Avatar" : "Cover"} uploaded`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(null);
    }
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").update({
        display_name: form.display_name,
        handle: form.handle.toLowerCase().replace(/[^a-z0-9_]/g, ""),
        bio: form.bio,
        location: form.location || null,
        website: form.website || null,
        avatar_url: form.avatar_url,
        cover_url: form.cover_url,
      }).eq("id", user.id);
      if (error) throw error;
      await refreshProfile();
      toast.success("Profile updated");
      navigate({ to: "/profile" });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const profileLink = form.handle
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/u/${form.handle}`
    : "";
  const copyLink = async () => {
    if (!profileLink) return;
    try {
      await navigator.clipboard.writeText(profileLink);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Couldn't copy");
    }
  };

  if (authLoading || !profile) {
    return <div className="flex h-[100dvh] items-center justify-center bg-background"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  return (
    <div className="mx-auto min-h-[100dvh] max-w-[480px] bg-background pb-16">
      <header className="glass-strong sticky top-0 z-10 flex items-center justify-between border-b border-border px-4 py-3">
        <Link to="/profile" className="p-1"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="font-display font-semibold">Edit profile</h1>
        <button onClick={save} disabled={saving}
          className="bg-gradient-primary rounded-full px-4 py-1.5 text-xs font-semibold text-primary-foreground shadow-glow disabled:opacity-60">
          {saving ? "Saving…" : "Save"}
        </button>
      </header>

      {/* Cover band */}
      <button onClick={() => coverInput.current?.click()} className="relative block h-32 w-full overflow-hidden">
        {form.cover_url ? (
          <img src={form.cover_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="bg-gradient-primary h-full w-full opacity-80" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-background" />
        <div className="absolute right-3 top-3 glass flex h-9 w-9 items-center justify-center rounded-full">
          {uploading === "cover" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
        </div>
      </button>
      <input ref={coverInput} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "cover")} />

      {/* Centered avatar */}
      <div className="-mt-16 flex justify-center">
        <button onClick={() => avatarInput.current?.click()}
          className="relative block h-28 w-28 overflow-hidden rounded-full border-4 border-background shadow-elegant ring-2 ring-primary/30">
          {form.avatar_url ? (
            <img src={form.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="bg-gradient-primary h-full w-full" />
          )}
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-center bg-black/55 py-1.5">
            {uploading === "avatar" ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <Camera className="h-4 w-4 text-white" />}
          </div>
        </button>
      </div>
      <input ref={avatarInput} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "avatar")} />

      <div className="px-5 pt-6">
        {/* Identity card */}
        <div className="glass rounded-3xl p-4">
          <SectionLabel>Identity</SectionLabel>
          <FloatingField label="Name" value={form.display_name} onChange={(v) => setForm((p) => ({ ...p, display_name: v }))} icon={<Pencil className="h-3.5 w-3.5" />} />
          <FloatingField label="Username" value={form.handle} prefix="@" onChange={(v) => setForm((p) => ({ ...p, handle: v.toLowerCase().replace(/[^a-z0-9_]/g, "") }))} />

          {/* Copy profile link */}
          <div className="mt-3">
            <span className="mb-1 block px-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Custom profile link</span>
            <button onClick={copyLink}
              className="bg-gradient-primary/10 hover:bg-gradient-primary/20 group flex w-full items-center gap-2 rounded-2xl border border-primary/30 px-4 py-3 text-left transition">
              <div className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{profileLink || "Set a username first"}</div>
              <div className="bg-gradient-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-primary-foreground shadow-glow">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </div>
            </button>
          </div>
        </div>

        {/* About card */}
        <div className="glass mt-4 rounded-3xl p-4">
          <SectionLabel>About</SectionLabel>
          <FloatingTextarea label="Bio" value={form.bio} onChange={(v) => setForm((p) => ({ ...p, bio: v }))} placeholder="Tell people what you're about…" />
        </div>

        {/* Links card */}
        <div className="glass mt-4 rounded-3xl p-4">
          <SectionLabel>Links & location</SectionLabel>
          <FloatingField label="Website" value={form.website} onChange={(v) => setForm((p) => ({ ...p, website: v }))} placeholder="https://" />
          <FloatingField label="Location" value={form.location} onChange={(v) => setForm((p) => ({ ...p, location: v }))} placeholder="City, country" />
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="mb-3 px-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{children}</div>;
}

function FloatingField({ label, value, onChange, prefix, placeholder, icon }: {
  label: string; value: string; onChange: (v: string) => void; prefix?: string; placeholder?: string; icon?: React.ReactNode;
}) {
  return (
    <label className="mt-3 block first:mt-0">
      <span className="mb-1 block px-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-card/60 px-4 py-3 ring-1 ring-transparent focus-within:ring-primary/40">
        {prefix && <span className="text-muted-foreground">{prefix}</span>}
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className="flex-1 bg-transparent text-sm outline-none" />
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </div>
    </label>
  );
}

function FloatingTextarea({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block px-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</span>
      <div className="rounded-2xl border border-border bg-card/60 px-4 py-3 ring-1 ring-transparent focus-within:ring-primary/40">
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={4} placeholder={placeholder}
          className="w-full resize-none bg-transparent text-sm outline-none" />
      </div>
    </label>
  );
}
