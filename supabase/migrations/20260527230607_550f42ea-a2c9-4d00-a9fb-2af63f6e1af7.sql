
-- Fix mutable search path on set_updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- Lock down SECURITY DEFINER trigger functions — only triggers should call them
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_follow() FROM PUBLIC, anon, authenticated;

-- Tighten storage listing: replace broad public read with per-folder access
DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
DROP POLICY IF EXISTS "covers_public_read" ON storage.objects;

-- Public files are still served via getPublicUrl (CDN); only owner can LIST/inspect via API
CREATE POLICY "avatars_owner_list" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "covers_owner_list" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'covers' AND auth.uid()::text = (storage.foldername(name))[1]);
