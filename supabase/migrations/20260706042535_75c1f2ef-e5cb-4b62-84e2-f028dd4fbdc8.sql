
-- 1) New zero-arg has_role
CREATE OR REPLACE FUNCTION public.has_role(_role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = _role);
$$;
REVOKE ALL ON FUNCTION public.has_role(public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(public.app_role) TO authenticated, service_role;

-- artist_profiles
DROP POLICY IF EXISTS artist_profiles_public_read_approved ON public.artist_profiles;
CREATE POLICY artist_profiles_public_read_approved ON public.artist_profiles FOR SELECT USING (status = 'approved' OR auth.uid() = user_id OR public.has_role('admin'));
DROP POLICY IF EXISTS artist_profiles_self_update_pending ON public.artist_profiles;
CREATE POLICY artist_profiles_self_update_pending ON public.artist_profiles FOR UPDATE USING (auth.uid() = user_id OR public.has_role('admin'));

-- artist_tracks
DROP POLICY IF EXISTS artist_tracks_owner_delete ON public.artist_tracks;
CREATE POLICY artist_tracks_owner_delete ON public.artist_tracks FOR DELETE USING (auth.uid() = artist_user_id OR public.has_role('admin'));
DROP POLICY IF EXISTS artist_tracks_owner_update ON public.artist_tracks;
CREATE POLICY artist_tracks_owner_update ON public.artist_tracks FOR UPDATE USING (auth.uid() = artist_user_id OR public.has_role('admin'));
DROP POLICY IF EXISTS artist_tracks_public_read ON public.artist_tracks;
CREATE POLICY artist_tracks_public_read ON public.artist_tracks FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.artist_profiles ap WHERE ap.user_id = artist_tracks.artist_user_id AND ap.status = 'approved')
  OR auth.uid() = artist_user_id OR public.has_role('admin')
);

-- coin_packages
DROP POLICY IF EXISTS "coin_packages admin write" ON public.coin_packages;
CREATE POLICY "coin_packages admin write" ON public.coin_packages FOR ALL USING (public.has_role('admin')) WITH CHECK (public.has_role('admin'));
DROP POLICY IF EXISTS "coin_packages readable" ON public.coin_packages;
CREATE POLICY "coin_packages readable" ON public.coin_packages FOR SELECT USING (active = true OR public.has_role('admin'));

-- coin_purchases
DROP POLICY IF EXISTS cp_self_read ON public.coin_purchases;
CREATE POLICY cp_self_read ON public.coin_purchases FOR SELECT USING (auth.uid() = user_id OR public.has_role('admin'));

-- comments
DROP POLICY IF EXISTS comments_self_delete ON public.comments;
CREATE POLICY comments_self_delete ON public.comments FOR DELETE USING (auth.uid() = user_id OR public.has_role('admin'));

-- fraud_flags
DROP POLICY IF EXISTS "fraud_flags admin" ON public.fraud_flags;
CREATE POLICY "fraud_flags admin" ON public.fraud_flags FOR ALL USING (public.has_role('admin')) WITH CHECK (public.has_role('admin'));

-- moderation_actions
DROP POLICY IF EXISTS mod_admin_insert ON public.moderation_actions;
CREATE POLICY mod_admin_insert ON public.moderation_actions FOR INSERT WITH CHECK (public.has_role('admin') AND auth.uid() = admin_id);
DROP POLICY IF EXISTS mod_admin_read ON public.moderation_actions;
CREATE POLICY mod_admin_read ON public.moderation_actions FOR SELECT USING (public.has_role('admin') OR auth.uid() = target_user_id);

-- payout_requests
DROP POLICY IF EXISTS pr_admin_update ON public.payout_requests;
CREATE POLICY pr_admin_update ON public.payout_requests FOR UPDATE USING (public.has_role('admin'));
DROP POLICY IF EXISTS pr_self_read ON public.payout_requests;
CREATE POLICY pr_self_read ON public.payout_requests FOR SELECT USING (auth.uid() = user_id OR public.has_role('admin'));

-- platform_config
DROP POLICY IF EXISTS "platform_config admin write" ON public.platform_config;
CREATE POLICY "platform_config admin write" ON public.platform_config FOR ALL USING (public.has_role('admin')) WITH CHECK (public.has_role('admin'));

-- profiles admin
DROP POLICY IF EXISTS profiles_admin_update ON public.profiles;
CREATE POLICY profiles_admin_update ON public.profiles FOR UPDATE USING (public.has_role('admin'));

-- reports
DROP POLICY IF EXISTS rep_admin_update ON public.reports;
CREATE POLICY rep_admin_update ON public.reports FOR UPDATE USING (public.has_role('admin'));
DROP POLICY IF EXISTS rep_self_read ON public.reports;
CREATE POLICY rep_self_read ON public.reports FOR SELECT USING (auth.uid() = reporter_id OR public.has_role('admin'));

-- support_messages
DROP POLICY IF EXISTS sm_owner_insert ON public.support_messages;
CREATE POLICY sm_owner_insert ON public.support_messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = support_messages.ticket_id AND (t.user_id = auth.uid() OR public.has_role('admin')))
);
DROP POLICY IF EXISTS sm_owner_read ON public.support_messages;
CREATE POLICY sm_owner_read ON public.support_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = support_messages.ticket_id AND (t.user_id = auth.uid() OR public.has_role('admin')))
);

-- support_tickets
DROP POLICY IF EXISTS st_admin_update ON public.support_tickets;
CREATE POLICY st_admin_update ON public.support_tickets FOR UPDATE USING (public.has_role('admin'));
DROP POLICY IF EXISTS st_self_read ON public.support_tickets;
CREATE POLICY st_self_read ON public.support_tickets FOR SELECT USING (auth.uid() = user_id OR public.has_role('admin'));
DROP POLICY IF EXISTS st_self_update ON public.support_tickets;
CREATE POLICY st_self_update ON public.support_tickets FOR UPDATE USING (auth.uid() = user_id OR public.has_role('admin')) WITH CHECK (auth.uid() = user_id OR public.has_role('admin'));

-- transactions
DROP POLICY IF EXISTS "tx self read" ON public.transactions;
CREATE POLICY "tx self read" ON public.transactions FOR SELECT USING (user_id = auth.uid() OR public.has_role('admin'));

-- user_roles
DROP POLICY IF EXISTS admins_manage_roles ON public.user_roles;
CREATE POLICY admins_manage_roles ON public.user_roles FOR ALL USING (public.has_role('admin')) WITH CHECK (public.has_role('admin'));
DROP POLICY IF EXISTS admins_view_all_roles ON public.user_roles;
CREATE POLICY admins_view_all_roles ON public.user_roles FOR SELECT USING (public.has_role('admin'));

-- verifications
DROP POLICY IF EXISTS ver_admin_update ON public.verifications;
CREATE POLICY ver_admin_update ON public.verifications FOR UPDATE USING (public.has_role('admin'));
DROP POLICY IF EXISTS ver_self_read ON public.verifications;
CREATE POLICY ver_self_read ON public.verifications FOR SELECT USING (auth.uid() = user_id OR public.has_role('admin'));

-- videos
DROP POLICY IF EXISTS videos_owner_delete ON public.videos;
CREATE POLICY videos_owner_delete ON public.videos FOR DELETE USING (auth.uid() = user_id OR public.has_role('admin'));
DROP POLICY IF EXISTS videos_owner_update ON public.videos;
CREATE POLICY videos_owner_update ON public.videos FOR UPDATE USING (auth.uid() = user_id OR public.has_role('admin'));
DROP POLICY IF EXISTS videos_public_read ON public.videos;
CREATE POLICY videos_public_read ON public.videos FOR SELECT USING (status = 'active' OR auth.uid() = user_id OR public.has_role('admin'));

-- storage.objects: verification-docs owner read
DROP POLICY IF EXISTS "verif owner read" ON storage.objects;
CREATE POLICY "verif owner read" ON storage.objects FOR SELECT USING (
  bucket_id = 'verification-docs' AND ((auth.uid())::text = (storage.foldername(name))[1] OR public.has_role('admin'))
);

-- Drop old 2-arg function
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);


-- 2) Hide sensitive profile columns from anon/authenticated; owner uses my_profile()
DROP POLICY IF EXISTS profiles_public_read ON public.profiles;
CREATE POLICY profiles_public_read ON public.profiles FOR SELECT USING (true);

REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (id, handle, display_name, bio, avatar_url, cover_url, location, website, is_verified, created_at, updated_at) ON public.profiles TO anon, authenticated;
GRANT SELECT ON public.profiles TO service_role;

CREATE OR REPLACE FUNCTION public.my_profile()
RETURNS public.profiles
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT * FROM public.profiles WHERE id = auth.uid(); $$;
REVOKE ALL ON FUNCTION public.my_profile() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.my_profile() TO authenticated, service_role;
