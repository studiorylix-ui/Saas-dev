import * as webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

type Msg = { title: string; body: string; url: string };

// Appelée par les triggers Supabase (migration SQL) à chaque création/assignation.
export async function POST(req: Request) {
  if (req.headers.get("x-secret") !== process.env.PUSH_WEBHOOK_SECRET) return new Response("no", { status: 401 });
  const { table, op, actor, record: r } = await req.json();

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const one = async (t: string, id: string | null, col = "name") => (id ? (await db.from(t).select(col).eq("id", id).single()).data?.[col as never] as string | undefined : undefined);
  const who = (await one("profiles", actor)) ?? "Quelqu'un";
  const cut = (s: string) => String(s ?? "").slice(0, 140);

  let msg: Msg | null = null;
  let only: string[] | null = null; // destinataires restreints (sinon tout le monde sauf l'auteur)
  let mention: Msg | null = null; // variante pour les personnes mentionnées

  if (table === "messages") msg = { title: `#${(await one("channels", r.channel_id)) ?? "chat"} · ${who}`, body: cut(r.body), url: `/chat?c=${r.channel_id}` };
  else if (table === "posts") {
    msg = { title: r.parent_id ? `${who} a répondu` : `${who} · nouveau post`, body: cut(r.body || "📷 photo"), url: `/posts/${r.parent_id ?? r.id}` };
    mention = { ...msg, title: `${who} vous a mentionné` };
  } else if (table === "tasks" && op === "UPDATE") {
    if (!r.assignee) return new Response("ignored");
    msg = { title: `${who} vous a assigné une tâche`, body: cut(`RYL-${r.num} ${r.title}`), url: `/tasks/${r.id}` };
    only = [r.assignee];
  } else if (table === "tasks") msg = { title: `${who} · nouvelle tâche`, body: cut(`RYL-${r.num} ${r.title}`), url: `/tasks/${r.id}` };
  else if (table === "task_comments") msg = { title: `${who} · commentaire`, body: cut(r.body), url: `/tasks/${r.task_id}` };
  else if (table === "deals") msg = { title: `${who} · nouvelle affaire`, body: cut(r.name), url: `/deals/${r.id}` };
  else if (table === "projects") msg = { title: `${who} · nouveau projet`, body: cut(r.name), url: `/projects/${r.id}` };
  if (!msg) return new Response("ignored");

  webpush.setVapidDetails("mailto:noreply@example.com", process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!, process.env.VAPID_PRIVATE_KEY!);
  const { data: subs } = await db.from("push_subscriptions").select("*");
  const mentioned: string[] = r.mentions ?? [];
  await Promise.all((subs ?? []).filter((s) => s.user_id !== actor && (!only || only.includes(s.user_id))).map(async (s) => {
    const m = mention && mentioned.includes(s.user_id) ? mention : msg!;
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(m));
    } catch (e) {
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) await db.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
    }
  }));
  return new Response("ok");
}
