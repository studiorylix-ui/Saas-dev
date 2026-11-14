"use client";
import { useState } from "react";
import { sb } from "@/lib/supabase/client";
import { sel } from "@/lib/ui";
import Composer from "./Composer";
import Header from "./Header";
import PostCard, { usePostBundle } from "./PostCard";
import { useRefs } from "./Refs";

// Fil de posts façon X/Threads : photos, @mentions, #hashtags, Markdown/code, citation, lien vers tâche/projet/affaire.
export default function Posts() {
  const { name } = useRefs();
  const b = usePostBundle();
  const [tag, setTag] = useState<string | null>(null);
  const [quote, setQuote] = useState<string | null>(null);
  const [lt, setLt] = useState<"" | "task" | "project" | "deal">("");
  const [lid, setLid] = useState("");

  const roots = b.posts.filter((p) => !p.parent_id).reverse();
  const list = tag ? roots.filter((p) => p.body.toLowerCase().includes(`#${tag.toLowerCase()}`)) : roots;
  const tags = Object.entries(roots.flatMap((p) => p.body.match(/(?<=(^|\s)#)[\p{L}\d_-]+/gu) ?? []).reduce<Record<string, number>>((a, t) => ({ ...a, [t.toLowerCase()]: (a[t.toLowerCase()] ?? 0) + 1 }), {})).sort((a, c) => c[1] - a[1]).slice(0, 8);
  const quoted = quote ? b.posts.find((p) => p.id === quote) : null;
  const items = lt === "task" ? b.tasks.map((t) => [t.id, `RYL-${t.num} ${t.title}`]) : lt === "project" ? b.projects.map((p) => [p.id, p.name]) : lt === "deal" ? b.deals.map((d) => [d.id, d.name]) : [];

  async function send(body: string, images: string[], mentions: string[]) {
    await sb().from("posts").insert({ body, images, mentions, quote_id: quote, link_type: lt || null, link_id: lt && lid ? lid : null });
    setQuote(null); setLt(""); setLid("");
  }

  const extra = (
    <div className="space-y-2 text-sm">
      {quoted && <div className="flex items-center justify-between rounded-lg bg-neutral-100 px-2 py-1 dark:bg-neutral-800"><span className="truncate">🔁 {name(quoted.author)} : {quoted.body}</span><button onClick={() => setQuote(null)}>✕</button></div>}
      <div className="flex gap-2">
        <select className={sel} value={lt} onChange={(e) => { setLt(e.target.value as typeof lt); setLid(""); }}>
          <option value="">🔗 Lier…</option><option value="task">Une tâche</option><option value="project">Un projet</option><option value="deal">Une affaire</option>
        </select>
        {lt && <select className={`${sel} min-w-0 flex-1`} value={lid} onChange={(e) => setLid(e.target.value)}><option value="">Choisir…</option>{items.map(([id, l]) => <option key={id} value={id}>{l}</option>)}</select>}
      </div>
    </div>
  );

  return (
    <div className="flex h-full flex-col">
      <Header title="Posts">{tag && <button className="text-sm text-indigo-600" onClick={() => setTag(null)}>#{tag} ✕</button>}</Header>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto">
        <div className="border-b border-neutral-200 dark:border-neutral-800"><Composer images placeholder="Quoi de neuf ? (@mention, #tag, Markdown)" onSend={send} extra={extra} /></div>
        {tags.length > 0 && !tag && <div className="flex gap-2 overflow-x-auto px-3">{tags.map(([t, n]) => <button key={t} onClick={() => setTag(t)} className="shrink-0 rounded-full bg-neutral-100 px-3 py-1 text-sm dark:bg-neutral-800">#{t} <span className="text-neutral-400">{n}</span></button>)}</div>}
        <div className="space-y-3 px-3 pb-4">
          {list.map((p) => <PostCard key={p.id} p={p} b={b} onTag={setTag} onQuote={setQuote} />)}
          {!list.length && <p className="pt-10 text-center text-neutral-500">Aucun post.</p>}
        </div>
      </div>
    </div>
  );
}
