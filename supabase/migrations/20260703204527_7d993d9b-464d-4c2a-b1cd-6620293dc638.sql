-- ============ STORIES ============
CREATE TABLE public.stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'image' CHECK (media_type IN ('image','video')),
  caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours')
);
CREATE INDEX stories_user_created_idx ON public.stories (user_id, created_at DESC);
CREATE INDEX stories_expires_idx ON public.stories (expires_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.stories TO authenticated;
GRANT SELECT ON public.stories TO anon;
GRANT ALL ON public.stories TO service_role;

ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY stories_public_read ON public.stories FOR SELECT
  USING (expires_at > now());
CREATE POLICY stories_insert_own ON public.stories FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY stories_delete_own ON public.stories FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============ STORY VIEWS ============
CREATE TABLE public.story_views (
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (story_id, viewer_id)
);

GRANT SELECT, INSERT ON public.story_views TO authenticated;
GRANT ALL ON public.story_views TO service_role;

ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY story_views_read ON public.story_views FOR SELECT TO authenticated
  USING (
    auth.uid() = viewer_id
    OR EXISTS (SELECT 1 FROM public.stories s WHERE s.id = story_id AND s.user_id = auth.uid())
  );
CREATE POLICY story_views_insert_own ON public.story_views FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = viewer_id);

-- ============ LIVE STREAMS ============
CREATE TABLE public.live_streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  status TEXT NOT NULL DEFAULT 'live' CHECK (status IN ('live','ended')),
  viewer_count INT NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ
);
CREATE INDEX live_streams_status_started_idx ON public.live_streams (status, started_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.live_streams TO authenticated;
GRANT SELECT ON public.live_streams TO anon;
GRANT ALL ON public.live_streams TO service_role;

ALTER TABLE public.live_streams ENABLE ROW LEVEL SECURITY;

CREATE POLICY live_streams_public_read ON public.live_streams FOR SELECT USING (true);
CREATE POLICY live_streams_insert_own ON public.live_streams FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = host_id);
CREATE POLICY live_streams_update_own ON public.live_streams FOR UPDATE TO authenticated
  USING (auth.uid() = host_id) WITH CHECK (auth.uid() = host_id);

-- ============ LIVE CHAT MESSAGES ============
CREATE TABLE public.live_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID NOT NULL REFERENCES public.live_streams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'chat' CHECK (kind IN ('chat','gift','join','heart')),
  body TEXT NOT NULL DEFAULT '',
  gift_key TEXT,
  gift_coins INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX live_chat_stream_created_idx ON public.live_chat_messages (stream_id, created_at DESC);

GRANT SELECT, INSERT ON public.live_chat_messages TO authenticated;
GRANT SELECT ON public.live_chat_messages TO anon;
GRANT ALL ON public.live_chat_messages TO service_role;

ALTER TABLE public.live_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY live_chat_public_read ON public.live_chat_messages FOR SELECT USING (true);
CREATE POLICY live_chat_insert_own ON public.live_chat_messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============ REALTIME ============
ALTER PUBLICATION supabase_realtime ADD TABLE public.stories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_streams;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_chat_messages;
