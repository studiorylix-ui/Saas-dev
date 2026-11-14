"use client";
import Link from "next/link";
import { useTable } from "@/lib/useTable";
import { ago } from "@/lib/ui";
import type { Post } from "@/lib/types";
import { useRefs } from "./Refs";

// Posts qui pointent vers cet élément (projet, affaire…).
export default function LinkedPosts({ type, id }: { type: "task" | "project" | "deal"; id: string }) {
  const { name } = useRefs();
  const { rows } = useTable<Post>("posts");
  const mine = rows.filter((p) => p.link_type === type && p.link_id === id);
  if (!mine.length) return <p className="text-sm text-neutral-400">Aucun post lié. Liez un post depuis l&apos;onglet Posts.</p>;
  return <ul className="space-y-2">{mine.map((p) => <li key={p.id}><Link href={`/posts/${p.id}`} className="block rounded-xl border border-neutral-200 p-2 text-sm dark:border-neutral-800"><b>{name(p.author)}</b> <span className="text-xs text-neutral-400">{ago(p.created_at)}</span><p className="line-clamp-2">{p.body}</p></Link></li>)}</ul>;
}
