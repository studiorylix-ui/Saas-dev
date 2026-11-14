"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { sb } from "@/lib/supabase/client";
import { useTable } from "@/lib/useTable";
import { ago, iconBtn, pill } from "@/lib/ui";
import type { Msg } from "@/lib/types";
import Avatar from "./Avatar";
import Composer from "./Composer";
import Header from "./Header";
import Icon from "./Icon";
import Markdown from "./Markdown";
import { useRefs } from "./Refs";

const GAP = 5 * 60_000; // messages regroupés s'ils suivent du même auteur à moins de 5 min

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
  const list = thread && root ? [root, ...replies(root.id)] : roots;

  useEffect(() => { end.current?.scrollIntoView(); }, [inChan.length, thread, cur?.id]);

  async function newChannel() {
    const n = prompt("Nom du canal (ex : design)")?.trim().toLowerCase().replace(/\s+/g, "-");
    if (!n) return;
    const { data } = await sb().from("channels").insert({ name: n }).select().single();
    if (data) setPicked(data.id);
  }
  const send = async (body: string) => { await sb().from("messages").insert({ channel_id: cur!.id, body, parent_id: thread }); };

  return (
    <div className="flex h-full flex-col">
      <Header title={thread ? "Fil" : "Discussion"} >
        {thread && <button className={iconBtn} aria-label="Fermer le fil" onClick={() => setThread(null)}><Icon name="x" size={20} /></button>}
      </Header>

      {!thread && (
        <div className="shrink-0 border-b border-line bg-bg">
          <div className="scroll-x flex gap-1.5 overflow-x-auto px-4 py-2.5">
            {channels.map((c) => (
              <button key={c.id} onClick={() => setPicked(c.id)} className={pill(c.id === cur?.id)}>
                <span className={c.id === cur?.id ? "text-white/50" : "text-muted"}>#</span>{c.name}
              </button>
            ))}
            <button onClick={newChannel} aria-label="Nouveau canal" className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-dashed border-neutral-300 text-muted active:bg-subtle"><Icon name="plus" size={15} /></button>
          </div>
          {cur && (cur.description || cur.project_id) && (
            <div className="flex items-center justify-between gap-3 px-4 pb-2 text-[12.5px] text-muted">
              <span className="truncate">{cur.description}</span>
              {cur.project_id && <Link className="inline-flex shrink-0 items-center gap-1 font-medium text-ink" href={`/projects/${cur.project_id}`}>Projet<Icon name="chevron" size={14} /></Link>}
            </div>
          )}
        </div>
      )}
      {thread && cur && <div className="shrink-0 border-b border-line px-4 py-2 text-[12.5px] text-muted">#{cur.name} · {replies(thread).length} réponse{replies(thread).length > 1 ? "s" : ""}</div>}

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="px-4 py-3">
          {list.map((m, i) => {
            const prev = list[i - 1];
            const grouped = !!prev && prev.author === m.author && new Date(m.created_at).getTime() - new Date(prev.created_at).getTime() < GAP && !(thread && i === 1);
            const n = thread ? 0 : replies(m.id).length;
            return (
              <div key={m.id} className={`flex gap-3 ${grouped ? "mt-0.5" : i ? "mt-4" : ""} ${thread && i === 0 ? "border-b border-line pb-4" : ""}`}>
                <div className="w-8 shrink-0">{!grouped && <Avatar name={name(m.author)} />}</div>
                <div className="min-w-0 flex-1">
                  {!grouped && <div className="flex items-baseline gap-2"><span className="text-[14px] font-semibold">{name(m.author)}</span><span className="text-[12px] text-muted">{ago(m.created_at)}</span></div>}
                  <Markdown text={m.body} />
                  {!thread && (
                    <button onClick={() => setThread(m.id)} className={`-ml-1.5 mt-0.5 inline-flex h-7 items-center gap-1 rounded-md px-1.5 text-[12.5px] active:bg-black/[.05] ${n ? "font-medium text-ink" : "text-muted/70"}`}>
                      <Icon name="chat" size={13} />{n ? `${n} réponse${n > 1 ? "s" : ""}` : "Répondre"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {!list.length && (
            <div className="flex flex-col items-center gap-2 pt-20 text-center">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line bg-surface text-muted"><Icon name="hash" size={20} /></span>
              <p className="text-[15px] font-medium">#{cur?.name ?? "…"}</p>
              <p className="text-[13px] text-muted">Aucun message pour l&apos;instant.</p>
            </div>
          )}
          <div ref={end} />
        </div>
      </div>
      {cur && <Composer key={`${cur.id}${thread}`} placeholder={thread ? "Répondre dans le fil…" : `Message dans #${cur.name}`} onSend={send} />}
    </div>
  );
}
