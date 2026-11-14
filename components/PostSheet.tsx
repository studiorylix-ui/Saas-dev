"use client";
import { useEffect, useState } from "react";
import { db } from "@/lib/store";
import { sel } from "@/lib/ui";
import Avatar from "./Avatar";
import { Suggestions, Thumbs } from "./Composer";
import Icon from "./Icon";
import type { Bundle } from "./PostCard";
import { useRefs } from "./Refs";
import { useComposer } from "./useComposer";

// Feuille « Nouveau post » façon Threads : plein écran, Annuler / Publier, photos, lien vers un élément, citation.
export default function PostSheet({ open, onClose, quote, b }: { open: boolean; onClose: () => void; quote: string | null; b: Bundle }) {
  const { me, name } = useRefs();
  const [lt, setLt] = useState<"" | "task" | "project" | "deal">("");
  const [lid, setLid] = useState("");
  const [linking, setLinking] = useState(false);
  const { ta, ...c } = useComposer(async (body, images, mentions) => {
    db.insert("posts", { body, images, mentions, quote_id: quote, parent_id: null, link_type: lt || null, link_id: lt && lid ? lid : null });
  });
  const quoted = quote ? b.posts.find((p) => p.id === quote) : null;
  const items = lt === "task" ? b.tasks.map((t) => [t.id, `RYL-${t.num} ${t.title}`]) : lt === "project" ? b.projects.map((p) => [p.id, p.name]) : lt === "deal" ? b.deals.map((d) => [d.id, d.name]) : [];

  useEffect(() => { if (open) setTimeout(() => ta.current?.focus(), 220); }, [open, ta]);
  async function publish() {
    if (await c.send()) { setLt(""); setLid(""); setLinking(false); onClose(); }
  }

  return (
    <div className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      <div className={`absolute inset-0 bg-black/30 transition-opacity duration-200 ease-out ${open ? "opacity-100" : "opacity-0"}`} />
      <div className={`absolute inset-x-0 bottom-0 top-[calc(env(safe-area-inset-top)+10px)] mx-auto flex max-w-[640px] flex-col rounded-t-[22px] bg-surface transition-transform duration-200 ease-out ${open ? "translate-y-0" : "translate-y-full"}`}>
        <div className="grid h-14 shrink-0 grid-cols-[1fr_auto_1fr] items-center border-b border-line px-2">
          <button className="h-10 justify-self-start rounded-lg px-2.5 text-[15px] active:bg-fill" onClick={onClose}>Annuler</button>
          <span className="text-[16px] font-semibold">Nouveau post</span>
          <span />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-4">
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <Avatar name={name(me)} size={36} />
              <span className="mt-2 w-[2px] flex-1 rounded-full bg-line" />
            </div>
            <div className="min-w-0 flex-1 pb-4">
              <div className="text-[15px] font-semibold">{name(me)}</div>
              <textarea ref={ta} rows={2} value={c.text} onChange={c.change} placeholder="Quoi de neuf ?"
                className="mt-0.5 w-full resize-none bg-transparent text-[16px] leading-snug outline-none placeholder:text-muted/60" />
              <Suggestions list={c.sugg} pick={c.pick} />
              <Thumbs imgs={c.imgs} remove={(u) => c.setImgs(c.imgs.filter((x) => x !== u))} />
              {quoted && (
                <div className="mb-2 rounded-[14px] bg-fill px-3 py-2.5">
                  <div className="flex items-center gap-2 text-[13px]"><Avatar name={name(quoted.author)} size={18} /><span className="font-medium">{name(quoted.author)}</span></div>
                  <p className="mt-1 line-clamp-3 text-[14px] text-ink/80">{quoted.body}</p>
                </div>
              )}
              {linking && (
                <div className="mb-2 flex gap-2">
                  <select className={sel} value={lt} onChange={(e) => { setLt(e.target.value as typeof lt); setLid(""); }}>
                    <option value="">Lier à…</option><option value="task">Tâche</option><option value="project">Projet</option><option value="deal">Affaire</option>
                  </select>
                  {lt && <select className={`${sel} min-w-0 flex-1`} value={lid} onChange={(e) => setLid(e.target.value)}><option value="">Choisir…</option>{items.map(([id, l]) => <option key={id} value={id}>{l}</option>)}</select>}
                </div>
              )}
              <div className="-ml-2 flex items-center text-muted">
                <label aria-label="Photos" className={`inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg active:bg-fill ${c.imgs.length >= 4 ? "pointer-events-none opacity-30" : ""}`}>
                  <Icon name="image" size={20} />
                  <input type="file" accept="image/*" multiple hidden onChange={(e) => { c.addFiles(e.target.files); e.target.value = ""; }} />
                </label>
                <button aria-label="Lier à un élément" onClick={() => setLinking(!linking)} className={`inline-flex h-10 w-10 items-center justify-center rounded-lg active:bg-fill ${linking || lt ? "text-ink" : ""}`}><Icon name="link" size={19} /></button>
                <button aria-label="Mentionner" onClick={() => c.insert("@")} className="inline-flex h-10 w-10 items-center justify-center rounded-lg active:bg-fill"><Icon name="at" size={19} /></button>
                <button aria-label="Hashtag" onClick={() => c.insert("#")} className="inline-flex h-10 w-10 items-center justify-center rounded-lg active:bg-fill"><Icon name="hash" size={19} /></button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-line px-4 py-2.5 pb-[max(env(safe-area-inset-bottom),10px)]">
          <span className="text-[13px] text-muted">Visible par toute l&apos;équipe</span>
          <button onClick={publish} disabled={!c.can} className="h-9 rounded-full btn-light px-5 text-[15px] font-semibold text-on-accent transition-opacity duration-150 ease-out active:opacity-80 disabled:opacity-25">
            {c.busy ? "…" : "Publier"}
          </button>
        </div>
      </div>
    </div>
  );
}
