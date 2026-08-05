
-- =========================
-- VIDEOS
-- =========================
CREATE TABLE public.videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT DEFAULT '',
  music TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active',
  views INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.videos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.videos TO authenticated;
GRANT ALL ON public.videos TO service_role;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY videos_public_read ON public.videos FOR SELECT USING (status = 'active' OR auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY videos_owner_insert ON public.videos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY videos_owner_update ON public.videos FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY videos_owner_delete ON public.videos FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE INDEX videos_user_idx ON public.videos(user_id);
CREATE INDEX videos_created_idx ON public.videos(created_at DESC);

-- =========================
-- VIDEO LIKES
-- =========================
CREATE TABLE public.video_likes (
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (video_id, user_id)
);
GRANT SELECT ON public.video_likes TO anon;
GRANT SELECT, INSERT, DELETE ON public.video_likes TO authenticated;
GRANT ALL ON public.video_likes TO service_role;
ALTER TABLE public.video_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY likes_read_all ON public.video_likes FOR SELECT USING (true);
CREATE POLICY likes_self_insert ON public.video_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY likes_self_delete ON public.video_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- =========================
-- COMMENTS
-- =========================
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.comments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comments TO authenticated;
GRANT ALL ON public.comments TO service_role;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY comments_public_read ON public.comments FOR SELECT USING (true);
CREATE POLICY comments_self_insert ON public.comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY comments_self_delete ON public.comments FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE INDEX comments_video_idx ON public.comments(video_id, created_at DESC);

-- =========================
-- CONVERSATIONS & MESSAGES
-- =========================
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a UUID NOT NULL,
  user_b UUID NOT NULL,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (user_a < user_b),
  UNIQUE (user_a, user_b)
);
GRANT SELECT, INSERT, UPDATE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY conv_member_read ON public.conversations FOR SELECT TO authenticated USING (auth.uid() = user_a OR auth.uid() = user_b);
CREATE POLICY conv_member_insert ON public.conversations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_a OR auth.uid() = user_b);
CREATE POLICY conv_member_update ON public.conversations FOR UPDATE TO authenticated USING (auth.uid() = user_a OR auth.uid() = user_b);

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  body TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY msg_member_read ON public.messages FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND (c.user_a = auth.uid() OR c.user_b = auth.uid()))
);
CREATE POLICY msg_member_insert ON public.messages FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = sender_id AND EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND (c.user_a = auth.uid() OR c.user_b = auth.uid()))
);
CREATE POLICY msg_member_update ON public.messages FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND (c.user_a = auth.uid() OR c.user_b = auth.uid()))
);
CREATE INDEX messages_conv_idx ON public.messages(conversation_id, created_at);

-- =========================
-- VERIFICATIONS
-- =========================
CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE verification_kind AS ENUM ('individual', 'business');

CREATE TABLE public.verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  kind verification_kind NOT NULL DEFAULT 'individual',
  legal_name TEXT NOT NULL,
  country TEXT NOT NULL,
  document_type TEXT NOT NULL,
  document_url TEXT NOT NULL,
  selfie_url TEXT,
  notes TEXT,
  status verification_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  review_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.verifications TO authenticated;
GRANT ALL ON public.verifications TO service_role;
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY ver_self_read ON public.verifications FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY ver_self_insert ON public.verifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY ver_admin_update ON public.verifications FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX ver_status_idx ON public.verifications(status, created_at DESC);

-- =========================
-- REPORTS
-- =========================
CREATE TYPE report_status AS ENUM ('open', 'reviewed', 'dismissed', 'actioned');
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL,
  target_type TEXT NOT NULL,           -- 'user' | 'video' | 'comment' | 'message'
  target_id UUID NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status report_status NOT NULL DEFAULT 'open',
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY rep_self_insert ON public.reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY rep_self_read ON public.reports FOR SELECT TO authenticated USING (auth.uid() = reporter_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY rep_admin_update ON public.reports FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =========================
-- MODERATION ACTIONS
-- =========================
CREATE TYPE moderation_action AS ENUM ('warn', 'suspend', 'unsuspend', 'ban', 'unban', 'verify', 'unverify');
CREATE TABLE public.moderation_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user_id UUID NOT NULL,
  admin_id UUID NOT NULL,
  action moderation_action NOT NULL,
  reason TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.moderation_actions TO authenticated;
GRANT ALL ON public.moderation_actions TO service_role;
ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY mod_admin_read ON public.moderation_actions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin') OR auth.uid() = target_user_id);
CREATE POLICY mod_admin_insert ON public.moderation_actions FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') AND auth.uid() = admin_id);

-- =========================
-- PROFILE MODERATION FIELDS
-- =========================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS banned BOOLEAN NOT NULL DEFAULT false;

-- Allow admins to update any profile (for suspend/ban/verify)
DROP POLICY IF EXISTS profiles_admin_update ON public.profiles;
CREATE POLICY profiles_admin_update ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =========================
-- STORAGE BUCKETS
-- =========================
INSERT INTO storage.buckets (id, name, public) VALUES ('videos', 'videos', true)
  ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('verification-docs', 'verification-docs', false)
  ON CONFLICT (id) DO NOTHING;

-- videos storage policies
DROP POLICY IF EXISTS "videos public read" ON storage.objects;
CREATE POLICY "videos public read" ON storage.objects FOR SELECT USING (bucket_id = 'videos');
DROP POLICY IF EXISTS "videos owner upload" ON storage.objects;
CREATE POLICY "videos owner upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);
DROP POLICY IF EXISTS "videos owner delete" ON storage.objects;
CREATE POLICY "videos owner delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- verification docs: private, owner upload, admin read
DROP POLICY IF EXISTS "verif owner upload" ON storage.objects;
CREATE POLICY "verif owner upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'verification-docs' AND auth.uid()::text = (storage.foldername(name))[1]);
DROP POLICY IF EXISTS "verif owner read" ON storage.objects;
CREATE POLICY "verif owner read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'verification-docs' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin')));

-- =========================
-- WIPE SEED / DEMO DATA
-- =========================
DELETE FROM public.follows;
DELETE FROM public.gifts_sent;
DELETE FROM public.notifications;
UPDATE public.profiles SET coins = 0, earned_coins = 0, is_verified = false;

-- =========================
-- REALTIME
-- =========================
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
