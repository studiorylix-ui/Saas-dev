import { createBrowserClient } from "@supabase/ssr";

// Appelé seulement dans des effets/handlers (jamais au rendu serveur).
export const sb = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
