ALTER TABLE public.videos
  ADD CONSTRAINT videos_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.comments
  ADD CONSTRAINT comments_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.video_likes
  ADD CONSTRAINT video_likes_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.conversations
  ADD CONSTRAINT conversations_user_a_fkey
  FOREIGN KEY (user_a) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.conversations
  ADD CONSTRAINT conversations_user_b_fkey
  FOREIGN KEY (user_b) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.messages
  ADD CONSTRAINT messages_sender_id_fkey
  FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_videos_user_id ON public.videos(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_video_likes_user_id ON public.video_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
