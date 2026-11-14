"use client";
import { useState } from "react";
import Header from "@/components/Header";
import { sb } from "@/lib/supabase/client";
import { useTable } from "@/lib/useTable";
import { btn, card, input } from "@/lib/ui";
import type { Project, Task } from "@/lib/types";

const STATUS = ["idée", "en cours", "en pause", "terminé"];

export default function Projects() {
  const { rows } = useTable<Project>("projects");
  const { rows: tasks } = useTable<Task>("tasks");
  const [name, setName] = useState("");

  async function add() {
    if (!name.trim()) return;
    await sb().from("projects").insert({ name: name.trim() });
    setName("");
  }

  return (
    <div className="flex h-full flex-col">
      <Header title="Projets" />
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {rows.map((p) => {
          const t = tasks.filter((x) => x.project_id === p.id);
          const done = t.filter((x) => x.status === "done").length;
          const pct = t.length ? Math.round((done / t.length) * 100) : 0; // avancement = tâches terminées
          return (
            <div key={p.id} className={card}>
              <div className="flex items-center justify-between gap-2">
                <b>{p.name}</b>
                <select className="rounded-lg bg-neutral-100 px-2 py-1 text-sm dark:bg-neutral-800" value={p.status} onChange={(e) => sb().from("projects").update({ status: e.target.value }).eq("id", p.id).then()}>
                  {STATUS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800"><div className="h-full bg-indigo-600" style={{ width: `${pct}%` }} /></div>
              <div className="mt-1 text-xs text-neutral-500">{done}/{t.length} tâches · {pct}%</div>
            </div>
          );
        })}
        {!rows.length && <p className="pt-10 text-center text-neutral-500">Aucun projet.</p>}
      </div>
      <div className="flex gap-2 border-t border-neutral-200 p-2 dark:border-neutral-800">
        <input className={input} placeholder="Nouveau projet" value={name} onChange={(e) => setName(e.target.value)} />
        <button className={btn} onClick={add} disabled={!name.trim()}>＋</button>
      </div>
    </div>
  );
}
