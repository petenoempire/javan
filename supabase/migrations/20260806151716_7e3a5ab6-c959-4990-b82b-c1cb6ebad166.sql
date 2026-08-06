DROP POLICY IF EXISTS "artist_profiles_self_update_pending" ON public.artist_profiles;

CREATE POLICY "artist_profiles_self_update_pending"
ON public.artist_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "artist_profiles_admin_update"
ON public.artist_profiles
FOR UPDATE
TO authenticated
USING (public.has_role('admin'))
WITH CHECK (public.has_role('admin'));