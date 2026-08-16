import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://yrcitnuuskcbiuryyytu.supabase.co";
const SUPABASE_KEY = "sb_publishable_REmdL8nVsuxhOsRMTZlGFg_YILsQIVK";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
