
DROP POLICY IF EXISTS sm_owner_insert ON public.support_messages;
CREATE POLICY sm_owner_insert ON public.support_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND (is_agent = false OR has_role('admin'::app_role))
    AND EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = ticket_id
        AND (t.user_id = auth.uid() OR has_role('admin'::app_role))
    )
  );
