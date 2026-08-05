
-- Artist profile (one per user once verified as artist)
CREATE TABLE public.artist_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  stage_name TEXT NOT NULL,
  genre TEXT,
  bio TEXT,
  spotify_url TEXT,
  apple_music_url TEXT,
  soundcloud_url TEXT,
  youtube_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  review_reason TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  proof_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.artist_profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON public.artist_profiles TO authenticated;
GRANT ALL ON public.artist_profiles TO service_role;

ALTER TABLE public.artist_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "artist_profiles_public_read_approved" ON public.artist_profiles
  FOR SELECT USING (status = 'approved' OR auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "artist_profiles_self_insert" ON public.artist_profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "artist_profiles_self_update_pending" ON public.artist_profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER artist_profiles_updated_at
  BEFORE UPDATE ON public.artist_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Lock privileged columns on self-update
CREATE OR REPLACE FUNCTION public.artist_profiles_guard()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN RETURN NEW; END IF;
  IF auth.uid() = OLD.user_id THEN
    NEW.status := OLD.status;
    NEW.review_reason := OLD.review_reason;
    NEW.reviewed_by := OLD.reviewed_by;
    NEW.reviewed_at := OLD.reviewed_at;
    NEW.user_id := OLD.user_id;
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'Not allowed';
END $$;

CREATE TRIGGER artist_profiles_guard_self
  BEFORE UPDATE ON public.artist_profiles
  FOR EACH ROW EXECUTE FUNCTION public.artist_profiles_guard();

-- Tracks belonging to an artist
CREATE TABLE public.artist_tracks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_user_id UUID NOT NULL,
  title TEXT NOT NULL,
  album TEXT,
  artwork_url TEXT,
  audio_url TEXT,
  duration_seconds INTEGER,
  spotify_url TEXT,
  apple_music_url TEXT,
  soundcloud_url TEXT,
  youtube_url TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_artist_tracks_user ON public.artist_tracks(artist_user_id, position);

GRANT SELECT ON public.artist_tracks TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.artist_tracks TO authenticated;
GRANT ALL ON public.artist_tracks TO service_role;

ALTER TABLE public.artist_tracks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "artist_tracks_public_read" ON public.artist_tracks
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.artist_profiles ap WHERE ap.user_id = artist_tracks.artist_user_id AND ap.status = 'approved')
    OR auth.uid() = artist_user_id
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "artist_tracks_owner_insert" ON public.artist_tracks
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = artist_user_id
    AND EXISTS (SELECT 1 FROM public.artist_profiles ap WHERE ap.user_id = auth.uid() AND ap.status = 'approved')
  );
CREATE POLICY "artist_tracks_owner_update" ON public.artist_tracks
  FOR UPDATE TO authenticated USING (auth.uid() = artist_user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "artist_tracks_owner_delete" ON public.artist_tracks
  FOR DELETE TO authenticated USING (auth.uid() = artist_user_id OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER artist_tracks_updated_at
  BEFORE UPDATE ON public.artist_tracks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Storage bucket for artist audio + artwork
INSERT INTO storage.buckets (id, name, public) VALUES ('artist-media', 'artist-media', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "artist_media_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'artist-media');
CREATE POLICY "artist_media_owner_write" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'artist-media' AND auth.uid()::text = (storage.foldername(name))[1]
  );
CREATE POLICY "artist_media_owner_update" ON storage.objects
  FOR UPDATE TO authenticated USING (
    bucket_id = 'artist-media' AND auth.uid()::text = (storage.foldername(name))[1]
  );
CREATE POLICY "artist_media_owner_delete" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'artist-media' AND auth.uid()::text = (storage.foldername(name))[1]
  );
