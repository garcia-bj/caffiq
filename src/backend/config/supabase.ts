import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

// Cliente con SERVICE ROLE — permisos totales, solo usar en el backend
export const supabaseAdmin = createClient(
  env.supabase.url,
  env.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
