import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://hwvgcysmcexffuoywnol.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_bP5LEGE9oUdP7mLeTRIMUg_mPzsJE_O";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
