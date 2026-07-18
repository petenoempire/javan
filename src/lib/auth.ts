import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AuthProfile {
  id: string;
  handle: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  coins: number;
  earned_coins: number;
  is_verified: boolean;
}

export interface AuthSession {
  user: any;
  session: any;
}

export function useAuth() {
  const { data: session } = useQuery({
    queryKey: ['auth-session'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    },
  });

  const user = session?.user;

  const { data: profile } = useQuery({
    queryKey: ['auth-profile', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single();
      return data as AuthProfile;
    },
  });

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return {
    user,
    profile,
    session,
    signOut,
  };
}
