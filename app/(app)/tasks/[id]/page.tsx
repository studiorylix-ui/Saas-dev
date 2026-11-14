"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ActivityFeed from "@/components/ActivityFeed";
import Composer from "@/components/Composer";
import FieldInput from "@/components/FieldInput";
import Header from "@/components/Header";
import Markdown from "@/components/Markdown";
import MdEditor from "@/components/MdEditor";
import { useRefs } from "@/components/Refs";
import { StatusDot } from "@/components/TaskRow";
import { sb } from "@/lib/supabase/client";
import { firstTodo } from "@/lib/tasks";
import { useTable } from "@/lib/useTable";
import { PRIORITIES, ago, input, sel } from "@/lib/ui";
import type { Comment, Deal, Project, Task } from "@/lib/types";

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex items-center justify-between gap-3 py-1.5"><span className="w-28 shrink-0 text-sm text-neutral-500">{label}</span><div className="min-w-0 flex-1 text-right">{children}</div></div>
);

export default function TaskPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { statuses, labels, fieldDefs, profiles, name } = useRefs();
  const { rows } = useTable<Task>("tasks");
  const { rows: projects } = useTable<Project>("projects");
  const { rows: deals } = useTable<Deal>("deals");
  const { rows: comments } = useTable<Comment>("task_comments", "created_at", true);
  const [sub, setSub] = useState("");
  const t = rows.find((x) => x.id === id);
  if (!t) return <div className="p-4 text-neutral-500">Chargement…</div>;

  const subs = rows.filter((x) => x.parent_id === id);
  const upd = (patch: Partial<Task>) => sb().from("tasks").update(patch).eq("id", id).then(() => {});
  const toggleLabel = (l: string) => upd({ labels: t.labels.includes(l) ? t.labels.filter((x) => x !== l) : [...t.labels, l] });
  async function addSub() {
    const s = firstTodo(statuses);
    if (!sub.trim() || !s) return;
    await sb().from("tasks").insert({ title: sub.trim(), status_id: s.id, parent_id: id, project_id: t!.project_id });
    setSub("");
  }
  async function del() {
    if (!confirm("Supprimer cette tâche et ses sous-tâches ?")) return;
    await sb().from("tasks").delete().eq("id", id);
    router.replace("/tasks");
  }

  return (
    <div className="flex h-full flex-col">
      <Header title={`RYL-${t.num}`} back={t.parent_id ? `/tasks/${t.parent_id}` : "/tasks"}><button className="text-sm text-red-600" onClick={del}>Supprimer</button></Header>
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
        <input key={t.title} className={`${input} !border-transparent !px-0 text-xl font-semibold`} defaultValue={t.title} onBlur={(e) => e.target.value.trim() && e.target.value !== t.title && upd({ title: e.target.value.trim() })} />

        <section className="divide-y divide-neutral-100 dark:divide-neutral-800">
          <Row label="Statut"><select className={sel} value={t.status_id} onChange={(e) => upd({ status_id: e.target.value })}>{statuses.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Row>
          <Row label="Priorité"><select className={sel} value={t.priority} onChange={(e) => upd({ priority: Number(e.target.value) })}>{PRIORITIES.map((p, i) => <option key={p} value={i}>{p}</option>)}</select></Row>
          <Row label="Assigné à"><select className={sel} value={t.assignee ?? ""} onChange={(e) => upd({ assignee: e.target.value || null })}><option value="">Personne</option>{profiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Row>
          <Row label="Échéance"><input type="date" className={sel} value={t.due ?? ""} onChange={(e) => upd({ due: e.target.value || null })} /></Row>
          <Row label="Projet"><select className={sel} value={t.project_id ?? ""} onChange={(e) => upd({ project_id: e.target.value || null })}><option value="">Aucun</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Row>
          <Row label="Affaire"><select className={sel} value={t.deal_id ?? ""} onChange={(e) => upd({ deal_id: e.target.value || null })}><option value="">Aucune</option>{deals.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></Row>
          {fieldDefs.map((d) => <Row key={d.id} label={d.name}><FieldInput def={d} value={t.fields[d.id]} onChange={(v) => upd({ fields: { ...t.fields, [d.id]: v } })} /></Row>)}
        </section>

        <section className="flex flex-wrap gap-2">
          {labels.map((l) => <button key={l.id} onClick={() => toggleLabel(l.id)} className="rounded-full border px-3 py-1 text-sm" style={t.labels.includes(l.id) ? { background: l.color, borderColor: l.color, color: "white" } : { borderColor: l.color, color: l.color }}>{l.name}</button>)}
          {!labels.length && <span className="text-sm text-neutral-400">Aucune étiquette (⚙️ dans Tâches).</span>}
        </section>

        <section className="space-y-1"><h2 className="text-sm font-semibold">Description</h2><MdEditor value={t.description} onSave={(v) => upd({ description: v })} placeholder="Contexte, critères d'acceptation, liens…" /></section>

        {!t.parent_id && (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold">Sous-tâches {subs.length > 0 && `· ${subs.length}`}</h2>
            {subs.map((s) => <div key={s.id} className="flex items-center gap-3"><StatusDot t={s} /><a href={`/tasks/${s.id}`} className="flex-1">{s.title}</a></div>)}
            <div className="flex gap-2"><input className={`${input} !py-1`} placeholder="Ajouter une sous-tâche" value={sub} onChange={(e) => setSub(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addSub()} /></div>
          </section>
        )}

        <section className="space-y-2">
          <h2 className="text-sm font-semibold">Commentaires</h2>
          {comments.filter((c) => c.task_id === id).map((c) => (
            <div key={c.id} className="rounded-xl bg-neutral-100 p-2 dark:bg-neutral-800"><div className="text-xs text-neutral-500"><b>{name(c.author)}</b> · {ago(c.created_at)}</div><Markdown text={c.body} /></div>
          ))}
          <div className="-mx-4"><Composer placeholder="Commenter… (@mention)" onSend={async (body) => { await sb().from("task_comments").insert({ task_id: id, body }); }} /></div>
        </section>

        <section className="space-y-2"><h2 className="text-sm font-semibold">Activité</h2><ActivityFeed id={id} /></section>
      </div>
    </div>
  );
}
