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
      <Header title="Post" back="/posts" />
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
        {p ? <PostCard p={p} b={b} /> : <p className="text-neutral-500">Chargement…</p>}
        <div className="ml-4 space-y-3 border-l-2 border-indigo-200 pl-3">{replies.map((r) => <PostCard key={r.id} p={r} b={b} />)}</div>
      </div>
      <Composer images placeholder="Répondre…" onSend={async (body, images, mentions) => { await sb().from("posts").insert({ body, images, mentions, parent_id: id }); }} />
    </div>
  );
}
