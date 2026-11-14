"use client";
import { useState } from "react";
import { useReady } from "@/lib/store";
import { pill } from "@/lib/ui";
import { roundBtn } from "../Header";
import Icon from "../Icon";
import PostCard, { usePostBundle } from "../PostCard";
import PostSheet from "../PostSheet";
import TabScaffold, { Skeleton } from "../TabScaffold";

// Fil de posts façon Threads ; on écrit via la feuille « Nouveau post » (bouton + flottant).
export default function PostsTab() {
  const b = usePostBundle();
  const ready = useReady("posts", "profiles");
  const [tag, setTag] = useState<string | null>(null);
  const [quote, setQuote] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const roots = b.posts.filter((p) => !p.parent_id).reverse();
  const list = tag ? roots.filter((p) => p.body.toLowerCase().includes(`#${tag.toLowerCase()}`)) : roots;
  const tags = Object.entries(roots.flatMap((p) => p.body.match(/(?<=(^|\s)#)[\p{L}\d_-]+/gu) ?? []).reduce<Record<string, number>>((a, t) => ({ ...a, [t.toLowerCase()]: (a[t.toLowerCase()] ?? 0) + 1 }), {})).sort((a, c) => c[1] - a[1]).slice(0, 8);
  const write = (q: string | null) => { setQuote(q); setOpen(true); };

  return (
    <TabScaffold title={tag ? `#${tag}` : "Posts"}
      actions={tag && <button className={roundBtn} aria-label="Retirer le filtre" onClick={() => setTag(null)}><Icon name="x" size={18} /></button>}
      sub={tags.length > 0 && !tag && (
        <div className="scroll-x flex gap-1.5 overflow-x-auto px-4 pb-2.5">
          {tags.map(([t, n]) => <button key={t} onClick={() => setTag(t)} className={pill(false)}><span className="text-muted">#</span>{t}<span className="ml-1.5 text-muted">{n}</span></button>)}
        </div>
      )}
      footer={
        <>
          <button aria-label="Nouveau post" onClick={() => write(null)}
            className="tap fixed z-30 inline-flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-[0_8px_24px_rgba(0,0,0,.2)]"
            style={{ bottom: "calc(var(--tabbar) + 6px)", right: "max(1rem, calc((100vw - 640px) / 2 + 1rem))" }}>
            <Icon name="plus" size={24} stroke={2.2} />
          </button>
          <PostSheet open={open} onClose={() => { setOpen(false); setQuote(null); }} quote={quote} b={b} />
        </>
      }>
      <button onClick={() => write(null)} className="tap flex w-full items-center gap-3 border-y border-line bg-surface px-4 py-3 text-left">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-subtle text-muted"><Icon name="plus" size={18} /></span>
        <span className="text-[15px] text-muted">Quoi de neuf ?</span>
      </button>
      {!ready ? <Skeleton /> : (
        <div className="divide-y divide-line border-b border-line">
          {list.map((p) => <PostCard key={p.id} p={p} b={b} onTag={setTag} onQuote={write} />)}
        </div>
      )}
      {ready && !list.length && <p className="py-20 text-center text-[13px] text-muted">Aucun post pour l&apos;instant.</p>}
    </TabScaffold>
  );
}
