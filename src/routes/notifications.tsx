import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import {
  ArrowLeft, Heart, MessageCircle, UserPlus, Bell, AtSign,
  Star, TrendingUp, Filter, X, Eye, Clock, Gift, Radio,
  Users, Sparkles, ChevronRight, Trash2, Check
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

const PAGE_TITLE = "Activity Center · Javan";
const PAGE_DESC =
  "Track all your Javan activity: new followers, likes, comments, and notifications in real time.";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: PAGE_TITLE },
      { name: "description", content: PAGE_DESC },
      { property: "og:title", content: PAGE_TITLE },
      { property: "og:description", content: PAGE_DESC },
      { property: "og:url", content: "https://javan.lovable.app/notifications" },
    ],
    links: [{ rel: "canonical", href: "https://javan.lovable.app/notifications" }],
  }),
  component: NotificationsPage,
});

type NotificationType = "like" | "comment" | "follow" | "mention" | "gift" | "live" | "trending" | "system";

interface Notification {
  id: string;
  type: NotificationType;
  actor_name: string;
  actor_handle: string;
  actor_avatar: string;
  actor_id: string;
  message: string;
  video_id?: string;
  created_at: string;
  read: boolean;
}

const TYPE_CONFIG: Record<NotificationType, { icon: any; color: string; bg: string; glow: string }> = {
  like: { icon: Heart, color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20", glow: "rgba(255,45,85,0.3)" },
  comment: { icon: MessageCircle, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20", glow: "rgba(0,212,255,0.3)" },
  follow: { icon: UserPlus, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", glow: "rgba(52,211,153,0.3)" },
  mention: { icon: AtSign, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20", glow: "rgba(139,92,246,0.3)" },
  gift: { icon: Gift, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", glow: "rgba(251,191,36,0.3)" },
  live: { icon: Radio, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20", glow: "rgba(244,63,94,0.3)" },
  trending: { icon: TrendingUp, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20", glow: "rgba(251,146,60,0.3)" },
  system: { icon: Bell, color: "text-white/50", bg: "bg-white/5 border-white/10", glow: "rgba(255,255,255,0.1)" },
};

const FILTERS = [
  { key: "all" as const, label: "All", icon: Bell },
  { key: "likes" as const, label: "Likes", icon: Heart },
  { key: "comments" as const, label: "Comments", icon: MessageCircle },
  { key: "follows" as const, label: "Follows", icon: UserPlus },
  { key: "gifts" as const, label: "Gifts", icon: Gift },
  { key: "live" as const, label: "Live", icon: Radio },
];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d`;
  return new Date(dateStr).toLocaleDateString();
}

function NotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"all" | "likes" | "comments" | "follows" | "gifts" | "live">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [readMode, setReadMode] = useState(false);

  const { data = [], refetch, isLoading } = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data as Notification[]) ?? [];
    },
  });

  // Filter notifications
  const filtered = data.filter((n: Notification) => {
    if (readMode && n.read) return false;
    if (filter === "all") return true;
    if (filter === "likes" && n.type === "like") return true;
    if (filter === "comments" && n.type === "comment") return true;
    if (filter === "follows" && n.type === "follow") return true;
    if (filter === "gifts" && n.type === "gift") return true;
    if (filter === "live" && n.type === "live") return true;
    return false;
  });

  const unreadCount = data.filter((n: Notification) => !n.read).length;

  const markAllRead = async () => {
    if (!user) return;
    try {
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false);
      toast.success("All marked as read");
      refetch();
    } catch {
      toast.error("Failed to mark as read");
    }
  };

  const deleteSelected = async () => {
    if (!user || selected.size === 0) return;
    try {
      await supabase
        .from("notifications")
        .delete()
        .eq("user_id", user.id)
        .in("id", Array.from(selected));
      toast.success(`${selected.size} notification(s) deleted`);
      setSelected(new Set());
      refetch();
    } catch {
      toast.error("Failed to delete notifications");
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!user) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center px-8 bg-[#020210] text-white lg:hidden">
        <Bell className="h-16 w-16 text-white/20 mb-4" />
        <h2 className="text-lg font-bold mb-2">Activity Center</h2>
        <p className="text-sm text-white/50 mb-6">Sign in to view your notifications</p>
        <Link to="/auth" className="bg-gradient-primary rounded-full px-6 py-2.5 text-sm font-bold text-white">Sign In</Link>
      </div>
    );
  }

  return (
    <>
    {/* ─── DESKTOP LAYOUT ─── */}
    <div className="hidden lg:block min-h-screen bg-[#020210]">
      <div className="max-w-2xl mx-auto py-10 px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link to="/" className="p-2 rounded-full hover:bg-white/10 transition-all" aria-label="Back to home">
              <ArrowLeft className="h-5 w-5 text-white/70" />
            </Link>
            <div>
              <h1 className="font-display text-2xl font-black text-chrome">Activity Center</h1>
              {unreadCount > 0 && (
                <span className="text-xs text-cyan-400 font-bold">{unreadCount} unread</span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-4 py-2 text-xs font-bold hover:bg-white/10 transition-all active:scale-95"
            >
              <Check className="h-3.5 w-3.5" /> Mark All Read
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold whitespace-nowrap transition-all active:scale-95 ${
                filter === f.key
                  ? "bg-white/15 text-white border border-white/20"
                  : "bg-white/5 text-white/50 border border-white/5 hover:text-white"
              }`}
            >
              <f.icon className="h-3.5 w-3.5" /> {f.label}
            </button>
          ))}
          <button
            onClick={() => setReadMode(!readMode)}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold whitespace-nowrap transition-all active:scale-95 ${
              readMode
                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                : "bg-white/5 text-white/50 border border-white/5 hover:text-white"
            }`}
          >
            <Eye className="h-3.5 w-3.5" /> {readMode ? "Unread Only" : "All"}
          </button>
        </div>

        {/* Notifications List */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-white/50 mt-4">Loading activity...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center glass rounded-3xl border border-white/5">
            <Bell className="h-12 w-12 text-white/20 mb-4" />
            <p className="text-white/50 text-sm">
              {readMode ? "All caught up! No unread notifications." : "No notifications yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((notif: Notification) => {
              const config = TYPE_CONFIG[notif.type];
              const Icon = config.icon;
              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-center gap-3 p-4 rounded-2xl border transition-all hover:bg-white/5 active:scale-[0.98] cursor-pointer ${
                    notif.read
                      ? "bg-white/[0.02] border-white/5"
                      : "bg-white/[0.04] border-white/10"
                  }`}
                  onClick={() => {
                    if (notif.video_id) {
                      navigate({ to: "/posts/$id", params: { id: notif.video_id } });
                    } else if (notif.type === "follow") {
                      navigate({ to: "/u/$handle", params: { handle: notif.actor_handle } });
                    }
                  }}
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${config.bg}`}>
                    <Icon className={`h-5 w-5 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white/90 truncate">
                      <span className="font-bold">@{notif.actor_handle}</span> {notif.message}
                    </p>
                    <p className="text-[11px] text-white/40 mt-0.5">{timeAgo(notif.created_at)}</p>
                  </div>
                  {!notif.read && (
                    <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(0,212,255,0.6)] shrink-0" />
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>

    {/* ─── MOBILE LAYOUT — ISOLATED FULL-SCREEN ─── */}
    <div className="lg:hidden fixed inset-0 z-[60] bg-[#020210] flex flex-col">
      {/* Immersive Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-purple-500/5 blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] rounded-full bg-cyan-500/5 blur-[100px]" />
      </div>

      {/* Sticky Header with Back Button */}
      <div className="relative z-10 flex items-center gap-3 px-4 py-4 border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <button
          onClick={() => navigate({ to: "/" })}
          className="p-2 rounded-full hover:bg-white/10 active:scale-90 transition-all"
          aria-label="Back to home"
        >
          <ArrowLeft className="h-5 w-5 text-white" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-lg font-black text-chrome truncate">Activity Center</h1>
          {unreadCount > 0 && (
            <p className="text-[11px] text-cyan-400 font-bold">{unreadCount} unread</p>
          )}
        </div>
        <button
          onClick={markAllRead}
          className="p-2 rounded-full hover:bg-white/10 active:scale-90 transition-all"
          aria-label="Mark all as read"
        >
          <Check className="h-5 w-5 text-white/70" />
        </button>
      </div>

      {/* Filter Scroll Bar */}
      <div className="relative z-10 flex gap-2 px-4 py-3 overflow-x-auto no-scrollbar border-b border-white/5">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold whitespace-nowrap transition-all active:scale-90 shrink-0 ${
              filter === f.key
                ? "bg-white/15 text-white border border-white/20"
                : "bg-white/5 text-white/50 border border-white/5"
            }`}
          >
            <f.icon className="h-3 w-3" /> {f.label}
          </button>
        ))}
        <button
          onClick={() => setReadMode(!readMode)}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold whitespace-nowrap transition-all active:scale-90 shrink-0 ${
            readMode
              ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
              : "bg-white/5 text-white/50 border border-white/5"
          }`}
        >
          <Eye className="h-3 w-3" /> {readMode ? "Unread" : "All"}
        </button>
      </div>

      {/* Scrollable Notifications List */}
      <div className="relative z-10 flex-1 overflow-y-auto px-3 py-2">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-white/50 mt-4">Loading...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Bell className="h-12 w-12 text-white/20 mb-3" />
            <p className="text-sm text-white/50">
              {readMode ? "All caught up!" : "No notifications yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-1.5 pb-8">
            {filtered.map((notif: Notification) => {
              const config = TYPE_CONFIG[notif.type];
              const Icon = config.icon;
              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all active:scale-[0.97] cursor-pointer ${
                    notif.read
                      ? "bg-white/[0.02] border-white/5"
                      : "bg-white/[0.04] border-white/10"
                  }`}
                  onClick={() => {
                    if (notif.video_id) {
                      navigate({ to: "/posts/$id", params: { id: notif.video_id } });
                    } else if (notif.type === "follow") {
                      navigate({ to: "/u/$handle", params: { handle: notif.actor_handle } });
                    } else if (notif.actor_handle) {
                      navigate({ to: "/u/$handle", params: { handle: notif.actor_handle } });
                    }
                  }}
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${config.bg}`}>
                    <Icon className={`h-5 w-5 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white/90 truncate">
                      <span className="font-bold">@{notif.actor_handle}</span> {notif.message}
                    </p>
                    <p className="text-[10px] text-white/40 mt-0.5 flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" /> {timeAgo(notif.created_at)}
                    </p>
                  </div>
                  {!notif.read && (
                    <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(0,212,255,0.6)] shrink-0" />
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
    </>
  );
}
