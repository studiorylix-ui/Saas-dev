"use client";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { db, useReady } from "@/lib/store";
import { ago } from "@/lib/ui";
import type { Channel, Msg } from "@/lib/types";
import Avatar from "../Avatar";
import Composer from "../Composer";
import { roundBtn } from "../Header";
import Icon from "../Icon";
import Markdown from "../Markdown";
import { PushLink } from "../nav";
import { useRefs } from "../Refs";
import Sheet from "../Sheet";
import TabScaffold, { Skeleton } from "../TabScaffold";

const GAP = 5 * 60_000; // messages regroupés s'ils suivent du même auteur à moins de 5 min

// Chat : canaux d'équipe + messages privés en pastilles (badges de non-lus), fils de réponses.
export default function ChatTab() {
  const { channels, messages, name, me, profiles, unread, markRead } = useRefs();
  const ready = useReady("channels", "messages", "profiles");
  const c = useSearchParams().get("c");
  const [picked, setPicked] = useState<string | null>(c);
  const [thread, setThread] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const [lastC, setLastC] = useState(c);
  if (c !== lastC) { setLastC(c); if (c) { setPicked(c); setThread(null); } }

  const teams = channels.filter((x) => x.kind !== "dm");
  const dms = channels.filter((x) => x.kind === "dm");
  const other = (x: Channel) => x.members.find((m) => m !== me) ?? me;
  const label = (x: Channel) => (x.kind === "dm" ? name(other(x)) : x.name);
  const cur = channels.find((x) => x.id === picked) ?? teams.find((x) => x.name === "général") ?? teams[0];
  const inChan = messages.filter((m) => m.channel_id === cur?.id);
  const roots = inChan.filter((m) => !m.parent_id);
  const replies = (id: string) => inChan.filter((m) => m.parent_id === id);
  const root = thread ? inChan.find((m) => m.id === thread) : null;
  const list = thread && root ? [root, ...replies(root.id)] : roots;

  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [list.length, thread, cur?.id]);
  useEffect(() => { if (cur) markRead(cur.id); }, [cur?.id, inChan.length]); // eslint-disable-line react-hooks/exhaustive-deps

  function newChannel() {
    setAdding(false);
    const n = prompt("Nom du canal (ex : design)")?.trim().toLowerCase().replace(/\s+/g, "-");
    if (n) setPicked(db.insert<Channel>("channels", { name: n, description: "", kind: "channel", members: [] }).id);
  }
  function openDm(uid: string) {
    setAdding(false);
    const found = dms.find((x) => x.members.includes(uid) && x.members.includes(me!));
    if (found) return setPicked(found.id);
    const members = [...new Set([me!, uid])].sort();
    setPicked(db.insert<Channel>("channels", { kind: "dm", name: `dm-${members.join("-")}`, members, description: "" }).id);
  }
  const send = (body: string) => { db.insert<Msg>("messages", { channel_id: cur!.id, body, parent_id: thread }); };

  const chip = (x: Channel) => {
    const on = x.id === cur?.id;
    const n = unread[x.id] ?? 0;
    return (
      <button key={x.id} onClick={() => { setPicked(x.id); setThread(null); }}
        className={`tap relative inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border pr-3.5 text-[14px] ${x.kind === "dm" ? "pl-1" : "pl-3"} ${on ? "border-ink bg-ink text-white" : "border-line bg-surface text-ink"}`}>
        {x.kind === "dm" ? <Avatar name={label(x)} size={26} /> : <span className={on ? "text-white/50" : "text-muted"}>#</span>}
        <span className={n && !on ? "font-semibold" : ""}>{label(x)}</span>
        {n > 0 && !on && <span className="pop ml-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-ink px-1 text-[10.5px] font-semibold text-white">{n > 99 ? "99+" : n}</span>}
      </button>
    );
  };

  const pills = (
    <div className="shrink-0 border-b border-line">
      {thread ? (
        <div className="flex items-center gap-2 px-4 pb-2.5">
          <button onClick={() => setThread(null)} className="tap inline-flex h-9 items-center gap-1 rounded-full border border-line bg-surface pl-2 pr-3.5 text-[14px]"><Icon name="back" size={18} />{cur?.kind === "dm" ? label(cur) : `#${cur?.name}`}</button>
          <span className="text-[13px] text-muted">Fil · {replies(thread).length} réponse{replies(thread).length > 1 ? "s" : ""}</span>
        </div>
      ) : (
        <>
          <div className="scroll-x flex gap-1.5 overflow-x-auto px-4 pb-2.5">
            {teams.map(chip)}
            {dms.length > 0 && <span className="mx-1 my-2 w-px shrink-0 bg-line" />}
            {dms.map(chip)}
          </div>
          {cur && (cur.description || cur.project_id) && (
            <div className="flex items-center justify-between gap-3 px-4 pb-2 text-[12.5px] text-muted">
              <span className="truncate">{cur.description}</span>
              {cur.project_id && <PushLink to={{ k: "project", id: cur.project_id }} className="inline-flex shrink-0 items-center gap-1 font-medium text-ink">Projet<Icon name="chevron" size={14} /></PushLink>}
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <TabScaffold title="Discussion" scroll={false} sub={pills}
      actions={<button aria-label="Nouvelle conversation" onClick={() => setAdding(true)} className={`${roundBtn} !bg-accent !text-white`}><Icon name="plus" size={19} stroke={2.2} /></button>}
      footer={cur && <Composer key={`${cur.id}${thread}`} className="above-tabbar" placeholder={thread ? "Répondre dans le fil…" : cur.kind === "dm" ? `Message à ${label(cur)}` : `Message dans #${cur.name}`} onSend={send} />}>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
        {!ready ? <Skeleton /> : (
          <div className="px-4 py-3">
            {list.map((m, i) => {
              const prev = list[i - 1];
              const grouped = !!prev && prev.author === m.author && new Date(m.created_at).getTime() - new Date(prev.created_at).getTime() < GAP && !(thread && i === 1);
              const n = thread ? 0 : replies(m.id).length;
              return (
                <div key={m.id} className={`rise flex gap-3 ${grouped ? "mt-0.5" : i ? "mt-4" : ""} ${thread && i === 0 ? "border-b border-line pb-4" : ""}`}>
                  <div className="w-8 shrink-0">{!grouped && <Avatar name={name(m.author)} />}</div>
                  <div className="min-w-0 flex-1">
                    {!grouped && <div className="flex items-baseline gap-2"><span className="text-[14px] font-semibold">{name(m.author)}</span><span className="text-[12px] text-muted">{ago(m.created_at)}</span></div>}
                    <Markdown text={m.body} />
                    {!thread && (
                      <button onClick={() => setThread(m.id)} className={`tap -ml-1.5 mt-0.5 inline-flex h-7 items-center gap-1 rounded-md px-1.5 text-[12.5px] ${n ? "font-medium text-ink" : "text-muted/70"}`}>
                        <Icon name="chat" size={13} />{n ? `${n} réponse${n > 1 ? "s" : ""}` : "Répondre"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {!list.length && cur && (
              <div className="rise flex flex-col items-center gap-2 pt-20 text-center">
                {cur.kind === "dm" ? <Avatar name={label(cur)} size={56} /> : <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-line bg-surface text-muted"><Icon name="hash" size={22} /></span>}
                <p className="mt-1 text-[16px] font-semibold">{cur.kind === "dm" ? label(cur) : `#${cur.name}`}</p>
                <p className="text-[13px] text-muted">{cur.kind === "dm" ? "Conversation privée : vous deux seulement." : "Aucun message pour l'instant."}</p>
              </div>
            )}
            <div ref={end} />
          </div>
        )}
      </div>

      <Sheet open={adding} onClose={() => setAdding(false)} title="Nouvelle conversation">
        <div className="px-2 pb-2">
          <button onClick={newChannel} className="tap flex h-12 w-full items-center gap-3 rounded-[10px] px-2 text-left">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-subtle"><Icon name="hash" size={18} /></span>
            <span className="text-[15px] font-medium">Nouveau canal d&apos;équipe</span>
          </button>
          <div className="px-2 pb-1 pt-3 text-[12px] font-medium uppercase tracking-[.06em] text-muted">Message privé</div>
          {profiles.filter((p) => p.id !== me).map((p) => (
            <button key={p.id} onClick={() => openDm(p.id)} className="tap flex h-12 w-full items-center gap-3 rounded-[10px] px-2 text-left">
              <Avatar name={p.name} size={36} /><span className="text-[15px]">{p.name}</span>
            </button>
          ))}
        </div>
      </Sheet>
    </TabScaffold>
  );
}
