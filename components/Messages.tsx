"use client";
import { useEffect, useRef, useState } from "react";
import { sb } from "@/lib/supabase/client";
import { useMe, useTable } from "@/lib/useTable";
import { ago, btn, card, input } from "@/lib/ui";
import type { Like, Msg, Profile } from "@/lib/types";

// Un seul composant pour la discussion (kind=chat, fil continu) et les posts (kind=post, façon X).
export default function Messages({ kind }: { kind: "chat" | "post" }) {
  const isPost = kind === "post";
  const { rows } = useTable<Msg>("messages", "created_at", true);
  const { rows: profiles } = useTable<Profile>("profiles", "name", true);
  const { rows: likes } = useTable<Like>("likes");
  const me = useMe();
  const [thread, setThread] = useState<string | null>(null);
  const [text, setText] = useState("");
  const end = useRef<HTMLDivElement>(null);

  const name = (id: string) => profiles.find((p) => p.id === id)?.name ?? "?";
  const roots = rows.filter((m) => m.kind === kind && !m.parent_id);
  const list = isPost ? [...roots].reverse() : roots;
  const replies = (id: string) => rows.filter((m) => m.parent_id === id);
  const root = thread ? rows.find((m) => m.id === thread) : null;

  useEffect(() => { if (!isPost) end.current?.scrollIntoView(); }, [rows.length, thread, isPost]);

  async function send() {
    const body = text.trim();
    if (!body) return;
    setText("");
    await sb().from("messages").insert({ kind, body, parent_id: thread });
  }
  async function toggleLike(id: string) {
    const mine = likes.some((l) => l.message_id === id && l.user_id === me);
    if (mine) await sb().from("likes").delete().match({ message_id: id, user_id: me });
    else await sb().from("likes").insert({ message_id: id });
  }

  const item = (m: Msg, small?: boolean) => {
    const n = likes.filter((l) => l.message_id === m.id).length;
    const liked = likes.some((l) => l.message_id === m.id && l.user_id === me);
    return (
      <div key={m.id} className={small ? "py-1" : card}>
        <div className="text-xs text-neutral-500"><b className="text-neutral-800 dark:text-neutral-200">{name(m.author)}</b> · {ago(m.created_at)}</div>
        <p className="whitespace-pre-wrap text-[15px]">{m.body}</p>
        {!small && (
          <div className="mt-1 flex gap-4 text-sm text-neutral-500">
            <button onClick={() => setThread(m.id)}>💬 {replies(m.id).length || "Répondre"}</button>
            {isPost && <button onClick={() => toggleLike(m.id)} className={liked ? "text-rose-600" : ""}>{liked ? "♥" : "♡"} {n || ""}</button>}
          </div>
        )}
      </div>
    );
  };

  const composer = (
    <div className="flex gap-2 border-t border-neutral-200 bg-white p-2 dark:border-neutral-800 dark:bg-neutral-950">
      <textarea className={`${input} max-h-32 resize-none`} rows={1} placeholder={thread ? "Répondre…" : isPost ? "Quoi de neuf ?" : "Message…"} value={text} onChange={(e) => setText(e.target.value)} />
      <button className={btn} onClick={send} disabled={!text.trim()}>↑</button>
    </div>
  );

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-2 border-b border-neutral-200 px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))] dark:border-neutral-800">
        {thread && <button className="text-indigo-600" onClick={() => setThread(null)}>‹ Retour</button>}
        <h1 className="font-semibold">{thread ? "Fil" : isPost ? "Posts" : "Discussion"}</h1>
      </header>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {thread && root ? (
          <>
            {item(root, true)}
            <div className="ml-3 space-y-1 border-l-2 border-indigo-200 pl-3">{replies(root.id).map((r) => item(r, true))}</div>
          </>
        ) : (
          list.map((m) => item(m))
        )}
        {!list.length && !thread && <p className="pt-10 text-center text-neutral-500">Rien pour l&apos;instant. Lancez la conversation.</p>}
        <div ref={end} />
      </div>
      {composer}
    </div>
  );
}
