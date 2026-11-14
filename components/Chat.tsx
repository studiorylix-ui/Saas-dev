"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { sb } from "@/lib/supabase/client";
import { useTable } from "@/lib/useTable";
import { ago } from "@/lib/ui";
import type { Msg } from "@/lib/types";
import Composer from "./Composer";
import Header from "./Header";
import Markdown from "./Markdown";
import { useRefs } from "./Refs";

// Chat : canaux par sujet (un par projet possible), messages courts, réponses en fil.
export default function Chat() {
  const { channels, name } = useRefs();
  const { rows } = useTable<Msg>("messages", "created_at", true);
  const [picked, setPicked] = useState<string | null>(useSearchParams().get("c"));
  const [thread, setThread] = useState<string | null>(null);
  const end = useRef<HTMLDivElement>(null);

  const cur = channels.find((c) => c.id === picked) ?? channels.find((c) => c.name === "général") ?? channels[0];
  const inChan = rows.filter((m) => m.channel_id === cur?.id);
  const roots = inChan.filter((m) => !m.parent_id);
  const replies = (id: string) => inChan.filter((m) => m.parent_id === id);
  const root = thread ? inChan.find((m) => m.id === thread) : null;

  useEffect(() => { end.current?.scrollIntoView(); }, [inChan.length, thread, cur?.id]);

  async function newChannel() {
    const n = prompt("Nom du canal (ex : design)")?.trim().toLowerCase().replace(/\s+/g, "-");
    if (!n) return;
    const { data } = await sb().from("channels").insert({ name: n }).select().single();
    if (data) setPicked(data.id);
  }
  const send = async (body: string) => { await sb().from("messages").insert({ channel_id: cur!.id, body, parent_id: thread }); };

  const item = (m: Msg, small?: boolean) => (
    <div key={m.id} className={small ? "py-1" : "rounded-2xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900"}>
      <div className="text-xs text-neutral-500"><b className="text-neutral-800 dark:text-neutral-200">{name(m.author)}</b> · {ago(m.created_at)}</div>
      <Markdown text={m.body} />
      {!small && <button className="mt-1 text-sm text-neutral-500" onClick={() => setThread(m.id)}>💬 {replies(m.id).length || "Répondre"}</button>}
    </div>
  );

  return (
    <div className="flex h-full flex-col">
      <Header title={thread ? `Fil · #${cur?.name}` : "Discussion"}>
        {thread && <button className="text-indigo-600" onClick={() => setThread(null)}>‹ Retour</button>}
      </Header>
      {!thread && (
        <div className="flex gap-2 overflow-x-auto border-b border-neutral-200 px-3 py-2 dark:border-neutral-800">
          {channels.map((c) => (
            <button key={c.id} onClick={() => setPicked(c.id)} className={`shrink-0 rounded-full px-3 py-1 text-sm ${c.id === cur?.id ? "bg-indigo-600 text-white" : "bg-neutral-100 dark:bg-neutral-800"}`}>#{c.name}</button>
          ))}
          <button onClick={newChannel} className="shrink-0 rounded-full bg-neutral-100 px-3 py-1 text-sm dark:bg-neutral-800">＋</button>
        </div>
      )}
      {!thread && cur && (cur.description || cur.project_id) && (
        <div className="flex items-center justify-between px-4 pt-2 text-xs text-neutral-500">
          <span>{cur.description}</span>
          {cur.project_id && <Link className="text-indigo-600" href={`/projects/${cur.project_id}`}>📊 Voir le projet</Link>}
        </div>
      )}
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {thread && root ? (
          <>
            {item(root, true)}
            <div className="ml-3 space-y-1 border-l-2 border-indigo-200 pl-3">{replies(root.id).map((r) => item(r, true))}</div>
          </>
        ) : roots.map((m) => item(m))}
        {!roots.length && !thread && <p className="pt-10 text-center text-neutral-500">Aucun message dans #{cur?.name}.</p>}
        <div ref={end} />
      </div>
      {cur && <Composer key={`${cur.id}${thread}`} placeholder={thread ? "Répondre au fil…" : `Message dans #${cur.name}`} onSend={send} />}
    </div>
  );
}
