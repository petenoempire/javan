import { supabase } from "@/integrations/supabase/client";
import type { FeedVideo, FeedAuthor } from "./types";

export async function fetchFeed(opts: { followingOf?: string | null; userId?: string | null; limit?: number } = {}): Promise<FeedVideo[]> {
  const limit = opts.limit ?? 25;
  let q = supabase
    .from("videos")
    .select("id,user_id,video_url,thumbnail_url,caption,music,tags,created_at,views,profiles!videos_user_id_fkey(id,handle,display_name,avatar_url,is_verified)")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (opts.followingOf) {
    const { data: follows } = await supabase.from("follows").select("following_id").eq("follower_id", opts.followingOf);
    const ids = (follows ?? []).map((f) => f.following_id);
    if (ids.length === 0) return [];
    q = q.in("user_id", ids);
  }

  const { data, error } = await q;
  if (error) {
    // fallback without join if FK alias not detected
    const { data: vids } = await supabase.from("videos").select("*").eq("status", "active").order("created_at", { ascending: false }).limit(limit);
    if (!vids || vids.length === 0) return [];
    const userIds = Array.from(new Set(vids.map((v) => v.user_id)));
    const { data: profs } = await supabase.from("profiles").select("id,handle,display_name,avatar_url,is_verified").in("id", userIds);
    const byId = new Map((profs ?? []).map((p: any) => [p.id, p]));
    return enrich(vids.map((v) => ({ ...v, author: byId.get(v.user_id) })) as any, opts.userId);
  }

  const mapped = (data ?? []).map((row: any) => ({
    ...row,
    author: row.profiles as FeedAuthor,
  }));
  return enrich(mapped, opts.userId);
}

async function enrich(rows: any[], userId?: string | null): Promise<FeedVideo[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const [likesRes, commentsRes, myLikesRes] = await Promise.all([
    supabase.from("video_likes").select("video_id").in("video_id", ids),
    supabase.from("comments").select("video_id").in("video_id", ids),
    userId
      ? supabase.from("video_likes").select("video_id").in("video_id", ids).eq("user_id", userId)
      : Promise.resolve({ data: [] as { video_id: string }[] }),
  ]);
  const likeCount = count((likesRes.data ?? []).map((r: any) => r.video_id));
  const commentCount = count((commentsRes.data ?? []).map((r: any) => r.video_id));
  const myLikes = new Set(((myLikesRes as any).data ?? []).map((r: any) => r.video_id));
  return rows.map((r) => ({
    id: r.id,
    user_id: r.user_id,
    video_url: r.video_url,
    thumbnail_url: r.thumbnail_url,
    caption: r.caption ?? "",
    music: r.music,
    tags: r.tags ?? [],
    created_at: r.created_at,
    views: r.views ?? 0,
    author: r.author ?? { id: r.user_id, handle: "user", display_name: "User", avatar_url: null, is_verified: false },
    like_count: likeCount.get(r.id) ?? 0,
    comment_count: commentCount.get(r.id) ?? 0,
    liked_by_me: myLikes.has(r.id),
  }));
}

function count(ids: string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const id of ids) m.set(id, (m.get(id) ?? 0) + 1);
  return m;
}
