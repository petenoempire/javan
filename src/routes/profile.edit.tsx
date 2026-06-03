import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Camera, Loader2, Copy, Check, ChevronRight, GripVertical } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/profile/edit")({
  head: () => ({ meta: [{ title: "Edit profile · Boogle" }] }),
  component: EditProfile,
});

type SheetKind = null | "name" | "username" | "bio" | "ai";

function EditProfile() {
  const { profile, user, refreshProfile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    display_name: "", handle: "", bio: "",
    avatar_url: "" as string | null,
  });
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sheet, setSheet] = useState<SheetKind>(null);
  const [saving, setSaving] = useState(false);
  const [order, setOrder] = useState<string[]>(["Boogle Studio", "Balance"]);
  const dragIdx = useRef<number | null>(null);
  const avatarInput = useRef<HTMLInputElement>(null);

  useEffect(() => { if (!authLoading && !user) navigate({ to: "/auth" }); }, [authLoading, user, navigate]);

  useEffect(() => {
    if (profile) {
      setForm({
        display_name: profile.display_name ?? "",
        handle: profile.handle ?? "",
        bio: profile.bio ?? "",
        avatar_url: profile.avatar_url,
      });
    } else if (user) {
      const emailName = user.email?.split("@")[0]?.replace(/[^a-zA-Z0-9_]/g, "") ?? "";
      const fallbackHandle = (user.user_metadata?.handle as string | undefined) ?? emailName;
      setForm({
        display_name: (user.user_metadata?.display_name as string | undefined) ?? (user.user_metadata?.full_name as string | undefined) ?? fallbackHandle,
        handle: fallbackHandle.toLowerCase(),
        bio: "",
        avatar_url: (user.user_metadata?.avatar_url as string | undefined) ?? null,
      });
    }
  }, [profile, user]);

  const persist = async (patch: Partial<typeof form>) => {
    if (!user) return;
    const next = { ...form, ...patch };
    setForm(next);
    setSaving(true);
    try {
      const cleanHandle = next.handle.toLowerCase().replace(/[^a-z0-9_]/g, "") || `user${user.id.slice(0, 6)}`;
      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        display_name: next.display_name,
        handle: cleanHandle,
        bio: next.bio,
        avatar_url: next.avatar_url,
      }, { onConflict: "id" });
      if (error) throw error;
      await refreshProfile();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      await persist({ avatar_url: data.publicUrl });
      toast.success("Photo updated");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  };

  const profileLink = form.handle
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/u/${form.handle}`
    : "";
  const copyLink = async () => {
    if (!profileLink) return toast.error("Set a username first");
    try {
      await navigator.clipboard.writeText(profileLink);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 1600);
    } catch { toast.error("Couldn't copy"); }
  };

  if (authLoading || (!user && !profile)) {
    return <div className="flex h-[100dvh] items-center justify-center bg-background"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  const reorder = (from: number, to: number) => {
    if (from === to) return;
    const next = [...order];
    const [m] = next.splice(from, 1);
    next.splice(to, 0, m);
    setOrder(next);
  };

  const orderRoute = (label: string) =>
    label === "Boogle Studio" ? "/studio" : "/wallet";

  return (
    <div className="mx-auto min-h-[100dvh] max-w-[480px] bg-muted/50 pb-16 dark:bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center border-b border-border/40 bg-background/95 px-2 py-3 backdrop-blur">
        <Link to="/profile" className="p-2" aria-label="Back"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="flex-1 text-center font-display text-base font-bold">Edit profile</h1>
        <div className="w-9">{saving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}</div>
      </header>

      {/* Avatar block */}
      <div className="flex flex-col items-center pt-8 pb-6">
        <button onClick={() => avatarInput.current?.click()}
          className="relative h-24 w-24 overflow-hidden rounded-full ring-2 ring-background shadow-elegant active:scale-95">
          {form.avatar_url
            ? <img src={form.avatar_url} alt="" className="h-full w-full object-cover" />
            : <div className="bg-gradient-primary h-full w-full" />}
          <span className="absolute inset-0 flex items-center justify-center bg-black/30">
            {uploading
              ? <Loader2 className="h-5 w-5 animate-spin text-white" />
              : <Camera className="h-5 w-5 text-white" />}
          </span>
        </button>
        <button onClick={() => avatarInput.current?.click()}
          className="mt-3 text-sm font-semibold text-sky-500 active:opacity-70">
          Change photo
        </button>
        <input ref={avatarInput} type="file" accept="image/*" hidden
          onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
      </div>

      {/* Identity card */}
      <Card>
        <Row label="Name" value={form.display_name || "Add name"} onClick={() => setSheet("name")} />
        <Row label="Username" value={form.handle ? `@${form.handle}` : "Set username"} onClick={() => setSheet("username")} />
        <div className="flex items-center gap-3 border-t border-border/40 px-4 py-3.5">
          <span className="text-sm font-medium">Profile link</span>
          <span className="flex-1 truncate text-right text-sm text-muted-foreground">
            {profileLink || "—"}
          </span>
          <button onClick={copyLink} aria-label="Copy link" className="rounded-full p-1.5 text-sky-500 active:opacity-60">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      </Card>

      <SectionLabel>Basic info</SectionLabel>
      <Card>
        <Row label="Bio" value={form.bio || "Add a bio"} onClick={() => setSheet("bio")} multiline />
      </Card>

      <SectionLabel>Others</SectionLabel>
      <Card>
        <Row label="AI self" value="Add AI self" muted onClick={() => setSheet("ai")} />
      </Card>

      <SectionLabel>Change display order</SectionLabel>
      <Card>
        {order.map((label, i) => (
          <div
            key={label}
            draggable
            onDragStart={() => (dragIdx.current = i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => { if (dragIdx.current !== null) reorder(dragIdx.current, i); dragIdx.current = null; }}
            className={`flex items-center gap-3 px-4 py-3.5 ${i > 0 ? "border-t border-border/40" : ""}`}
          >
            <Link to={orderRoute(label)} className="flex-1 text-sm font-medium">{label}</Link>
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>
        ))}
      </Card>

      <EditSheet
        sheet={sheet}
        form={form}
        onClose={() => setSheet(null)}
        onSave={(patch) => { persist(patch); setSheet(null); }}
      />
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="px-5 pb-2 pt-5 text-xs font-medium text-muted-foreground">{children}</div>;
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="mx-3 overflow-hidden rounded-2xl bg-background shadow-sm">{children}</div>;
}

function Row({ label, value, onClick, muted, multiline }: {
  label: string; value: string; onClick?: () => void; muted?: boolean; multiline?: boolean;
}) {
  return (
    <button onClick={onClick}
      className="flex w-full items-center gap-3 border-border/40 px-4 py-3.5 text-left first:border-t-0 [&:not(:first-child)]:border-t active:bg-muted/40">
      <span className="text-sm font-medium">{label}</span>
      <span className={`flex-1 truncate text-right text-sm ${muted ? "text-muted-foreground" : "text-foreground/80"} ${multiline ? "line-clamp-2 whitespace-normal" : ""}`}>
        {value}
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </button>
  );
}

function EditSheet({ sheet, form, onClose, onSave }: {
  sheet: SheetKind; form: { display_name: string; handle: string; bio: string };
  onClose: () => void; onSave: (patch: Partial<{ display_name: string; handle: string; bio: string }>) => void;
}) {
  const [val, setVal] = useState("");
  useEffect(() => {
    if (sheet === "name") setVal(form.display_name);
    else if (sheet === "username") setVal(form.handle);
    else if (sheet === "bio") setVal(form.bio);
    else setVal("");
  }, [sheet, form]);

  if (!sheet) return null;
  const config = {
    name: { title: "Name", multi: false, placeholder: "Your name", commit: () => onSave({ display_name: val }) },
    username: { title: "Username", multi: false, placeholder: "username", commit: () => onSave({ handle: val.toLowerCase().replace(/[^a-z0-9_]/g, "") }) },
    bio: { title: "Bio", multi: true, placeholder: "Tell people about you", commit: () => onSave({ bio: val }) },
    ai: { title: "AI self", multi: false, placeholder: "Coming soon", commit: onClose },
  }[sheet];

  return (
    <div className="fixed inset-0 z-[95] flex items-end justify-center bg-black/55 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[480px] rounded-t-3xl bg-background p-5 shadow-elegant">
        <div className="mb-4 flex items-center justify-between">
          <button onClick={onClose} className="text-sm text-muted-foreground">Cancel</button>
          <h3 className="font-display font-bold">{config.title}</h3>
          <button onClick={config.commit} className="text-sm font-bold text-sky-500">Save</button>
        </div>
        {config.multi ? (
          <textarea autoFocus value={val} onChange={(e) => setVal(e.target.value)} rows={5}
            placeholder={config.placeholder}
            className="w-full resize-none rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
        ) : (
          <input autoFocus value={val} onChange={(e) => setVal(e.target.value)} placeholder={config.placeholder}
            className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
        )}
        {sheet === "ai" && (
          <p className="mt-3 text-xs text-muted-foreground">AI self lets your audience chat with a version of you trained on your posts. We'll notify you when it opens.</p>
        )}
      </div>
    </div>
  );
}
