import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env['VITE_SUPABASE_URL'] as string | undefined;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'] as string | undefined;

// Keep SSR module evaluation safe when a preview/publish environment has not
// injected public Vite variables yet. Route loaders still catch request errors
// and render their not-found/empty states instead of crashing the whole worker.
const runtimeUrl = SUPABASE_URL || 'https://supabase-config-missing.invalid';
const runtimeKey = SUPABASE_PUBLISHABLE_KEY || 'public-config-missing';

export const supabase = createClient(runtimeUrl, runtimeKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
