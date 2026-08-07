import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MobileShell } from "@/components/MobileShell";
import { DesktopLayout } from "@/components/DesktopLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Share2,
  Bell,
  Users,
  Shield,
  Camera,
  Hand,
  Send,
  Video,
  Star,
  UserPlus,
  Info,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { StoryTray } from "@/components/StoryTray";

export const Route = createFileRoute("/inbox")({
  head: () => ({
    meta: [
      { title: "Messages · Javan" },
      {
        name: "description",
        content:
          "View and manage your direct messages, stories, and activity notifications on Javan.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Messages · Javan" },
      {
        property: "og:description",
        content:
          "View and manage your direct messages, stories, and activity notifications on Javan.",
      },
      { property: "og:url", content: "https://javan.lovable.app/inbox" },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "Messages · Javan" },
      {
        name: "twitter:description",
        content:
          "View and manage your direct messages, stories, and activity notifications on Javan.",
      },
    ],
    links: [{ rel: "canonical", href: "https://javan.lovable.app/inbox" }],
  }),
  component: InboxPage,
});

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  sender?: { handle: string; display_name: string; avatar_url?: string; is_verified?: boolean };
}

interface FollowerNotification {
  id: string;
  follower: { handle: string; display_name: string; avatar_url?: string; is_verified?: boolean };
  created_at: string;
}

/* ──────────────────────────────────────────────
   STORY CIRCLES — TikTok-style top section
   ────────────────────────────────────────────── */
function StoryCircles() {
  return <StoryTray />;
}

/* ──────────────────────────────────────────────
   NOTIFICATION CATEGORY ROWS — TikTok-style
   ────────────────────────────────────────────── */
function NotificationCategory({
  icon: Icon,
  iconColor,
  title,
  subtitle,
  count,
  onClick,
}: {
  icon: any;
  iconColor: string;
  title: string;
  subtitle: string;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl active:bg-white/5 transition-all text-left"
    >
      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${iconColor}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-white">{title}</p>
        <p className="text-[11px] text-white/40 truncate">{subtitle}</p>
      </div>
      {count ? (
        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-cyan-500 px-1.5 text-[10px] font-black text-black">
          {count > 99 ? "99+" : count}
        </span>
      ) : (
        <ArrowLeft className="h-4 w-4 text-white/20 rotate-180" />
      )}
    </button>
  );
}

/* ──────────────────────────────────────────────
   DM LIST ITEM — with wave button and status
   ────────────────────────────────────────────── */
function DMListItem({
  msg,
  userId,
  isOnline,
}: {
  msg: Message;
  userId: string;
  isOnline?: boolean;
}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const waveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("messages").insert({
        conversation_id: msg.conversation_id,
        sender_id: userId,
        body: "👋",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Wave sent!");
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to send wave");
    },
  });

  const timeAgo = () => {
    const diff = Date.now() - new Date(msg.created_at).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3.5 active:bg-white/5 rounded-xl transition-all">
      <div className="relative shrink-0">
        <Link to="/inbox/$id" params={{ id: msg.sender_id }}>
          <Avatar className="h-13 w-13 border border-white/10">
            <AvatarImage src={msg.sender?.avatar_url} />
            <AvatarFallback className="text-sm font-bold bg-gradient-to-br from-purple-500/30 to-cyan-500/30 text-white">
              {msg.sender?.display_name?.[0] || msg.sender?.handle?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        </Link>
        {isOnline && (
          <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-400 border-2 border-[#020210]" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="text-sm font-bold text-white truncate">
            {msg.sender?.display_name || msg.sender?.handle || "Unknown"}
          </span>
          {msg.sender?.is_verified && (
            <span className="h-3.5 w-3.5 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0">
              <Shield className="h-2.5 w-2.5 text-cyan-400" />
            </span>
          )}
        </div>
        <p className="text-[11px] text-white/40 truncate mt-0.5">{msg.body}</p>
      </div>
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <span className="text-[10px] text-white/30 font-mono">{timeAgo()}</span>
        <button
          onClick={() => waveMutation.mutate()}
          disabled={waveMutation.isPending}
          className="flex items-center justify-center h-8 w-8 rounded-full bg-white/10 border border-white/10 active:scale-90 transition-all hover:bg-white/20"
          aria-label="Send wave"
        >
          <Hand className="h-4 w-4 text-white/60" />
        </button>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   MAIN INBOX PAGE
   ────────────────────────────────────────────── */
function InboxPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ["conversations"],
    enabled: !!user,
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("conversations")
        .select("id, user_a, user_b, last_message_at")
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
        .order("last_message_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      const conversationRows = rows ?? [];
      if (!conversationRows.length) return [];
      const otherIds = conversationRows.map((row: any) =>
        row.user_a === user.id ? row.user_b : row.user_a,
      );
      const [{ data: profiles }, { data: messages }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id,handle,display_name,avatar_url,is_verified")
          .in("id", otherIds),
        supabase
          .from("messages")
          .select("id,conversation_id,sender_id,body,created_at")
          .in(
            "conversation_id",
            conversationRows.map((row: any) => row.id),
          )
          .order("created_at", { ascending: false })
          .limit(100),
      ]);
      const profileMap = new Map((profiles ?? []).map((profile: any) => [profile.id, profile]));
      const latestByConversation = new Map<string, any>();
      for (const message of messages ?? [])
        if (!latestByConversation.has(message.conversation_id))
          latestByConversation.set(message.conversation_id, message);
      return conversationRows.map((row: any) => {
        const otherId = row.user_a === user.id ? row.user_b : row.user_a;
        const latest = latestByConversation.get(row.id);
        return {
          id: row.id,
          conversation_id: row.id,
          sender_id: otherId,
          body: latest?.body ?? "No messages yet",
          created_at: latest?.created_at ?? row.last_message_at,
          sender: profileMap.get(otherId),
        } as Message;
      });
    },
  });

  const uniqueConversations = conversations;

  const { data: unreadMessageCount = 0 } = useQuery({
    queryKey: ["unread-message-notifications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("kind", "message")
        .is("read_at", null);
      if (error) throw error;
      return count ?? 0;
    },
  });

  const queryClient = useQueryClient();
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`inbox-message-notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        async (payload: any) => {
          if (payload.new?.kind !== "message") return;
          const { data: actor } = await supabase
            .from("profiles")
            .select("display_name,handle")
            .eq("id", payload.new.actor_id)
            .maybeSingle();
          const sender = actor?.display_name || actor?.handle || "Someone";
          toast.info(`New message from ${sender}`, {
            description: payload.new.body || "You received a new direct message.",
            action: { label: "Open Inbox", onClick: () => navigate({ to: "/inbox" }) },
          });
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
          queryClient.invalidateQueries({ queryKey: ["unread-message-notifications", user.id] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [navigate, queryClient, user?.id]);

  const { data: followerCount } = useQuery({
    queryKey: ["new-followers-count"],
    enabled: !!user,
    queryFn: async () => {
      const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      const { count } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", user!.id)
        .gte("created_at", since);
      return count ?? 0;
    },
  });

  return (
    <>
      <DesktopLayout>
        <div className="max-w-4xl mx-auto py-10">
          <h1 className="text-4xl font-black text-chrome mb-8">Messages</h1>
          <StoryCircles />
          <div className="mt-4 space-y-1 rounded-2xl bg-white/[0.02] border border-white/5 overflow-hidden">
            <NotificationCategory
              icon={UserPlus}
              iconColor="bg-gradient-to-r from-purple-500/20 to-purple-600/20"
              title="New followers"
              subtitle="People who started following you"
              count={followerCount}
              onClick={() => navigate({ to: "/notifications" })}
            />
            <NotificationCategory
              icon={Bell}
              iconColor="bg-gradient-to-r from-cyan-500/20 to-cyan-600/20"
              title="Activity"
              subtitle="Likes, comments, and mentions"
              onClick={() => navigate({ to: "/notifications" })}
            />
            <NotificationCategory
              icon={Shield}
              iconColor="bg-gradient-to-r from-amber-500/20 to-amber-600/20"
              title="System notifications"
              subtitle="Updates about your account"
              onClick={() => navigate({ to: "/notifications" })}
            />
          </div>
          <h2 className="mt-8 mb-4 flex items-center gap-2 text-lg font-black text-chrome">
            Direct Messages{" "}
            {unreadMessageCount > 0 && (
              <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] text-white">
                {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
              </span>
            )}
          </h2>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-white"></div>
            </div>
          ) : uniqueConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center glass rounded-2xl border border-white/5">
              <MessageCircle className="h-12 w-12 text-white/10 mb-4" />
              <p className="text-white/40 text-sm">No messages yet. Start a conversation!</p>
            </div>
          ) : (
            <div className="rounded-2xl bg-white/[0.02] border border-white/5 overflow-hidden">
              {uniqueConversations.map((msg) => (
                <DMListItem key={msg.id} msg={msg} userId={user!.id} isOnline={false} />
              ))}
            </div>
          )}
        </div>
      </DesktopLayout>
      <MobileShell showBack backTo="/">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 pt-4 pb-2">
            <div className="flex-1">
              <h1 className="font-display text-xl font-black text-chrome">Inbox</h1>
            </div>
            <button
              onClick={() => navigate({ to: "/discover" })}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 active:scale-90 transition-all"
              aria-label="Back to home"
            >
              <ArrowLeft className="h-5 w-5 text-white" />
            </button>
          </div>

          {/* Story Circles */}
          <StoryCircles />

          {/* Notification Categories */}
          <div className="px-2 py-2 space-y-0.5">
            <NotificationCategory
              icon={UserPlus}
              iconColor="bg-gradient-to-r from-purple-500/20 to-purple-600/20"
              title="New followers"
              subtitle="People who started following you"
              count={followerCount}
              onClick={() => navigate({ to: "/notifications" })}
            />
            <NotificationCategory
              icon={Bell}
              iconColor="bg-gradient-to-r from-cyan-500/20 to-cyan-600/20"
              title="Activity"
              subtitle="Likes, comments, and mentions"
              onClick={() => navigate({ to: "/notifications" })}
            />
            <NotificationCategory
              icon={Shield}
              iconColor="bg-gradient-to-r from-amber-500/20 to-amber-600/20"
              title="System notifications"
              subtitle="Updates about your account"
              onClick={() => navigate({ to: "/notifications" })}
            />
          </div>

          {/* Direct Messages Header */}
          <div className="flex items-center justify-between px-4 py-2">
            <h2 className="text-sm font-black text-white/70 uppercase tracking-wider">Messages</h2>
            <span className="flex items-center gap-2 text-[10px] text-white/30">
              {unreadMessageCount > 0 && (
                <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-white">
                  {unreadMessageCount > 99 ? "99+" : unreadMessageCount} new
                </span>
              )}
              {uniqueConversations.length} conversations
            </span>
          </div>

          {/* DM List */}
          <div className="flex-1 overflow-y-auto no-scrollbar pb-8">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-white"></div>
              </div>
            ) : uniqueConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <MessageCircle className="h-12 w-12 text-white/15 mb-3" />
                <p className="text-sm text-white/40">No messages yet</p>
                <p className="text-xs text-white/25 mt-1">Start a conversation to see it here</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {uniqueConversations.map((msg) => (
                  <DMListItem key={msg.id} msg={msg} userId={user!.id} isOnline={false} />
                ))}
              </div>
            )}
          </div>
        </div>
      </MobileShell>
    </>
  );
}
