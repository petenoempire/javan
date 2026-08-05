DROP POLICY IF EXISTS "st_self_update" ON public.support_tickets;
CREATE POLICY "st_self_update" ON public.support_tickets
FOR UPDATE TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));