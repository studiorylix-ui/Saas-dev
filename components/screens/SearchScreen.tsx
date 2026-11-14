"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTable } from "@/lib/store";
import { ago } from "@/lib/ui";
import type { Deal, Note, Post, Project, Task } from "@/lib/types";
import Avatar from "../Avatar";
import Header from "../Header";
import Icon, { type IconName } from "../Icon";
import { type Screen, useNav } from "../nav";
import { useRefs } from "../Refs";

type Hit = { id: string; go: () => void; icon?: IconName; avatar?: string; title: string; sub: string };

// Recherche globale instantanée (données déjà en mémoire) : membres, tâches, projets, affaires, posts, messages, notes.
export default function SearchScreen() {
  const { profiles, channels, messages, name, me } = useRefs();
  const { push, back } = useNav();
  const router = useRouter();
  const { rows: posts } = useTable<Post>("posts");
  const { rows: tasks } = useTable<Task>("tasks");
  const { rows: projects } = useTable<Project>("projects");
  const { rows: deals } = useTable<Deal>("deals");
  const { rows: notes } = useTable<Note>("notes", "updated_at");
  const [q, setQ] = useState("");
  const s = q.trim().toLowerCase();
  const has = (...v: (string | null | undefined)[]) => v.some((x) => x?.toLowerCase().includes(s));
  const snip = (t: string) => { const i = t.toLowerCase().indexOf(s); return i < 0 ? t : (i > 30 ? "…" : "") + t.slice(Math.max(0, i - 30), i + 90); };
  const chan = (id: string) => { const c = channels.find((x) => x.id === id); return c ? (c.kind === "dm" ? `Privé · ${name(c.members.find((m) => m !== me) ?? me)}` : `#${c.name}`) : ""; };
  const to = (sc: Screen) => () => push(sc);
  const chat = (c: string) => () => { back(); setTimeout(() => router.push(`/chat?c=${c}`), 400); };

  const groups = (s.length < 2 ? [] : [
    ["Membres", profiles.filter((p) => has(p.name)).map((p) => ({ id: p.id, go: () => {}, avatar: p.name, title: p.name, sub: "Membre de l'équipe" }))],
    ["Tâches", tasks.filter((t) => has(t.title, t.description, `ryl-${t.num}`)).map((t) => ({ id: t.id, go: to({ k: "task", id: t.id }), icon: "check" as IconName, title: t.title, sub: `RYL-${t.num ?? "…"}` }))],
    ["Projets", projects.filter((p) => has(p.name, p.description)).map((p) => ({ id: p.id, go: to({ k: "project", id: p.id }), icon: "folder" as IconName, title: p.name, sub: p.status }))],
    ["Affaires", deals.filter((d) => has(d.name, d.client, d.description)).map((d) => ({ id: d.id, go: to({ k: "deal", id: d.id }), icon: "link" as IconName, title: d.name, sub: d.client || d.stage }))],
    ["Posts", posts.filter((p) => has(p.body)).map((p) => ({ id: p.id, go: to({ k: "post", id: p.parent_id ?? p.id }), avatar: name(p.author), title: name(p.author), sub: snip(p.body) }))],
    ["Messages", messages.filter((m) => has(m.body)).map((m) => ({ id: m.id, go: chat(m.channel_id), avatar: name(m.author), title: `${name(m.author)} · ${chan(m.channel_id)}`, sub: `${snip(m.body)} · ${ago(m.created_at)}` }))],
    ["Notes", notes.filter((n) => has(n.title, n.body)).map((n) => ({ id: n.id, go: to({ k: "note", id: n.id }), icon: "note" as IconName, title: n.title || "Sans titre", sub: snip(n.body) }))],
  ] as [string, Hit[]][]).filter(([, l]) => l.length);

  return (
    <>
      <Header title="Rechercher" />
      <div className="shrink-0 px-4 py-2.5">
        <div className="relative">
          <Icon name="search" size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input autoFocus type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher dans tout le hub"
            className="h-11 w-full rounded-[12px] bg-fill pl-10 pr-3 text-[16px] outline-none placeholder:text-muted/70" />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto pb-8">
        {groups.map(([title, hits]) => (
          <section key={title} className="rise mt-3">
            <h2 className="px-4 pb-1.5 text-[12px] font-medium uppercase tracking-[.06em] text-muted">{title}</h2>
            <div className="group-card mx-4 divide-y divide-line">
              {hits.slice(0, 8).map((h) => (
                <button key={h.id} onClick={h.go} className="flex w-full items-center gap-3 px-4 py-2.5 text-left active:bg-subtle">
                  {h.avatar ? <Avatar name={h.avatar} size={34} /> : <span className="inline-flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-subtle text-muted"><Icon name={h.icon!} size={17} /></span>}
                  <div className="min-w-0 flex-1"><div className="truncate text-[15px] font-medium">{h.title}</div><div className="truncate text-[13px] text-muted">{h.sub}</div></div>
                </button>
              ))}
            </div>
          </section>
        ))}
        {s.length >= 2 && !groups.length && <p className="py-16 text-center text-[13px] text-muted">Aucun résultat pour « {q} ».</p>}
        {s.length < 2 && <p className="py-16 text-center text-[13px] text-muted">Membres, posts, messages, tâches, projets, affaires et notes.</p>}
      </div>
    </>
  );
}
