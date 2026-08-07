import { supabase } from '@/integrations/supabase/client';

export async function fetchStream(streamId: string) {
  const { data } = await supabase
    .from('live_streams')
    .select('*')
    .eq('id', streamId)
    .single();
  return data;
}

export async function postChat(streamId: string, userId: string, content: string) {
  const { data } = await supabase
    .from('live_chat_messages')
    .insert({
      stream_id: streamId,
      user_id: userId,
      content,
      kind: 'message',
    })
    .select()
    .single();
  return data;
}

export async function sendSuperChat(streamId: string, body: string, coins: number) {
  const { data, error } = await supabase.rpc("send_super_chat", {
    _stream_id: streamId,
    _body: body,
    _coins: coins,
  });
  if (error) throw error;
  return data;
}

export async function postHeart(streamId: string, userId: string) {
  const { data } = await supabase
    .from('live_chat_messages')
    .insert({
      stream_id: streamId,
      user_id: userId,
      content: '❤️',
      kind: 'heart',
    })
    .select()
    .single();
  return data;
}

export async function postJoin(streamId: string, userId: string) {
  const { data } = await supabase
    .from('stream_viewers')
    .insert({
      stream_id: streamId,
      user_id: userId,
    })
    .select()
    .single();
  return data;
}

export async function endStream(streamId: string) {
  const { data } = await supabase
    .from('live_streams')
    .update({ ended_at: new Date().toISOString() })
    .eq('id', streamId)
    .select()
    .single();
  return data;
}

export async function fetchActiveLiveStreams() {
  const { data, error } = await supabase
    .from('live_streams')
    .select('*, host:profiles!host_id(handle, display_name, avatar_url)')
    .eq('status', 'live')
    .is('ended_at', null)
    .order('viewer_count', { ascending: false })
    .order('started_at', { ascending: false });

  if (error) {
    console.error("Error fetching active live streams:", error);
    return [];
  }
  return data ?? [];
}
