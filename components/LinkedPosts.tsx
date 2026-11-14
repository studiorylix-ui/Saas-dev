"use client";
import { useTable } from "@/lib/store";
import { PushLink } from "./nav";
import { ago } from "@/lib/ui";
import type { Post } from "@/lib/types";
import { useRefs } from "./Refs";

// Posts qui pointent vers cet élément (projet, affaire…).
export default function LinkedPosts({ type, id }: { type: "task" | "project" | "deal"; id: string }) {
  const { name } = useRefs();
  const { rows } = useTable<Post>("posts");
  const mine = rows.filter((p) => p.link_type === type && p.link_id === id);
  if (!mine.length) return <p className="text-[13px] text-muted">Aucun post lié. Liez un post depuis l&apos;onglet Posts.</p>;
  return <ul className="space-y-2">{mine.map((p) => <li key={p.id}><PushLink to={{ k: "post", id: p.id }} className="tap block group-card px-3 py-2.5 text-[14px] row"><b>{name(p.author)}</b> <span className="text-[12px] text-muted">{ago(p.created_at)}</span><p className="line-clamp-2">{p.body}</p></PushLink></li>)}</ul>;
}
