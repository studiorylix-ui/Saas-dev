import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;
let ready: Promise<void> | null = null;

// Client unique, créé au premier appel (jamais au rendu serveur).
export const sb = () => {
  if (client) return client;
  const c = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  c.auth.onAuthStateChange((_e, s) => { if (s) c.realtime.setAuth(s.access_token); });
  client = c;
  return c;
};

// À attendre avant tout abonnement temps réel : un canal rejoint sans jeton reste anonyme
// côté serveur, et les règles d'accès (RLS) lui bloquent alors tous les événements.
export const realtimeReady = () =>
  (ready ??= sb().auth.getSession().then(({ data }) => { if (data.session) sb().realtime.setAuth(data.session.access_token); }));
