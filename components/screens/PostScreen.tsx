"use client";
import { db } from "@/lib/store";
import Composer from "../Composer";
import Header from "../Header";
import PostCard, { usePostBundle } from "../PostCard";

export default function PostScreen({ id }: { id: string }) {
  const b = usePostBundle();
  const p = b.posts.find((x) => x.id === id);
  const replies = b.posts.filter((x) => x.parent_id === id);
  return (
    <div className="flex h-full flex-col">
      <Header title="Fil" />
      <div className="min-h-0 flex-1 overflow-y-auto">
        {p ? <div className="group-card mx-3 mt-2"><PostCard p={p} b={b} /></div> : <p className="p-4 text-[13px] text-muted">Chargement…</p>}
        {replies.length > 0 && <div className="px-6 pb-1.5 pt-4 text-[12px] font-medium uppercase tracking-[.06em] text-muted">{replies.length} réponse{replies.length > 1 ? "s" : ""}</div>}
        <div className="group-card mx-3 divide-y divide-line">{replies.map((r) => <PostCard key={r.id} p={r} b={b} />)}</div>
      </div>
      <Composer images placeholder="Répondre…" onSend={(body, images, mentions) => { db.insert("posts", { body, images, mentions, parent_id: id, quote_id: null, link_type: null, link_id: null }); }} />
    </div>
  );
}
