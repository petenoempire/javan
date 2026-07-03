import { supabase } from "@/integrations/supabase/client";

export type StoryAuthor = {
  id: string;
  handle: string;
  display_name: string;
  avatar_url: string | null;
  is_verified: boolean;
};

export type Story = {
  id: string;
  user_id: string;
  media_url: string;
  media_type: "image" | "video";
  caption: string | null;
  created_at: string;
  expires_at: string;
};

export type StoryReel = {
  author: StoryAuthor;
  stories: Story[];
  has_unseen: boolean;
};

export async function fetchStoryReels(viewerId: string | null): Promise<StoryReel[]> {
  const { data: rows } = await supabase
    .from("stories")
    .select("id,user_id,media_url,media_type,caption,created_at,expires_at")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: true });
  const stories = (rows ?? []) as Story[];
  if (stories.length === 0) return [];

  const userIds = Array.from(new Set(stories.map((s) => s.user_id)));
  const { data: profs } = await supabase
    .from("profiles")
    .select("id,handle,display_name,avatar_url,is_verified")
    .in("id", userIds);
  const byId = new Map((profs ?? []).map((p: any) => [p.id as string, p as StoryAuthor]));

  let seen = new Set<string>();
  if (viewerId) {
    const { data: views } = await supabase
      .from("story_views")
      .select("story_id")
      .eq("viewer_id", viewerId)
      .in("story_id", stories.map((s) => s.id));
    seen = new Set((views ?? []).map((v: any) => v.story_id as string));
  }

  const grouped = new Map<string, StoryReel>();
  for (const s of stories) {
    const author = byId.get(s.user_id) ?? { id: s.user_id, handle: "user", display_name: "User", avatar_url: null, is_verified: false };
    const reel = grouped.get(s.user_id) ?? { author, stories: [], has_unseen: false };
    reel.stories.push(s);
    if (!seen.has(s.id)) reel.has_unseen = true;
    grouped.set(s.user_id, reel);
  }
  // Reels with unseen first, then most-recent
  return Array.from(grouped.values()).sort((a, b) => {
    if (a.has_unseen !== b.has_unseen) return a.has_unseen ? -1 : 1;
    const la = a.stories[a.stories.length - 1].created_at;
    const lb = b.stories[b.stories.length - 1].created_at;
    return lb.localeCompare(la);
  });
}

export async function markStoryViewed(storyId: string, viewerId: string) {
  await supabase.from("story_views").insert({ story_id: storyId, viewer_id: viewerId });
}
