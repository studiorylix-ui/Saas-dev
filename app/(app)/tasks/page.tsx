"use client";
import { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import { useRefs } from "@/components/Refs";
import TaskRow from "@/components/TaskRow";
import { sb } from "@/lib/supabase/client";
import { firstTodo } from "@/lib/tasks";
import { useTable } from "@/lib/useTable";
import { btn, input, sel } from "@/lib/ui";
import type { Project, Task } from "@/lib/types";

const VIEWS = [["list", "Liste"], ["board", "Kanban"], ["project", "Projets"]] as const;

export default function Tasks() {
  const { statuses, labels, me } = useRefs();
  const { rows } = useTable<Task>("tasks", "created_at");
  const { rows: projects } = useTable<Project>("projects");
  const [view, setView] = useState<(typeof VIEWS)[number][0]>("list");
  const [mine, setMine] = useState(false);
  const [q, setQ] = useState("");
  const [label, setLabel] = useState("");
  const [title, setTitle] = useState("");

  const top = rows.filter((t) => !t.parent_id && (!mine || t.assignee === me) && (!label || t.labels.includes(label)) && t.title.toLowerCase().includes(q.toLowerCase()));
  const subs = (id: string) => rows.filter((t) => t.parent_id === id);
  const kind = (t: Task) => statuses.find((s) => s.id === t.status_id)?.kind;

  async function add() {
    const s = firstTodo(statuses);
    if (!title.trim() || !s) return;
    await sb().from("tasks").insert({ title: title.trim(), status_id: s.id });
    setTitle("");
  }
  const group = (name: string, list: Task[], key: string) => list.length > 0 && (
    <section key={key} className="space-y-2">
      <h2 className="px-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">{name} · {list.length}</h2>
      {list.map((t) => <TaskRow key={t.id} t={t} subs={subs(t.id)} />)}
    </section>
  );

  return (
    <div className="flex h-full flex-col">
      <Header title="Tâches"><Link href="/tasks/settings" className="text-xl" aria-label="Personnaliser">⚙️</Link></Header>
      <div className="space-y-2 border-b border-neutral-200 px-3 py-2 dark:border-neutral-800">
        <div className="flex rounded-lg bg-neutral-100 p-0.5 text-sm dark:bg-neutral-800">
          {VIEWS.map(([k, l]) => <button key={k} onClick={() => setView(k)} className={`flex-1 rounded-md py-1 ${view === k ? "bg-white shadow dark:bg-neutral-700" : ""}`}>{l}</button>)}
        </div>
        <div className="flex gap-2">
          <input className={`${input} !py-1`} placeholder="Rechercher…" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className={sel} value={label} onChange={(e) => setLabel(e.target.value)}><option value="">Étiquette</option>{labels.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select>
          <button onClick={() => setMine(!mine)} className={`shrink-0 rounded-lg px-3 text-sm ${mine ? "bg-indigo-600 text-white" : "bg-neutral-100 dark:bg-neutral-800"}`}>Moi</button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {view === "list" && <div className="space-y-4">{statuses.map((s) => group(s.name, top.filter((t) => t.status_id === s.id), s.id))}</div>}
        {view === "project" && (
          <div className="space-y-4">
            {projects.map((p) => group(p.name, top.filter((t) => t.project_id === p.id), p.id))}
            {group("Sans projet", top.filter((t) => !t.project_id || !projects.some((p) => p.id === t.project_id)), "none")}
          </div>
        )}
        {view === "board" && (
          <div className="-mx-3 flex gap-3 overflow-x-auto px-3 pb-2">
            {statuses.map((s) => (
              <div key={s.id} className="w-72 shrink-0 space-y-2">
                <h2 className="flex items-center gap-2 px-1 text-sm font-semibold"><span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />{s.name} <span className="text-neutral-400">{top.filter((t) => t.status_id === s.id).length}</span></h2>
                {top.filter((t) => t.status_id === s.id).map((t) => (
                  <div key={t.id} className="space-y-1">
                    <TaskRow t={t} subs={subs(t.id)} />
                    <select className={`${sel} w-full`} value={t.status_id} onChange={(e) => sb().from("tasks").update({ status_id: e.target.value }).eq("id", t.id).then(() => {})}>
                      {statuses.map((x) => <option key={x.id} value={x.id}>→ {x.name}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
        {!top.length && <p className="pt-10 text-center text-neutral-500">{rows.length ? "Aucune tâche pour ce filtre." : "Aucune tâche. Ajoutez la première ci-dessous."}</p>}
        {view === "list" && top.length > 0 && !top.some((t) => kind(t) !== "done") && <p className="pt-4 text-center text-sm text-neutral-400">Tout est terminé 🎉</p>}
      </div>
      <div className="flex gap-2 border-t border-neutral-200 p-2 dark:border-neutral-800">
        <input className={input} placeholder="Nouvelle tâche" value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
        <button className={btn} onClick={add} disabled={!title.trim()}>＋</button>
      </div>
    </div>
  );
}
