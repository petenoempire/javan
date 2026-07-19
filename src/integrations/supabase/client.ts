import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ??
  "https://blvdvmsysxinwxhtmbta.supabase.co";

const SUPABASE_ANON_KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ??
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsdmR2bXN5c3hpbnd4aHRtYnRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0NzkwNzksImV4cCI6MjA5NjA1NTA3OX0.4Dwniaqn3KFQlVFF1YJ7-LX_sfWCKmNyXorPET3wsKw";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
