import { createClient } from "@supabase/supabase-js";

const configuredUrl = (import.meta.env['VITE_SUPABASE_URL'] as string | undefined)?.replace(/\/+$/, '');
const configuredKey = import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'] as string | undefined;

// This is the public browser configuration for the active Javan project. The
// fallback prevents a stale publish-time .env from sending mobile requests to
// the retired Supabase project. The publishable key is intentionally client
// visible; it is not a service-role credential.
const LIVE_SUPABASE_URL = 'https://hwvgcysmcexffuoywnol.supabase.co';
const LIVE_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_bP5LEGE9oUdP7mLeTRIMUg_mPzsJE_O';
const isLiveProject = configuredUrl === LIVE_SUPABASE_URL;

// Keep SSR module evaluation safe when a preview/publish environment has not
// injected public Vite variables yet. Route loaders still catch request errors
// and render their not-found/empty states instead of crashing the whole worker.
const runtimeUrl = isLiveProject ? configuredUrl : LIVE_SUPABASE_URL;
const runtimeKey = isLiveProject && configuredKey ? configuredKey : LIVE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(runtimeUrl, runtimeKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
