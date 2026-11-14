"use client";
import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import ActivityFeed from "@/components/ActivityFeed";
import Header from "@/components/Header";
import Icon from "@/components/Icon";
import LinkedPosts from "@/components/LinkedPosts";
import MdEditor from "@/components/MdEditor";
import { useRefs } from "@/components/Refs";
import TaskRow from "@/components/TaskRow";
import { sb } from "@/lib/supabase/client";
import { firstTodo } from "@/lib/tasks";
import { useTable } from "@/lib/useTable";
import { PROJECT_STATUS, day, iconBtn, input, section, sel } from "@/lib/ui";
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
  if (!p) return <div className="p-4 text-muted">Chargement…</div>;

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
      <Header title="Projet" back="/projects"><button className={iconBtn} aria-label="Supprimer" onClick={async () => { if (confirm("Supprimer ce projet ? Ses tâches sont conservées sans projet.")) { await sb().from("projects").delete().eq("id", id); router.replace("/projects"); } }}><Icon name="trash" size={18} className="text-muted" /></button></Header>
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 pb-8 pt-4">
        <input key={p.name} className="w-full bg-transparent text-[22px] font-semibold leading-tight tracking-[-0.025em] outline-none" defaultValue={p.name} onBlur={(e) => e.target.value.trim() && e.target.value !== p.name && upd({ name: e.target.value.trim() })} />
        <div>
          <div className="h-1 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-ink transition-[width] duration-200 ease-out" style={{ width: `${pct}%` }} /></div>
          <div className="mt-1.5 text-[12px] text-muted">{done}/{mine.length} tâches terminées · {pct}%</div>
        </div>
        <section className="grid grid-cols-2 gap-x-3 gap-y-3 text-[13px]">
          <label className="space-y-1"><span className="text-muted">Statut</span><select className={`${sel} w-full`} value={p.status} onChange={(e) => upd({ status: e.target.value })}>{PROJECT_STATUS.map((s) => <option key={s}>{s}</option>)}</select></label>
          <label className="space-y-1"><span className="text-muted">Responsable</span><select className={`${sel} w-full`} value={p.lead ?? ""} onChange={(e) => upd({ lead: e.target.value || null })}><option value="">—</option>{profiles.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
          <label className="space-y-1"><span className="text-muted">Début</span><input type="date" className={`${sel} w-full`} value={p.start_date ?? ""} onChange={(e) => upd({ start_date: e.target.value || null })} /></label>
          <label className="space-y-1"><span className="text-muted">Échéance</span><input type="date" className={`${sel} w-full`} value={p.due_date ?? ""} onChange={(e) => upd({ due_date: e.target.value || null })} /></label>
        </section>
        {chan && <Link href={`/chat?c=${chan.id}`} className="flex h-11 items-center gap-2.5 rounded-xl border border-line bg-surface px-3.5 text-[14px] active:bg-subtle"><Icon name="chat" size={17} className="text-muted" /><span className="flex-1">#{chan.name}</span><Icon name="chevron" size={16} className="text-muted" /></Link>}
        <section className="space-y-1"><h2 className={section}>Description</h2><MdEditor value={p.description} onSave={(v) => upd({ description: v })} placeholder="Objectif, périmètre, liens, stack…" /></section>

        <section className="space-y-2">
          <h2 className={section}>Jalons {mil.length > 0 && `· ${mil.filter((m) => m.done).length}/${mil.length}`}</h2>
          {mil.map((m) => (
            <div key={m.id} className="flex items-center gap-3 text-sm">
              <input type="checkbox" className="h-5 w-5" checked={m.done} onChange={(e) => sb().from("milestones").update({ done: e.target.checked }).eq("id", m.id).then(() => {})} />
              <span className={`flex-1 ${m.done ? "line-through opacity-50" : ""}`}>{m.title}</span>
              <input type="date" className={sel} value={m.due ?? ""} onChange={(e) => sb().from("milestones").update({ due: e.target.value || null }).eq("id", m.id).then(() => {})} />
              <button aria-label="Supprimer le jalon" className="inline-flex h-9 w-9 items-center justify-center text-muted" onClick={() => sb().from("milestones").delete().eq("id", m.id).then(() => {})}><Icon name="x" size={15} /></button>
            </div>
          ))}
          <input className={`${input} !py-1`} placeholder="Ajouter un jalon (ex : MVP, bêta…)" value={mi} onChange={(e) => setMi(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addMs()} />
          {mil.some((m) => m.due) && <p className="text-[12px] text-muted">Prochain : {day(mil.filter((m) => !m.done && m.due).sort((a, b) => a.due!.localeCompare(b.due!))[0]?.due ?? null) || "—"}</p>}
        </section>

        <section className="space-y-2">
          <h2 className={section}>Tâches</h2>
          {mine.length > 0 && <div className="divide-y divide-line overflow-hidden rounded-xl border border-line">{mine.map((t) => <TaskRow key={t.id} t={t} subs={tasks.filter((x) => x.parent_id === t.id)} />)}</div>}
          <input className={`${input} !py-1`} placeholder="Ajouter une tâche à ce projet" value={ti} onChange={(e) => setTi(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTask()} />
        </section>
        <section className="space-y-2"><h2 className={section}>Posts liés</h2><LinkedPosts type="project" id={id} /></section>
        <section className="space-y-2"><h2 className={section}>Activité</h2><ActivityFeed id={id} /></section>
      </div>
    </div>
  );
}
