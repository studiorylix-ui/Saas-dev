"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { sb } from "@/lib/supabase/client";
import { ago, iconBtn } from "@/lib/ui";
import type { Channel } from "@/lib/types";
import Avatar from "./Avatar";
import Composer from "./Composer";
import Header, { roundBtn } from "./Header";
import Icon from "./Icon";
import Markdown from "./Markdown";
import { useRefs } from "./Refs";
import Sheet from "./Sheet";

const GAP = 5 * 60_000; // messages regroupés s'ils suivent du même auteur à moins de 5 min

// Chat : canaux d'équipe + messages privés en pastilles (badges de non-lus), fils de réponses.
export default function Chat() {
  const { channels, messages, name, me, profiles, unread, markRead } = useRefs();
  const [picked, setPicked] = useState<string | null>(useSearchParams().get("c"));
  const [thread, setThread] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  const teams = channels.filter((c) => c.kind !== "dm");
  const dms = channels.filter((c) => c.kind === "dm");
  const other = (c: Channel) => c.members.find((m) => m !== me) ?? me;
  const label = (c: Channel) => (c.kind === "dm" ? name(other(c)) : c.name);
  const cur = channels.find((c) => c.id === picked) ?? teams.find((c) => c.name === "général") ?? teams[0];
  const inChan = messages.filter((m) => m.channel_id === cur?.id);
  const roots = inChan.filter((m) => !m.parent_id);
  const replies = (id: string) => inChan.filter((m) => m.parent_id === id);
  const root = thread ? inChan.find((m) => m.id === thread) : null;
  const list = thread && root ? [root, ...replies(root.id)] : roots;

  useEffect(() => { end.current?.scrollIntoView(); }, [inChan.length, thread, cur?.id]);
  useEffect(() => { if (cur) markRead(cur.id); }, [cur?.id, inChan.length]); // eslint-disable-line react-hooks/exhaustive-deps

  async function newChannel() {
    setAdding(false);
    const n = prompt("Nom du canal (ex : design)")?.trim().toLowerCase().replace(/\s+/g, "-");
    if (!n) return;
    const { data } = await sb().from("channels").insert({ name: n }).select().single();
    if (data) setPicked(data.id);
  }
  async function openDm(uid: string) {
    setAdding(false);
    const found = dms.find((c) => c.members.includes(uid) && c.members.includes(me!) && (uid !== me || c.members.every((m) => m === me)));
    if (found) return setPicked(found.id);
    const members = [...new Set([me!, uid])].sort();
    const { data } = await sb().from("channels").insert({ kind: "dm", name: `dm-${members.join("-")}`, members }).select().single();
    if (data) setPicked(data.id);
  }
  const send = async (body: string) => { await sb().from("messages").insert({ channel_id: cur!.id, body, parent_id: thread }); };

  const chip = (c: Channel) => {
    const on = c.id === cur?.id;
    const n = unread[c.id] ?? 0;
    return (
      <button key={c.id} onClick={() => { setPicked(c.id); setThread(null); }}
        className={`relative inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border pl-3 pr-3.5 text-[14px] transition-colors duration-150 ease-out ${on ? "border-ink bg-ink text-white" : "border-line bg-surface text-ink active:bg-subtle"} ${c.kind === "dm" ? "pl-1" : ""}`}>
        {c.kind === "dm" ? <Avatar name={label(c)} size={26} /> : <span className={on ? "text-white/50" : "text-muted"}>#</span>}
        <span className={n && !on ? "font-semibold" : ""}>{label(c)}</span>
        {n > 0 && !on && <span className="ml-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-ink px-1 text-[10.5px] font-semibold text-white">{n > 99 ? "99+" : n}</span>}
      </button>
    );
  };

  return (
    <div className="flex h-full flex-col">
      {thread ? (
        <Header title="Fil"><button className={iconBtn} aria-label="Fermer le fil" onClick={() => setThread(null)}><Icon name="x" size={20} /></button></Header>
      ) : (
        <Header large title="Discussion"><button aria-label="Nouvelle conversation" onClick={() => setAdding(true)} className={`${roundBtn} !bg-accent !text-white`}><Icon name="plus" size={19} stroke={2.2} /></button></Header>
      )}

      {!thread && (
        <div className="shrink-0 border-b border-line">
          <div className="scroll-x flex gap-1.5 overflow-x-auto px-4 pb-2.5 pt-1">
            {teams.map(chip)}
            {dms.length > 0 && <span className="mx-1 my-2 w-px shrink-0 bg-line" />}
            {dms.map(chip)}
          </div>
          {cur && (cur.description || cur.project_id) && (
            <div className="flex items-center justify-between gap-3 px-4 pb-2 text-[12.5px] text-muted">
              <span className="truncate">{cur.description}</span>
              {cur.project_id && <Link className="inline-flex shrink-0 items-center gap-1 font-medium text-ink" href={`/projects/${cur.project_id}`}>Projet<Icon name="chevron" size={14} /></Link>}
            </div>
          )}
        </div>
      )}
      {thread && cur && <div className="shrink-0 border-b border-line px-4 py-2 text-[12.5px] text-muted">{cur.kind === "dm" ? label(cur) : `#${cur.name}`} · {replies(thread).length} réponse{replies(thread).length > 1 ? "s" : ""}</div>}

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
          {!list.length && cur && (
            <div className="flex flex-col items-center gap-2 pt-20 text-center">
              {cur.kind === "dm" ? <Avatar name={label(cur)} size={56} /> : <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-line bg-surface text-muted"><Icon name="hash" size={22} /></span>}
              <p className="mt-1 text-[16px] font-semibold">{cur.kind === "dm" ? label(cur) : `#${cur.name}`}</p>
              <p className="text-[13px] text-muted">{cur.kind === "dm" ? "Conversation privée : vous deux seulement." : "Aucun message pour l'instant."}</p>
            </div>
          )}
          <div ref={end} />
        </div>
      </div>
      {cur && <Composer key={`${cur.id}${thread}`} className="above-tabbar" placeholder={thread ? "Répondre dans le fil…" : cur.kind === "dm" ? `Message à ${label(cur)}` : `Message dans #${cur.name}`} onSend={send} />}

      <Sheet open={adding} onClose={() => setAdding(false)} title="Nouvelle conversation">
        <div className="px-2 pb-2">
          <button onClick={newChannel} className="flex h-12 w-full items-center gap-3 rounded-[10px] px-2 text-left active:bg-subtle">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-subtle"><Icon name="hash" size={18} /></span>
            <span className="text-[15px] font-medium">Nouveau canal d&apos;équipe</span>
          </button>
          <div className="px-2 pb-1 pt-3 text-[12px] font-medium uppercase tracking-[.06em] text-muted">Message privé</div>
          {profiles.filter((p) => p.id !== me).map((p) => (
            <button key={p.id} onClick={() => openDm(p.id)} className="flex h-12 w-full items-center gap-3 rounded-[10px] px-2 text-left active:bg-subtle">
              <Avatar name={p.name} size={36} /><span className="text-[15px]">{p.name}</span>
            </button>
          ))}
        </div>
      </Sheet>
    </div>
  );
}
