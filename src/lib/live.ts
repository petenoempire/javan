import { supabase } from "@/integrations/supabase/client";

export type LiveAuthor = {
  id: string;
  handle: string;
  display_name: string;
  avatar_url: string | null;
  is_verified: boolean;
};

export type LiveStream = {
  id: string;
  host_id: string;
  title: string | null;
  status: "live" | "ended";
  viewer_count: number;
  started_at: string;
  ended_at: string | null;
  host: LiveAuthor;
};

export type LiveMessage = {
  id: string;
  stream_id: string;
  user_id: string;
  kind: "chat" | "gift" | "join" | "heart";
  body: string;
  gift_key: string | null;
  gift_coins: number;
  created_at: string;
  author?: LiveAuthor;
};

export async function fetchActiveStreams(limit = 40): Promise<LiveStream[]> {
  const { data } = await supabase
    .from("live_streams")
    .select("id,host_id,title,status,viewer_count,started_at,ended_at")
    .eq("status", "live")
    .order("started_at", { ascending: false })
    .limit(limit);
  const rows = (data ?? []) as Omit<LiveStream, "host">[];
  if (rows.length === 0) return [];
  const ids = Array.from(new Set(rows.map((r) => r.host_id)));
  const { data: profs } = await supabase
    .from("profiles")
    .select("id,handle,display_name,avatar_url,is_verified")
    .in("id", ids);
  const byId = new Map((profs ?? []).map((p: any) => [p.id as string, p as LiveAuthor]));
  return rows.map((r) => ({
    ...r,
    host: byId.get(r.host_id) ?? { id: r.host_id, handle: "creator", display_name: "Creator", avatar_url: null, is_verified: false },
  }));
}

export async function fetchStream(id: string): Promise<LiveStream | null> {
  const { data } = await supabase
    .from("live_streams")
    .select("id,host_id,title,status,viewer_count,started_at,ended_at")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const { data: prof } = await supabase
    .from("profiles")
    .select("id,handle,display_name,avatar_url,is_verified")
    .eq("id", data.host_id)
    .maybeSingle();
  return {
    ...(data as any),
    host: (prof as LiveAuthor) ?? { id: data.host_id, handle: "creator", display_name: "Creator", avatar_url: null, is_verified: false },
  };
}

export async function fetchRecentMessages(streamId: string, limit = 40): Promise<LiveMessage[]> {
  const { data } = await supabase
    .from("live_chat_messages")
    .select("id,stream_id,user_id,kind,body,gift_key,gift_coins,created_at")
    .eq("stream_id", streamId)
    .order("created_at", { ascending: false })
    .limit(limit);
  const rows = ((data ?? []) as LiveMessage[]).slice().reverse();
  if (rows.length === 0) return [];
  const ids = Array.from(new Set(rows.map((r) => r.user_id)));
  const { data: profs } = await supabase
    .from("profiles")
    .select("id,handle,display_name,avatar_url,is_verified")
    .in("id", ids);
  const byId = new Map((profs ?? []).map((p: any) => [p.id as string, p as LiveAuthor]));
  return rows.map((r) => ({ ...r, author: byId.get(r.user_id) }));
}

export async function hydrateAuthor(userId: string): Promise<LiveAuthor | undefined> {
  const { data } = await supabase
    .from("profiles")
    .select("id,handle,display_name,avatar_url,is_verified")
    .eq("id", userId)
    .maybeSingle();
  return (data as LiveAuthor) ?? undefined;
}

export async function postChat(streamId: string, userId: string, body: string) {
  return supabase.from("live_chat_messages").insert({ stream_id: streamId, user_id: userId, kind: "chat", body });
}

export async function postHeart(streamId: string, userId: string) {
  return supabase.from("live_chat_messages").insert({ stream_id: streamId, user_id: userId, kind: "heart", body: "" });
}

export async function postJoin(streamId: string, userId: string) {
  return supabase.from("live_chat_messages").insert({ stream_id: streamId, user_id: userId, kind: "join", body: "joined" });
}

export async function endStream(streamId: string) {
  return supabase.from("live_streams").update({ status: "ended", ended_at: new Date().toISOString() }).eq("id", streamId);
}
