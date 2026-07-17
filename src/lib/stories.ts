import { supabase } from "@/integrations/supabase/client";

export interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: "image" | "video";
  caption: string | null;
  created_at: string;
  expires_at: string;
}

export interface StoryAuthor {
  id: string;
  handle: string;
  display_name: string;
  avatar_url: string | null;
  is_verified?: boolean;
}

export interface StoryTrayItem {
  author: StoryAuthor;
  stories: Story[];
  hasUnviewed: boolean;
}

/** Mark a story as viewed by the current user (idempotent, safe to call repeatedly). */
export async function markStoryViewed(storyId: string, viewerId: string) {
  return supabase.from("story_views").upsert(
    { story_id: storyId, viewer_id: viewerId },
    { onConflict: "story_id,viewer_id" }
  );
}

/** Get all active (non-expired) stories, grouped by author, for the tray. */
export async function loadStoryTray(currentUserId: string | undefined): Promise<StoryTrayItem[]> {
  const { data: stories } = await supabase
    .from("stories")
    .select("id,user_id,media_url,media_type,caption,created_at,expires_at")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: true });

  if (!stories || stories.length === 0) return [];

  const userIds = [...new Set(stories.map((s: any) => s.user_id))];

  const { data: profiles } = await supabase
    .from("public_profiles")
    .select("id,handle,display_name,avatar_url")
    .in("id", userIds);

  const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));

  let viewedIds = new Set<string>();
  if (currentUserId) {
    const { data: views } = await supabase
      .from("story_views")
      .select("story_id")
      .eq("viewer_id", currentUserId);
    viewedIds = new Set((views ?? []).map((v: any) => v.story_id));
  }

  const grouped = new Map<string, Story[]>();
  for (const story of stories as Story[]) {
    const existing = grouped.get(story.user_id) ?? [];
    existing.push(story);
    grouped.set(story.user_id, existing);
  }

  return Array.from(grouped.entries())
    .map(([userId, userStories]) => {
      const author = profileMap.get(userId);
      if (!author) return null;
      return {
        author: author as StoryAuthor,
        stories: userStories,
        hasUnviewed: userStories.some((s) => !viewedIds.has(s.id)),
      };
    })
    .filter((item): item is StoryTrayItem => item !== null);
}

/** Upload a story file to Supabase Storage and return its public URL. */
export async function uploadStoryMedia(
  file: File,
  userId: string
): Promise<{ url: string; mediaType: "image" | "video" }> {
  const isVideo = file.type.startsWith("video/");
  const ext = file.name.split(".").pop() || (isVideo ? "mp4" : "jpg");
  const path = `${userId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from("stories").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) throw error;

  const { data } = supabase.storage.from("stories").getPublicUrl(path);

  return { url: data.publicUrl, mediaType: isVideo ? "video" : "image" };
}

/** Create a new story record after the media has been uploaded. */
export async function createStory(params: {
  userId: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  caption?: string;
}) {
  return supabase.from("stories").insert({
    user_id: params.userId,
    media_url: params.mediaUrl,
    media_type: params.mediaType,
    caption: params.caption || null,
  });
}

/** Delete a story (owner only — enforced by RLS too). */
export async function deleteStory(storyId: string) {
  return supabase.from("stories").delete().eq("id", storyId);
}

/** Get the list of viewers for a story you own. */
export async function getStoryViewers(storyId: string) {
  const { data } = await supabase
    .from("story_views")
    .select("viewer_id, viewed_at")
    .eq("story_id", storyId)
    .order("viewed_at", { ascending: false });

  if (!data || data.length === 0) return [];

  const viewerIds = data.map((v: any) => v.viewer_id);
  const { data: profiles } = await supabase
    .from("public_profiles")
    .select("id,handle,display_name,avatar_url")
    .in("id", viewerIds);

  const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));

  return data.map((v: any) => ({
    ...profileMap.get(v.viewer_id),
    viewed_at: v.viewed_at,
  }));
}
