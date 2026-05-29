export type FeedAuthor = {
  id: string;
  handle: string;
  display_name: string;
  avatar_url: string | null;
  is_verified: boolean;
};

export type FeedVideo = {
  id: string;
  user_id: string;
  video_url: string;
  thumbnail_url: string | null;
  caption: string;
  music: string | null;
  tags: string[];
  created_at: string;
  views: number;
  author: FeedAuthor;
  like_count: number;
  comment_count: number;
  liked_by_me: boolean;
};
