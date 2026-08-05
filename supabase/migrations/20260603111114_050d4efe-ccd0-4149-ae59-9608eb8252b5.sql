CREATE TABLE public.profile_views (
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (profile_id, viewer_id),
  CHECK (profile_id <> viewer_id)
);

GRANT SELECT, INSERT, UPDATE ON public.profile_views TO authenticated;
GRANT ALL ON public.profile_views TO service_role;

ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profile_views_owner_read"
ON public.profile_views
FOR SELECT
TO authenticated
USING (auth.uid() = profile_id);

CREATE POLICY "profile_views_visitor_insert"
ON public.profile_views
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = viewer_id AND auth.uid() <> profile_id);

CREATE POLICY "profile_views_visitor_update"
ON public.profile_views
FOR UPDATE
TO authenticated
USING (auth.uid() = viewer_id)
WITH CHECK (auth.uid() = viewer_id AND auth.uid() <> profile_id);

CREATE INDEX profile_views_profile_recent_idx ON public.profile_views(profile_id, viewed_at DESC);
CREATE INDEX profile_views_viewer_recent_idx ON public.profile_views(viewer_id, viewed_at DESC);