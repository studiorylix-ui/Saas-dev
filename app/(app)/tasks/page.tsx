"use client";
import { useState } from "react";
import Link from "next/link";
import Header, { roundBtn } from "@/components/Header";
import Icon from "@/components/Icon";
import { useRefs } from "@/components/Refs";
import TaskRow from "@/components/TaskRow";
import { sb } from "@/lib/supabase/client";
import { firstTodo } from "@/lib/tasks";
import { useTable } from "@/lib/useTable";
import { btn, input, seg, segItem, sel } from "@/lib/ui";
import type { Project, Task } from "@/lib/types";

const VIEWS = [["list", "Liste"], ["board", "Tableau"], ["project", "Projets"]] as const;

export default function Tasks() {
  const { statuses, labels, me } = useRefs();
  const { rows } = useTable<Task>("tasks", "created_at");
  const { rows: projects } = useTable<Project>("projects");
  const [view, setView] = useState<(typeof VIEWS)[number][0]>("list");
  const [mine, setMine] = useState(false);
  const [q, setQ] = useState("");
  const [label, setLabel] = useState("");
  const [title, setTitle] = useState("");
  const [adding, setAdding] = useState(false);

  const top = rows.filter((t) => !t.parent_id && (!mine || t.assignee === me) && (!label || t.labels.includes(label)) && t.title.toLowerCase().includes(q.toLowerCase()));
  const subs = (id: string) => rows.filter((t) => t.parent_id === id);

  async function add() {
    const s = firstTodo(statuses);
    if (!title.trim() || !s) return;
    await sb().from("tasks").insert({ title: title.trim(), status_id: s.id });
    setTitle("");
  }
  const group = (key: string, head: React.ReactNode, list: Task[]) => list.length > 0 && (
    <section key={key}>
      <h2 className="flex h-9 items-center gap-2 px-4 text-[13px] font-medium">{head}<span className="font-normal text-muted">{list.length}</span></h2>
      <div className="divide-y divide-line border-y border-line">{list.map((t) => <TaskRow key={t.id} t={t} subs={subs(t.id)} />)}</div>
    </section>
  );
  const dot = (c: string) => <span className="h-2 w-2 rounded-full" style={{ background: c }} />;

  return (
    <div className="flex h-full flex-col">
      <Header large title="Tâches"><Link href="/tasks/settings" className={roundBtn} aria-label="Personnaliser"><Icon name="sliders" size={17} /></Link><button aria-label="Ajouter" onClick={() => setAdding(!adding)} className={`${roundBtn} ${adding ? "" : "!bg-accent !text-white"}`}><Icon name={adding ? "x" : "plus"} size={19} stroke={2.2} /></button></Header>
      {adding && (
        <div className="flex shrink-0 gap-2 px-4 pb-2.5">
          <input autoFocus className={input} placeholder={"Nouvelle tâche"} value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") add(); if (e.key === "Escape") setAdding(false); }} />
          <button className={`${btn} px-3.5`} onClick={add} disabled={!title.trim()}>Ajouter</button>
        </div>
      )}

      <div className="shrink-0 space-y-2 border-b border-line px-4 pb-2.5">
        <div className={seg}>{VIEWS.map(([k, l]) => <button key={k} onClick={() => setView(k)} className={segItem(view === k)}>{l}</button>)}</div>
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <Icon name="search" size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
            <input className={`${sel} w-full pl-8`} placeholder="Rechercher" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <select className={sel} value={label} onChange={(e) => setLabel(e.target.value)}><option value="">Étiquette</option>{labels.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select>
          <button onClick={() => setMine(!mine)} className={`h-9 shrink-0 rounded-lg border px-3 text-[13px] transition-colors duration-150 ${mine ? "border-ink bg-ink text-white" : "border-line bg-surface"}`}>Moi</button>
        </div>
      </div>

      <div className="tabpad min-h-0 flex-1 overflow-y-auto">
        {view === "list" && <div className="space-y-3 pt-2">{statuses.map((s) => group(s.id, <>{dot(s.color)}{s.name}</>, top.filter((t) => t.status_id === s.id)))}</div>}
        {view === "project" && (
          <div className="space-y-3 pt-2">
            {projects.map((p) => group(p.id, <><Icon name="folder" size={14} className="text-muted" />{p.name}</>, top.filter((t) => t.project_id === p.id)))}
            {group("none", <span className="text-muted">Sans projet</span>, top.filter((t) => !t.project_id || !projects.some((p) => p.id === t.project_id)))}
          </div>
        )}
        {view === "board" && (
          <div className="scroll-x flex snap-x gap-3 overflow-x-auto px-4 pt-3">
            {statuses.map((s) => {
              const col = top.filter((t) => t.status_id === s.id);
              return (
                <div key={s.id} className="w-[78vw] max-w-[300px] shrink-0 snap-start">
                  <h2 className="mb-2 flex items-center gap-2 text-[13px] font-medium">{dot(s.color)}{s.name}<span className="font-normal text-muted">{col.length}</span></h2>
                  <div className="space-y-2">
                    {col.map((t) => (
                      <div key={t.id} className="overflow-hidden rounded-xl border border-line bg-surface">
                        <TaskRow t={t} subs={subs(t.id)} />
                        <div className="border-t border-line px-3 py-1.5">
                          <select aria-label="Déplacer" className="h-8 w-full bg-transparent text-[13px] text-muted outline-none" value={t.status_id} onChange={(e) => sb().from("tasks").update({ status_id: e.target.value }).eq("id", t.id).then(() => {})}>
                            {statuses.map((x) => <option key={x.id} value={x.id}>Déplacer vers : {x.name}</option>)}
                          </select>
                        </div>
                      </div>
                    ))}
                    {!col.length && <div className="rounded-xl border border-dashed border-line py-6 text-center text-[12px] text-muted">Vide</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {!top.length && view !== "board" && <p className="py-20 text-center text-[13px] text-muted">{rows.length ? "Aucune tâche pour ce filtre." : "Aucune tâche. Touchez + pour en ajouter une."}</p>}
      </div>

    </div>
  );
}
