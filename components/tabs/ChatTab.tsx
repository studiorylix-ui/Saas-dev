"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { db, useReady, useRows } from "@/lib/store";
import { sb } from "@/lib/supabase/client";
import { toast } from "@/lib/toast";
import { ago } from "@/lib/ui";
import type { Channel, Msg, Reaction } from "@/lib/types";
import Avatar from "../Avatar";
import Composer from "../Composer";
import { roundBtn } from "../Header";
import Icon from "../Icon";
import Markdown from "../Markdown";
import { PushLink } from "../nav";
import { editText, openMenu, pressHandlers, type MenuItem } from "../Overlays";
import { useRefs } from "../Refs";
import Sheet from "../Sheet";
import TabScaffold, { Skeleton } from "../TabScaffold";

const GAP = 5 * 60_000; // messages regroupés s'ils suivent du même auteur à moins de 5 min
const dayKey = (d: string) => new Date(d).toDateString();
const dayLabel = (d: string) => {
  const t = new Date(d), now = new Date(), y = new Date(now.getTime() - 864e5);
  if (t.toDateString() === now.toDateString()) return "Aujourd'hui";
  if (t.toDateString() === y.toDateString()) return "Hier";
  return t.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
};
const time = (d: string) => new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

// Chat : canaux + messages privés, appui long (réactions, répondre, copier, modifier, supprimer), indicateur de saisie.
export default function ChatTab() {
  const { channels, messages, name, me, profiles, unread, markRead } = useRefs();
  const reactions = useRows<Reaction>("reactions");
  const ready = useReady("channels", "messages", "profiles");
  const c = useSearchParams().get("c");
  const [picked, setPicked] = useState<string | null>(c);
  const [thread, setThread] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [typing, setTyping] = useState<Record<string, { c: string; at: number }>>({});
  const [away, setAway] = useState(false);
  const [fresh, setFresh] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const tch = useRef<RealtimeChannel | null>(null);
  const lastPing = useRef(0);
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
  const reacts = useMemo(() => {
    const r: Record<string, Record<string, string[]>> = {};
    for (const x of reactions) ((r[x.message_id] ??= {})[x.emoji] ??= []).push(x.user_id);
    return r;
  }, [reactions]);

  // Défilement : on suit le bas seulement si l'utilisateur y est déjà (ou s'il vient d'envoyer).
  const nearBottom = () => { const b = box.current; return !b || b.scrollHeight - b.scrollTop - b.clientHeight < 140; };
  const toBottom = (smooth = false) => { const b = box.current; if (b) b.scrollTo({ top: b.scrollHeight, behavior: smooth ? "smooth" : "auto" }); setFresh(0); };
  const last = list.at(-1);
  const [seenLast, setSeenLast] = useState<string | undefined>();
  useEffect(() => {
    if (!last || last.id === seenLast) return;
    const first = !seenLast;
    setSeenLast(last.id); // eslint-disable-line react-hooks/set-state-in-effect
    if (first || last.author === me || nearBottom()) requestAnimationFrame(() => toBottom(!first));
    else setFresh((n) => n + 1);
  }, [last, seenLast, me]);  
  useEffect(() => { setSeenLast(undefined); setAway(false); }, [cur?.id, thread]); // eslint-disable-line react-hooks/set-state-in-effect
  useEffect(() => { if (cur) markRead(cur.id); }, [cur?.id, inChan.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // « … écrit » : diffusion temps réel légère, sans base de données.
  useEffect(() => {
    const ch = sb().channel("typing").on("broadcast", { event: "t" }, ({ payload }) => setTyping((t) => ({ ...t, [payload.u]: { c: payload.c, at: Date.now() } }))).subscribe();
    tch.current = ch;
    const tick = setInterval(() => setTyping((t) => { const n = Object.fromEntries(Object.entries(t).filter(([, v]) => Date.now() - v.at < 4000)); return Object.keys(n).length === Object.keys(t).length ? t : n; }), 1000);
    return () => { clearInterval(tick); sb().removeChannel(ch); };
  }, []);
  const ping = () => {
    if (!cur || !me || Date.now() - lastPing.current < 2500) return;
    lastPing.current = Date.now();
    tch.current?.send({ type: "broadcast", event: "t", payload: { u: me, c: cur.id } });
  };
  const typers = Object.entries(typing).filter(([u, v]) => u !== me && v.c === cur?.id).map(([u]) => name(u));

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
  const send = (body: string) => { db.insert<Msg>("messages", { channel_id: cur!.id, body, parent_id: thread, edited_at: null }); };
  const react = (m: Msg, e: string) => {
    const mine = reacts[m.id]?.[e]?.includes(me!);
    if (mine) db.remove("reactions", { message_id: m.id, user_id: me, emoji: e });
    else db.insert("reactions", { message_id: m.id, emoji: e });
  };
  const menu = (m: Msg) => {
    const own = m.author === me;
    const items: MenuItem[] = [
      ...(!thread ? [{ label: "Répondre dans un fil", icon: "reply" as const, run: () => setThread(m.id) }] : []),
      { label: "Copier", icon: "copy", run: () => navigator.clipboard?.writeText(m.body).then(() => toast("Copié")) },
      ...(own ? [
        { label: "Modifier", icon: "edit" as const, run: async () => { const v = await editText({ title: "Modifier", value: m.body }); if (v && v !== m.body) db.update("messages", m.id, { body: v, edited_at: new Date().toISOString() }); } },
        { label: "Supprimer", icon: "trash" as const, danger: true, run: () => db.removeLater("messages", m.id, "Message supprimé") },
      ] : []),
    ];
    openMenu({
      preview: <div className="flex gap-3"><Avatar name={name(m.author)} /><div className="min-w-0 flex-1"><div className="text-[14px] font-semibold">{name(m.author)} <span className="font-normal text-muted">{time(m.created_at)}</span></div><div className="line-clamp-6"><Markdown text={m.body} /></div></div></div>,
      reactions: { mine: Object.entries(reacts[m.id] ?? {}).filter(([, us]) => us.includes(me!)).map(([e]) => e), pick: (e) => react(m, e) },
      items,
    });
  };

  const chip = (x: Channel) => {
    const on = x.id === cur?.id;
    const n = unread[x.id] ?? 0;
    return (
      <button key={x.id} onClick={() => { setPicked(x.id); setThread(null); }}
        className={`tap relative inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full pr-3.5 text-[14px] ${x.kind === "dm" ? "pl-1" : "pl-3"} ${on ? "bg-accent text-on-accent shadow-card" : "bg-surface text-ink shadow-card"}`}>
        {x.kind === "dm" ? <Avatar name={label(x)} size={26} /> : <span className={on ? "text-on-accent/50" : "text-muted"}>#</span>}
        <span className={n && !on ? "font-semibold" : ""}>{label(x)}</span>
        {n > 0 && !on && <span className="pop ml-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-ink px-1 text-[10.5px] font-semibold text-on-accent">{n > 99 ? "99+" : n}</span>}
      </button>
    );
  };

  const pills = (
    <div className="border-b border-line">
      {thread ? (
        <div className="flex items-center gap-2 px-4 pb-2.5">
          <button onClick={() => setThread(null)} className="tap inline-flex h-9 items-center gap-1 rounded-full bg-surface pl-2 pr-3.5 shadow-card text-[14px]"><Icon name="back" size={18} />{cur?.kind === "dm" ? label(cur) : `#${cur?.name}`}</button>
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
      actions={<button aria-label="Nouvelle conversation" onClick={() => setAdding(true)} className={`${roundBtn} btn-light !text-on-accent`}><Icon name="plus" size={19} stroke={2.2} /></button>}
      footer={cur && (
        <div className="above-tabbar relative">
          {(away || fresh > 0) && (
            <button onClick={() => toBottom(true)} aria-label="Derniers messages"
              className="tap glass-strong pop absolute -top-12 right-4 inline-flex h-10 min-w-10 items-center justify-center gap-1 rounded-full px-2.5 text-[13px] font-semibold shadow-float">
              {fresh > 0 && <span>{fresh}</span>}<Icon name="down" size={19} />
            </button>
          )}
          <div className="overflow-hidden transition-[height] duration-200" style={{ height: typers.length ? 22 : 0 }}>
            <div className="flex items-center gap-1.5 px-5 text-[12.5px] text-muted"><span className="typing"><i /><i /><i /></span>{typers.join(", ")} {typers.length > 1 ? "écrivent" : "écrit"}…</div>
          </div>
          <Composer key={`${cur.id}${thread}`} onTyping={ping} placeholder={thread ? "Répondre dans le fil…" : cur.kind === "dm" ? `Message à ${label(cur)}` : `Message dans #${cur.name}`} onSend={send} />
        </div>
      )}>
      <div ref={box} onScroll={() => setAway(!nearBottom())} className="chatlist min-h-0 flex-1 overflow-y-auto overscroll-y-contain" style={{ paddingTop: "var(--head)" }}>
        {!ready ? <Skeleton /> : (
          <div className="px-4 pb-3 pt-2">
            {list.map((m, i) => {
              const prev = list[i - 1];
              const newDay = !prev || dayKey(prev.created_at) !== dayKey(m.created_at);
              const grouped = !newDay && !!prev && prev.author === m.author && new Date(m.created_at).getTime() - new Date(prev.created_at).getTime() < GAP && !(thread && i === 1);
              const n = thread ? 0 : replies(m.id).length;
              const rs = Object.entries(reacts[m.id] ?? {});
              return (
                <div key={m.id}>
                  {newDay && <div className="my-4 flex items-center gap-3 text-[11.5px] font-medium uppercase tracking-[.06em] text-muted"><span className="h-px flex-1 bg-line" />{dayLabel(m.created_at)}<span className="h-px flex-1 bg-line" /></div>}
                  <div {...pressHandlers(() => menu(m))} className={`nocallout rise -mx-2 flex gap-3 rounded-[12px] px-2 ${grouped ? "pt-0.5" : i && !newDay ? "pt-3" : ""} ${thread && i === 0 ? "border-b border-line pb-4" : ""}`}>
                    <div className="w-8 shrink-0">{!grouped && <Avatar name={name(m.author)} />}</div>
                    <div className="min-w-0 flex-1">
                      {!grouped && <div className="flex items-baseline gap-2"><span className="text-[14px] font-semibold">{name(m.author)}</span><span className="text-[12px] text-muted">{time(m.created_at)}</span></div>}
                      <Markdown text={m.body} />
                      {m.edited_at && <span className="text-[11.5px] text-muted">(modifié)</span>}
                      {rs.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {rs.map(([e, us]) => (
                            <button key={e} onClick={() => react(m, e)} title={us.map(name).join(", ")}
                              className={`tap pop inline-flex h-7 items-center gap-1 rounded-full border px-2 text-[13px] ${us.includes(me!) ? "border-ink/60 bg-ink/[.06]" : "border-line bg-surface"}`}>
                              <span className="text-[15px]">{e}</span><span className="tabular-nums text-muted">{us.length}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {!thread && n > 0 && (
                        <button onClick={() => setThread(m.id)} className="tap -ml-1.5 mt-0.5 inline-flex h-7 items-center gap-1 rounded-md px-1.5 text-[12.5px] font-medium text-ink">
                          <Icon name="chat" size={13} />{n} réponse{n > 1 ? "s" : ""} <span className="font-normal text-muted">· {ago(replies(m.id).at(-1)!.created_at)}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {!list.length && cur && (
              <div className="rise flex flex-col items-center gap-2 pt-20 text-center">
                {cur.kind === "dm" ? <Avatar name={label(cur)} size={56} /> : <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-surface shadow-card text-muted"><Icon name="hash" size={22} /></span>}
                <p className="mt-1 text-[16px] font-semibold">{cur.kind === "dm" ? label(cur) : `#${cur.name}`}</p>
                <p className="text-[13px] text-muted">{cur.kind === "dm" ? "Conversation privée : vous deux seulement." : "Aucun message pour l'instant."}</p>
              </div>
            )}
            {list.length > 0 && <p className="pt-4 text-center text-[11.5px] text-muted/70">Appui long sur un message pour réagir, répondre ou modifier.</p>}
          </div>
        )}
      </div>

      <Sheet open={adding} onClose={() => setAdding(false)} title="Nouvelle conversation">
        <div className="px-2 pb-2">
          <button onClick={newChannel} className="tap flex h-12 w-full items-center gap-3 rounded-[12px] px-2 text-left">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-fill"><Icon name="hash" size={18} /></span>
            <span className="text-[15px] font-medium">Nouveau canal d&apos;équipe</span>
          </button>
          <div className="px-2 pb-1 pt-3 text-[12px] font-medium uppercase tracking-[.06em] text-muted">Message privé</div>
          {profiles.filter((p) => p.id !== me).map((p) => (
            <button key={p.id} onClick={() => openDm(p.id)} className="tap flex h-12 w-full items-center gap-3 rounded-[12px] px-2 text-left">
              <Avatar name={p.name} size={36} /><span className="text-[15px]">{p.name}</span>
            </button>
          ))}
        </div>
      </Sheet>
    </TabScaffold>
  );
}
