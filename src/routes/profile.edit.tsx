import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Camera, Loader2 } from "lucide-react";
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

  if (authLoading || !profile) {
    return <div className="flex h-[100dvh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  return (
    <div className="mx-auto min-h-[100dvh] max-w-[480px] bg-background pb-10">
      <header className="glass-strong sticky top-0 z-10 flex items-center justify-between border-b border-border px-4 py-3">
        <Link to="/profile" className="p-1"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="font-display font-semibold">Edit profile</h1>
        <button onClick={save} disabled={saving}
          className="bg-gradient-primary rounded-full px-4 py-1.5 text-xs font-semibold text-primary-foreground shadow-glow disabled:opacity-60">
          {saving ? "Saving…" : "Save"}
        </button>
      </header>

      <div className="relative">
        <button onClick={() => coverInput.current?.click()} className="relative block h-36 w-full overflow-hidden">
          {form.cover_url ? (
            <img src={form.cover_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="bg-gradient-primary h-full w-full opacity-80" />
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            {uploading === "cover" ? <Loader2 className="h-6 w-6 animate-spin text-white" /> : <Camera className="h-6 w-6 text-white" />}
          </div>
        </button>
        <input ref={coverInput} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "cover")} />

        <div className="px-5">
          <button onClick={() => avatarInput.current?.click()}
            className="-mt-12 block h-24 w-24 overflow-hidden rounded-full border-4 border-background shadow-elegant">
            <div className="relative h-full w-full">
              {form.avatar_url ? (
                <img src={form.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="bg-gradient-primary h-full w-full" />
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                {uploading === "avatar" ? <Loader2 className="h-5 w-5 animate-spin text-white" /> : <Camera className="h-5 w-5 text-white" />}
              </div>
            </div>
          </button>
          <input ref={avatarInput} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "avatar")} />
        </div>
      </div>

      <div className="space-y-4 px-5 pt-5">
        <Field label="Display name" value={form.display_name} onChange={(v) => setForm((p) => ({ ...p, display_name: v }))} />
        <Field label="Handle" value={form.handle} prefix="@" onChange={(v) => setForm((p) => ({ ...p, handle: v.toLowerCase().replace(/[^a-z0-9_]/g, "") }))} />
        <Field label="Bio" value={form.bio} onChange={(v) => setForm((p) => ({ ...p, bio: v }))} multiline />
        <Field label="Location" value={form.location} onChange={(v) => setForm((p) => ({ ...p, location: v }))} />
        <Field label="Website" value={form.website} onChange={(v) => setForm((p) => ({ ...p, website: v }))} placeholder="https://" />
      </div>
    </div>
  );
}

function Field({ label, value, onChange, multiline, prefix, placeholder }: {
  label: string; value: string; onChange: (v: string) => void;
  multiline?: boolean; prefix?: string; placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="flex items-start gap-2 rounded-2xl border border-border bg-card px-4 py-3">
        {prefix && <span className="text-muted-foreground">{prefix}</span>}
        {multiline ? (
          <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} placeholder={placeholder}
            className="flex-1 resize-none bg-transparent text-sm outline-none" />
        ) : (
          <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
            className="flex-1 bg-transparent text-sm outline-none" />
        )}
      </div>
    </label>
  );
}
