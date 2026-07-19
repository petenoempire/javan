import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MobileShell } from "@/components/MobileShell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { MessageCircle, Heart, Share2, MoreHorizontal, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications · Javan" },
      { name: "description", content: "See your latest likes, comments, follows, and shares on Javan." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Notifications · Javan" },
      { property: "og:description", content: "See your latest likes, comments, follows, and shares on Javan." },
      { property: "og:url", content: "https://javan.lovable.app/notifications" },
      { name: "twitter:title", content: "Notifications · Javan" },
      { name: "twitter:description", content: "See your latest likes, comments, follows, and shares on Javan." },
    ],
    links: [{ rel: "canonical", href: "https://javan.lovable.app/notifications" }],
  }),
  component: NotificationsPage,
});

interface Notification {
  id: string;
  type: "like" | "comment" | "follow" | "share";
  actor: { handle: string; display_name: string; avatar_url?: string };
  post_id?: string;
  created_at: string;
}

function NotificationsPage() {
  const { user } = useAuth();
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*,actor:actor_id(handle,display_name,avatar_url)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(30);
      return (data as Notification[]) ?? [];
    },
  });

  const getIcon = (type: string) => {
    switch (type) {
      case "like":
        return <Heart className="h-4 w-4 text-rose-500" />;
      case "comment":
        return <MessageCircle className="h-4 w-4 text-cyan-500" />;
      case "follow":
        return <div className="h-4 w-4 rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-500" />;
      case "share":
        return <Share2 className="h-4 w-4 text-amber-500" />;
      default:
        return null;
    }
  };

  const getMessage = (notif: Notification) => {
    switch (notif.type) {
      case "like":
        return `${notif.actor.display_name} liked your post`;
      case "comment":
        return `${notif.actor.display_name} commented on your post`;
      case "follow":
        return `${notif.actor.display_name} started following you`;
      case "share":
        return `${notif.actor.display_name} shared your post`;
      default:
        return "New notification";
    }
  };

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => new Set(prev).add(id));
  };

  const filteredNotifications = notifications.filter((n) => !dismissedIds.has(n.id));

  return (
    <MobileShell>
      <div className="px-4 pt-4 pb-20">
        <h1 className="font-display text-2xl font-black mb-4">Notifications</h1>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-white"></div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageCircle className="h-12 w-12 text-white/20 mb-3" />
            <p className="text-sm text-white/50">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                className="flex items-center justify-between rounded-xl bg-white/5 border border-white/10 p-3 hover:bg-white/10 transition-all"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-500">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white">{getMessage(notif)}</p>
                    <p className="text-[10px] text-white/50">{new Date(notif.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDismiss(notif.id)}
                  aria-label="Dismiss notification"
                  className="shrink-0 text-white/50 hover:text-white active:scale-90 transition-all"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </MobileShell>
  );
}
