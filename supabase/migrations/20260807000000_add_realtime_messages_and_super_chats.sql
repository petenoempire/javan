-- Realtime incoming-message notifications are already emitted by notify_message().
-- This migration adds a server-authorized monetized chat path for live viewers.

ALTER TABLE public.live_chat_messages
  DROP CONSTRAINT IF EXISTS live_chat_messages_kind_check;

ALTER TABLE public.live_chat_messages
  ADD CONSTRAINT live_chat_messages_kind_check
  CHECK (kind IN ('chat', 'gift', 'join', 'heart', 'super_chat'));

CREATE OR REPLACE FUNCTION public.send_super_chat(
  _stream_id uuid,
  _body text,
  _coins integer
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sender uuid := auth.uid();
  host uuid;
  sender_balance integer;
  creator_share integer;
  chat_id uuid;
  clean_body text := left(trim(coalesce(_body, '')), 240);
BEGIN
  IF sender IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF _coins IS NULL OR _coins < 100 OR _coins > 1000000 THEN
    RAISE EXCEPTION 'Super Chat amount must be between 100 and 1,000,000 coins';
  END IF;
  IF clean_body = '' THEN
    RAISE EXCEPTION 'Super Chat message is required';
  END IF;

  SELECT host_id INTO host
  FROM public.live_streams
  WHERE id = _stream_id AND ended_at IS NULL
  FOR UPDATE;

  IF host IS NULL THEN
    RAISE EXCEPTION 'This live stream is no longer active';
  END IF;
  IF host = sender THEN
    RAISE EXCEPTION 'Stream hosts cannot send Super Chats to themselves';
  END IF;

  SELECT coins INTO sender_balance
  FROM public.profiles
  WHERE id = sender
  FOR UPDATE;

  IF sender_balance IS NULL OR sender_balance < _coins THEN
    RAISE EXCEPTION 'Not enough coins';
  END IF;

  creator_share := floor(_coins * 70 / 100.0);

  UPDATE public.profiles
  SET coins = coins - _coins, updated_at = now()
  WHERE id = sender;

  UPDATE public.profiles
  SET earned_coins = earned_coins + creator_share, updated_at = now()
  WHERE id = host;

  INSERT INTO public.live_chat_messages (stream_id, user_id, kind, body, gift_coins)
  VALUES (_stream_id, sender, 'super_chat', clean_body, _coins)
  RETURNING id INTO chat_id;

  INSERT INTO public.notifications (user_id, actor_id, kind, body)
  VALUES (host, sender, 'gift', 'Super Chat (+' || creator_share || ' coins)');

  RETURN chat_id;
END;
$$;

REVOKE ALL ON FUNCTION public.send_super_chat(uuid, text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.send_super_chat(uuid, text, integer) TO authenticated;
