import { createClient } from "@supabase/supabase-js";

// Almacenamiento en memoria para el code_verifier de PKCE
const mem: Record<string, string> = {};

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      flowType: "pkce",
      storage: {
        getItem:    (key) => mem[key] ?? null,
        setItem:    (key, value) => { mem[key] = value; },
        removeItem: (key) => { delete mem[key]; },
      },
      autoRefreshToken:  false,
      persistSession:    false,
      detectSessionInUrl: false,
    },
  }
);
