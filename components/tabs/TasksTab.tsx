"use client";
import { useState } from "react";
import { db, useReady, useTable } from "@/lib/store";
import { firstTodo } from "@/lib/tasks";
import { btn, input, sel } from "@/lib/ui";
import type { Project, Task } from "@/lib/types";
import { RoundPush, roundBtn } from "../Header";
import Icon from "../Icon";
import Segmented from "../Segmented";
import { useRefs } from "../Refs";
import TabScaffold, { Skeleton } from "../TabScaffold";
import TaskRow from "../TaskRow";

const VIEWS = [["list", "Liste"], ["board", "Tableau"], ["project", "Projets"]] as const;

export default function TasksTab() {
  const { statuses, labels, me } = useRefs();
  const ready = useReady("tasks", "statuses");
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

  function add() {
    const s = firstTodo(statuses);
    if (!title.trim() || !s) return;
    db.insert("tasks", { title: title.trim(), status_id: s.id, priority: 0, labels: [], fields: {}, description: "", assignee: null, due: null, project_id: null, deal_id: null, parent_id: null });
    setTitle("");
  }
  const dot = (c: string) => <span className="h-2 w-2 rounded-full" style={{ background: c }} />;
  const group = (key: string, head: React.ReactNode, list: Task[]) => list.length > 0 && (
    <section key={key}>
      <h2 className="flex h-9 items-center gap-2 px-6 text-[13px] font-medium">{head}<span className="font-normal text-muted">{list.length}</span></h2>
      <div className="group-card mx-4 divide-y divide-line">{list.map((t) => <TaskRow key={t.id} t={t} subs={subs(t.id)} />)}</div>
    </section>
  );

  return (
    <TabScaffold title="Tâches"
      actions={<>
        <RoundPush to={{ k: "settings" }} icon="sliders" label="Personnaliser" />
        <button aria-label="Ajouter" onClick={() => setAdding(!adding)} className={`${roundBtn} ${adding ? "" : "btn-light !text-on-accent"}`}><Icon name={adding ? "x" : "plus"} size={19} stroke={2.2} /></button>
      </>}
      sub={<div className="space-y-2 px-4 pb-3">
        {adding && (
          <div className="rise flex gap-2 pb-1">
            <input autoFocus className={input} placeholder="Nouvelle tâche" value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") add(); if (e.key === "Escape") setAdding(false); }} />
            <button className={`${btn} px-3.5`} onClick={add} disabled={!title.trim()}>Ajouter</button>
          </div>
        )}
        <Segmented options={VIEWS} value={view} onChange={setView} />
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <Icon name="search" size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
            <input className={`${sel} w-full pl-8`} placeholder="Filtrer" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <select className={sel} value={label} onChange={(e) => setLabel(e.target.value)}><option value="">Étiquette</option>{labels.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select>
          <button onClick={() => setMine(!mine)} className={`tap h-9 shrink-0 rounded-lg border px-3 text-[13px] ${mine ? "border-ink bg-ink text-on-accent" : "border-line bg-surface"}`}>Moi</button>
        </div>
      </div>}>
      {!ready ? <Skeleton avatar={false} /> : (
        <>
          {view === "list" && <div className="space-y-3 pt-2">{statuses.map((s) => group(s.id, <>{dot(s.color)}{s.name}</>, top.filter((t) => t.status_id === s.id)))}</div>}
          {view === "project" && (
            <div className="space-y-3 pt-2">
              {projects.map((p) => group(p.id, <><Icon name="folder" size={14} className="text-muted" />{p.name}</>, top.filter((t) => t.project_id === p.id)))}
              {group("none", <span className="text-muted">Sans projet</span>, top.filter((t) => !t.project_id || !projects.some((p) => p.id === t.project_id)))}
            </div>
          )}
          {view === "board" && (
            <div className="scroll-x flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pt-3">
              {statuses.map((s) => {
                const col = top.filter((t) => t.status_id === s.id);
                return (
                  <div key={s.id} className="w-[78vw] max-w-[300px] shrink-0 snap-start">
                    <h2 className="mb-2 flex items-center gap-2 text-[13px] font-medium">{dot(s.color)}{s.name}<span className="font-normal text-muted">{col.length}</span></h2>
                    <div className="space-y-2">
                      {col.map((t) => (
                        <div key={t.id} className="group-card bg-surface">
                          <TaskRow t={t} subs={subs(t.id)} />
                          <div className="border-t border-line px-3 py-1.5">
                            <select aria-label="Déplacer" className="h-8 w-full bg-transparent text-[13px] text-muted outline-none" value={t.status_id} onChange={(e) => db.update("tasks", t.id, { status_id: e.target.value })}>
                              {statuses.map((x) => <option key={x.id} value={x.id}>Déplacer vers : {x.name}</option>)}
                            </select>
                          </div>
                        </div>
                      ))}
                      {!col.length && <div className="rounded-2xl border border-dashed border-line py-6 text-center text-[12px] text-muted">Vide</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {!top.length && view !== "board" && <p className="py-20 text-center text-[13px] text-muted">{rows.length ? "Aucune tâche pour ce filtre." : "Aucune tâche. Touchez + pour en ajouter une."}</p>}
        </>
      )}
    </TabScaffold>
  );
}
