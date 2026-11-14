import * as webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

// Appelée par les triggers Supabase (supabase/push.sql) à chaque création de message, tâche, affaire ou projet.
export async function POST(req: Request) {
  if (req.headers.get("x-secret") !== process.env.PUSH_WEBHOOK_SECRET) return new Response("no", { status: 401 });
  const { table, record: r } = await req.json();

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: me } = await db.from("profiles").select("name").eq("id", r.author).single();
  const who = me?.name ?? "Quelqu'un";
  const msg =
    table === "messages" ? { title: `${who} · ${r.parent_id ? "réponse" : r.kind === "post" ? "post" : "discussion"}`, body: r.body, url: r.kind === "post" ? "/posts" : "/chat" }
    : table === "tasks" ? { title: `${who} · nouvelle tâche`, body: r.title, url: "/tasks" }
    : table === "deals" ? { title: `${who} · nouvelle affaire`, body: r.name, url: "/tasks" }
    : table === "projects" ? { title: `${who} · nouveau projet`, body: r.name, url: "/projects" }
    : null;
  if (!msg) return new Response("ignored");
  msg.body = String(msg.body).slice(0, 140);

  webpush.setVapidDetails("mailto:noreply@example.com", process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!, process.env.VAPID_PRIVATE_KEY!);
  const { data: subs } = await db.from("push_subscriptions").select("*").neq("user_id", r.author);
  await Promise.all((subs ?? []).map(async (s) => {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(msg));
    } catch (e) {
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) await db.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
    }
  }));
  return new Response("ok");
}
