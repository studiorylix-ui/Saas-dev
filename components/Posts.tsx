"use client";
import { useState } from "react";
import { sb } from "@/lib/supabase/client";
import { iconBtn, pill, sel } from "@/lib/ui";
import Composer from "./Composer";
import Header from "./Header";
import Icon from "./Icon";
import PostCard, { usePostBundle } from "./PostCard";
import { useRefs } from "./Refs";

// Fil de posts façon Threads : photos, @mentions, #hashtags, Markdown/code, citation, lien vers tâche/projet/affaire.
export default function Posts() {
  const { name } = useRefs();
  const b = usePostBundle();
  const [tag, setTag] = useState<string | null>(null);
  const [quote, setQuote] = useState<string | null>(null);
  const [lt, setLt] = useState<"" | "task" | "project" | "deal">("");
  const [lid, setLid] = useState("");
  const [linkOpen, setLinkOpen] = useState(false);

  const roots = b.posts.filter((p) => !p.parent_id).reverse();
  const list = tag ? roots.filter((p) => p.body.toLowerCase().includes(`#${tag.toLowerCase()}`)) : roots;
  const tags = Object.entries(roots.flatMap((p) => p.body.match(/(?<=(^|\s)#)[\p{L}\d_-]+/gu) ?? []).reduce<Record<string, number>>((a, t) => ({ ...a, [t.toLowerCase()]: (a[t.toLowerCase()] ?? 0) + 1 }), {})).sort((a, c) => c[1] - a[1]).slice(0, 8);
  const quoted = quote ? b.posts.find((p) => p.id === quote) : null;
  const items = lt === "task" ? b.tasks.map((t) => [t.id, `RYL-${t.num} ${t.title}`]) : lt === "project" ? b.projects.map((p) => [p.id, p.name]) : lt === "deal" ? b.deals.map((d) => [d.id, d.name]) : [];

  async function send(body: string, images: string[], mentions: string[]) {
    await sb().from("posts").insert({ body, images, mentions, quote_id: quote, link_type: lt || null, link_id: lt && lid ? lid : null });
    setQuote(null); setLt(""); setLid(""); setLinkOpen(false);
  }

  const extra = (
    <div className="mb-2 space-y-2 empty:hidden">
      {quoted && (
        <div className="flex items-center gap-2 rounded-[10px] border border-line px-3 py-2 text-[13px]">
          <Icon name="repeat" size={15} className="text-muted" />
          <span className="min-w-0 flex-1 truncate"><b className="font-medium">{name(quoted.author)}</b> <span className="text-muted">{quoted.body}</span></span>
          <button aria-label="Retirer la citation" className="text-muted" onClick={() => setQuote(null)}><Icon name="x" size={15} /></button>
        </div>
      )}
      {linkOpen && (
        <div className="flex gap-2">
          <select className={sel} value={lt} onChange={(e) => { setLt(e.target.value as typeof lt); setLid(""); }}>
            <option value="">Lier à…</option><option value="task">Tâche</option><option value="project">Projet</option><option value="deal">Affaire</option>
          </select>
          {lt && <select className={`${sel} min-w-0 flex-1`} value={lid} onChange={(e) => setLid(e.target.value)}><option value="">Choisir…</option>{items.map(([id, l]) => <option key={id} value={id}>{l}</option>)}</select>}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-full flex-col">
      <Header title={tag ? `#${tag}` : "Posts"}>
        {tag
          ? <button className={iconBtn} aria-label="Retirer le filtre" onClick={() => setTag(null)}><Icon name="x" size={20} /></button>
          : <button className={`${iconBtn} ${linkOpen || lt ? "bg-black/[.05]" : ""}`} aria-label="Lier à un élément" onClick={() => setLinkOpen(!linkOpen)}><Icon name="link" size={19} /></button>}
      </Header>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="border-b border-line bg-surface">
          <Composer flat images placeholder="Quoi de neuf ?" onSend={send} extra={extra} />
        </div>
        {tags.length > 0 && !tag && (
          <div className="scroll-x flex gap-1.5 overflow-x-auto border-b border-line px-4 py-2.5">
            {tags.map(([t, n]) => <button key={t} onClick={() => setTag(t)} className={pill(false)}><span className="text-muted">#</span>{t}<span className="ml-1.5 text-muted">{n}</span></button>)}
          </div>
        )}
        <div className="divide-y divide-line">
          {list.map((p) => <PostCard key={p.id} p={p} b={b} onTag={setTag} onQuote={setQuote} />)}
        </div>
        {!list.length && <p className="py-20 text-center text-[13px] text-muted">Aucun post pour l&apos;instant.</p>}
      </div>
    </div>
  );
}
