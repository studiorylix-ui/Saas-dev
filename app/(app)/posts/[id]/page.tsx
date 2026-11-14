"use client";
import { useParams } from "next/navigation";
import { sb } from "@/lib/supabase/client";
import Composer from "@/components/Composer";
import Header from "@/components/Header";
import PostCard, { usePostBundle } from "@/components/PostCard";

export default function Thread() {
  const { id } = useParams<{ id: string }>();
  const b = usePostBundle();
  const p = b.posts.find((x) => x.id === id);
  const replies = b.posts.filter((x) => x.parent_id === id);
  return (
    <div className="flex h-full flex-col">
      <Header title="Fil" back="/posts" />
      <div className="min-h-0 flex-1 overflow-y-auto">
        {p ? <div className="border-b border-line bg-surface"><PostCard p={p} b={b} /></div> : <p className="p-4 text-[13px] text-muted">Chargement…</p>}
        {replies.length > 0 && <div className="px-4 pb-1 pt-3 text-[12px] font-medium uppercase tracking-[.06em] text-muted">{replies.length} réponse{replies.length > 1 ? "s" : ""}</div>}
        <div className="divide-y divide-line">{replies.map((r) => <PostCard key={r.id} p={r} b={b} />)}</div>
      </div>
      <Composer images placeholder="Répondre…" onSend={async (body, images, mentions) => { await sb().from("posts").insert({ body, images, mentions, parent_id: id }); }} />
    </div>
  );
}
