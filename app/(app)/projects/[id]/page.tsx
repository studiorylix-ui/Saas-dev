"use client";
import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import ActivityFeed from "@/components/ActivityFeed";
import Header from "@/components/Header";
import LinkedPosts from "@/components/LinkedPosts";
import MdEditor from "@/components/MdEditor";
import { useRefs } from "@/components/Refs";
import TaskRow from "@/components/TaskRow";
import { sb } from "@/lib/supabase/client";
import { firstTodo } from "@/lib/tasks";
import { useTable } from "@/lib/useTable";
import { PROJECT_STATUS, day, input, sel } from "@/lib/ui";
import type { Milestone, Project, Task } from "@/lib/types";

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { statuses, profiles, channels } = useRefs();
  const { rows: projects } = useTable<Project>("projects");
  const { rows: tasks } = useTable<Task>("tasks");
  const { rows: ms } = useTable<Milestone>("milestones", "created_at", true);
  const [ti, setTi] = useState("");
  const [mi, setMi] = useState("");
  const p = projects.find((x) => x.id === id);
  if (!p) return <div className="p-4 text-neutral-500">Chargement…</div>;

  const mine = tasks.filter((t) => t.project_id === id && !t.parent_id);
  const done = mine.filter((t) => statuses.find((s) => s.id === t.status_id)?.kind === "done").length;
  const pct = mine.length ? Math.round((done / mine.length) * 100) : 0;
  const mil = ms.filter((m) => m.project_id === id);
  const chan = channels.find((c) => c.project_id === id);
  const upd = (patch: Partial<Project>) => sb().from("projects").update(patch).eq("id", id).then(() => {});
  async function addTask() {
    const s = firstTodo(statuses);
    if (!ti.trim() || !s) return;
    await sb().from("tasks").insert({ title: ti.trim(), status_id: s.id, project_id: id });
    setTi("");
  }
  async function addMs() {
    if (!mi.trim()) return;
    await sb().from("milestones").insert({ project_id: id, title: mi.trim() });
    setMi("");
  }

  return (
    <div className="flex h-full flex-col">
      <Header title="Projet" back="/projects"><button className="text-sm text-red-600" onClick={async () => { if (confirm("Supprimer ce projet ? Ses tâches sont conservées sans projet.")) { await sb().from("projects").delete().eq("id", id); router.replace("/projects"); } }}>Supprimer</button></Header>
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
        <input key={p.name} className={`${input} !border-transparent !px-0 text-xl font-semibold`} defaultValue={p.name} onBlur={(e) => e.target.value.trim() && e.target.value !== p.name && upd({ name: e.target.value.trim() })} />
        <div>
          <div className="h-2 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800"><div className="h-full bg-indigo-600" style={{ width: `${pct}%` }} /></div>
          <div className="mt-1 text-xs text-neutral-500">{done}/{mine.length} tâches terminées · {pct}%</div>
        </div>
        <section className="grid grid-cols-2 gap-2 text-sm">
          <label className="space-y-1"><span className="text-neutral-500">Statut</span><select className={`${sel} w-full`} value={p.status} onChange={(e) => upd({ status: e.target.value })}>{PROJECT_STATUS.map((s) => <option key={s}>{s}</option>)}</select></label>
          <label className="space-y-1"><span className="text-neutral-500">Responsable</span><select className={`${sel} w-full`} value={p.lead ?? ""} onChange={(e) => upd({ lead: e.target.value || null })}><option value="">—</option>{profiles.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
          <label className="space-y-1"><span className="text-neutral-500">Début</span><input type="date" className={`${sel} w-full`} value={p.start_date ?? ""} onChange={(e) => upd({ start_date: e.target.value || null })} /></label>
          <label className="space-y-1"><span className="text-neutral-500">Échéance</span><input type="date" className={`${sel} w-full`} value={p.due_date ?? ""} onChange={(e) => upd({ due_date: e.target.value || null })} /></label>
        </section>
        {chan && <Link href={`/chat?c=${chan.id}`} className="block rounded-xl bg-indigo-50 px-3 py-2 text-sm text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200">💬 Canal #{chan.name}</Link>}
        <section className="space-y-1"><h2 className="text-sm font-semibold">Description</h2><MdEditor value={p.description} onSave={(v) => upd({ description: v })} placeholder="Objectif, périmètre, liens, stack…" /></section>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold">Jalons {mil.length > 0 && `· ${mil.filter((m) => m.done).length}/${mil.length}`}</h2>
          {mil.map((m) => (
            <div key={m.id} className="flex items-center gap-3 text-sm">
              <input type="checkbox" className="h-5 w-5" checked={m.done} onChange={(e) => sb().from("milestones").update({ done: e.target.checked }).eq("id", m.id).then(() => {})} />
              <span className={`flex-1 ${m.done ? "line-through opacity-50" : ""}`}>{m.title}</span>
              <input type="date" className={sel} value={m.due ?? ""} onChange={(e) => sb().from("milestones").update({ due: e.target.value || null }).eq("id", m.id).then(() => {})} />
              <button onClick={() => sb().from("milestones").delete().eq("id", m.id).then(() => {})}>✕</button>
            </div>
          ))}
          <input className={`${input} !py-1`} placeholder="Ajouter un jalon (ex : MVP, bêta…)" value={mi} onChange={(e) => setMi(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addMs()} />
          {mil.some((m) => m.due) && <p className="text-xs text-neutral-400">Prochain : {day(mil.filter((m) => !m.done && m.due).sort((a, b) => a.due!.localeCompare(b.due!))[0]?.due ?? null) || "—"}</p>}
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold">Tâches</h2>
          {mine.map((t) => <TaskRow key={t.id} t={t} subs={tasks.filter((x) => x.parent_id === t.id)} />)}
          <input className={`${input} !py-1`} placeholder="Ajouter une tâche à ce projet" value={ti} onChange={(e) => setTi(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTask()} />
        </section>
        <section className="space-y-2"><h2 className="text-sm font-semibold">Posts liés</h2><LinkedPosts type="project" id={id} /></section>
        <section className="space-y-2"><h2 className="text-sm font-semibold">Activité</h2><ActivityFeed id={id} /></section>
      </div>
    </div>
  );
}
