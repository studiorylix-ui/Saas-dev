"use client";
import { db, useTable } from "@/lib/store";
import { ago } from "@/lib/ui";
import type { Deal, Post, PostLike, Project, Task } from "@/lib/types";
import Avatar from "./Avatar";
import Icon, { type IconName } from "./Icon";
import Markdown from "./Markdown";
import { PushLink, type Screen } from "./nav";
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
  const x: { to: Screen; kind: string; label: string; icon: IconName } | null = t ? { to: { k: "task", id: t.id }, kind: `Tâche · RYL-${t.num ?? "…"}`, label: t.title, icon: "check" }
    : pr ? { to: { k: "project", id: pr.id }, kind: "Projet", label: pr.name, icon: "folder" }
    : d ? { to: { k: "deal", id: d.id }, kind: "Affaire", label: d.name, icon: "link" } : null;
  if (!x) return null;
  return (
    <PushLink to={x.to} className="tap mt-2.5 flex items-center gap-3 rounded-[10px] border border-line bg-surface px-3 py-2.5">
      <Icon name={x.icon} size={18} className="text-muted" />
      <div className="min-w-0 flex-1"><div className="text-[11.5px] text-muted">{x.kind}</div><div className="truncate text-[14px] font-medium">{x.label}</div></div>
      <Icon name="chevron" size={16} className="text-muted" />
    </PushLink>
  );
}

const Action = ({ icon, n, on, onClick, to, label }: { icon: IconName; n?: number; on?: boolean; onClick?: () => void; to?: Screen; label: string }) => {
  const cls = `tap -ml-2 inline-flex h-9 min-w-11 items-center gap-1.5 rounded-lg px-2 text-[13px] ${on ? "text-ink" : "text-muted"}`;
  const inner = <><span key={String(on)} className={on ? "pop" : ""}><Icon name={icon} size={18} filled={on && icon === "heart"} /></span>{!!n && <span className="tabular-nums">{n}</span>}</>;
  return to ? <PushLink to={to} label={label} className={cls}>{inner}</PushLink> : <button aria-label={label} onClick={onClick} className={cls}>{inner}</button>;
};

// Post façon Threads : avatar, texte Markdown, photos, citation, élément lié, actions.
export default function PostCard({ p, b, onTag, onQuote }: { p: Post; b: Bundle; onTag?: (t: string) => void; onQuote?: (id: string) => void }) {
  const { me, name } = useRefs();
  const replies = b.posts.filter((r) => r.parent_id === p.id).length;
  const likes = b.likes.filter((l) => l.post_id === p.id);
  const liked = likes.some((l) => l.user_id === me);
  const quoted = p.quote_id ? b.posts.find((x) => x.id === p.quote_id) : null;

  const like = () => (liked ? db.remove("post_likes", { post_id: p.id, user_id: me }) : db.insert("post_likes", { post_id: p.id }));
  const del = () => { if (confirm("Supprimer ce post ?")) db.remove("posts", p.id); };

  return (
    <article className="rise flex gap-3 px-4 py-3.5">
      <Avatar name={name(p.author)} size={36} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[14.5px] font-semibold">{name(p.author)}</span>
          <span className="text-[13px] text-muted">{ago(p.created_at)}</span>
          {p.author === me && <button aria-label="Supprimer" className="-mr-2 ml-auto inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted/70 active:bg-black/[.05]" onClick={del}><Icon name="trash" size={15} /></button>}
        </div>
        {p.body && <div className="mt-0.5"><Markdown text={p.body} onTag={onTag} /></div>}
        {p.images.length > 0 && (
          <div className={`mt-2.5 grid gap-1.5 ${p.images.length > 1 ? "grid-cols-2" : ""}`}>
            {p.images.map((u) => (
              <a key={u} href={u} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u} alt="" loading="lazy" decoding="async" className={`w-full rounded-[10px] border border-line bg-subtle object-cover ${p.images.length > 1 ? "aspect-square" : "max-h-[420px]"}`} />
              </a>
            ))}
          </div>
        )}
        {quoted && (
          <div className="mt-2.5 rounded-[10px] border border-line bg-surface px-3 py-2.5">
            <div className="flex items-center gap-2 text-[13px]"><Avatar name={name(quoted.author)} size={18} /><span className="font-medium">{name(quoted.author)}</span><span className="text-muted">{ago(quoted.created_at)}</span></div>
            <p className="mt-1 line-clamp-3 text-[14px] text-ink/80">{quoted.body}</p>
          </div>
        )}
        <LinkCard p={p} b={b} />
        <div className="mt-1.5 flex gap-3">
          <Action icon="heart" n={likes.length} on={liked} onClick={like} label="J'aime" />
          <Action icon="chat" n={replies} to={{ k: "post", id: p.id }} label="Répondre" />
          {onQuote && <Action icon="repeat" onClick={() => onQuote(p.id)} label="Citer" />}
        </div>
      </div>
    </article>
  );
}
