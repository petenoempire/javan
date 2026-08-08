import { supabase } from "@/integrations/supabase/client";

export const LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL as string;

export async function getLiveKitToken(
  room: string,
  identity: string,
  canPublish: boolean,
  name?: string,
) {
  const { data, error } = await supabase.functions.invoke("livekit-token", {
    body: { room, identity, canPublish, name },
  });
  if (error) throw error;
  if (!data?.token) throw new Error("No token returned from LiveKit token service");
  return data.token as string;
}
