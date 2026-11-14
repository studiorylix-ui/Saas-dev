"use client";
import Link from "next/link";
import { sb } from "@/lib/supabase/client";
import { useTable } from "@/lib/useTable";
import { ago } from "@/lib/ui";
import type { Deal, Post, PostLike, Project, Task } from "@/lib/types";
import Markdown from "./Markdown";
import { useRefs } from "./Refs";

export type Bundle = { posts: Post[]; likes: PostLike[]; tasks: Task[]; projects: Project[]; deals: Deal[] };

export function usePostBundle(): Bundle {
  return {
    posts: useTable<Post>("posts", "created_at", true).rows,
    likes: useTable<PostLike>("post_likes").rows,
    tasks: useTable<Task>("tasks").rows,
    projects: useTable<Project>("projects").rows,
    deals: useTable<Deal>("deals").rows,
  };
}

function LinkCard({ p, b }: { p: Post; b: Bundle }) {
  const t = p.link_type === "task" ? b.tasks.find((x) => x.id === p.link_id) : null;
  const pr = p.link_type === "project" ? b.projects.find((x) => x.id === p.link_id) : null;
  const d = p.link_type === "deal" ? b.deals.find((x) => x.id === p.link_id) : null;
  const x = t ? { href: `/tasks/${t.id}`, icon: "✅", label: `RYL-${t.num} · ${t.title}` } : pr ? { href: `/projects/${pr.id}`, icon: "📊", label: pr.name } : d ? { href: `/deals/${d.id}`, icon: "💼", label: d.name } : null;
  if (!x) return null;
  return <Link href={x.href} className="mt-2 flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm text-indigo-800 dark:border-indigo-900 dark:bg-indigo-950 dark:text-indigo-200">{x.icon} {x.label}</Link>;
}

export default function PostCard({ p, b, onTag, onQuote }: { p: Post; b: Bundle; onTag?: (t: string) => void; onQuote?: (id: string) => void }) {
  const { me, name } = useRefs();
  const replies = b.posts.filter((r) => r.parent_id === p.id).length;
  const likes = b.likes.filter((l) => l.post_id === p.id);
  const liked = likes.some((l) => l.user_id === me);
  const quoted = p.quote_id ? b.posts.find((x) => x.id === p.quote_id) : null;

  async function like() {
    if (liked) await sb().from("post_likes").delete().match({ post_id: p.id, user_id: me });
    else await sb().from("post_likes").insert({ post_id: p.id });
  }
  async function del() {
    if (confirm("Supprimer ce post ?")) await sb().from("posts").delete().eq("id", p.id);
  }

  return (
    <article className="rounded-2xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center gap-2 text-sm">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">{name(p.author).slice(0, 2).toUpperCase()}</span>
        <div><b>{name(p.author)}</b> <span className="text-xs text-neutral-500">· {ago(p.created_at)}</span></div>
        {p.author === me && <button className="ml-auto text-neutral-400" onClick={del}>🗑</button>}
      </div>
      {p.body && <div className="mt-2"><Markdown text={p.body} onTag={onTag} /></div>}
      {p.images.length > 0 && (
        <div className={`mt-2 grid gap-1 ${p.images.length > 1 ? "grid-cols-2" : ""}`}>
          {p.images.map((u) => (
            <a key={u} href={u} target="_blank" rel="noopener noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt="" className={`w-full rounded-xl object-cover ${p.images.length > 1 ? "aspect-square" : "max-h-96"}`} />
            </a>
          ))}
        </div>
      )}
      {quoted && <div className="mt-2 rounded-xl border border-neutral-200 p-2 text-sm dark:border-neutral-700"><b>{name(quoted.author)}</b><p className="line-clamp-3 text-neutral-600 dark:text-neutral-400">{quoted.body}</p></div>}
      <LinkCard p={p} b={b} />
      <div className="mt-2 flex gap-5 text-sm text-neutral-500">
        <Link href={`/posts/${p.id}`}>💬 {replies || ""}</Link>
        <button onClick={like} className={liked ? "text-rose-600" : ""}>{liked ? "♥" : "♡"} {likes.length || ""}</button>
        {onQuote && <button onClick={() => onQuote(p.id)}>🔁 Citer</button>}
      </div>
    </article>
  );
}
