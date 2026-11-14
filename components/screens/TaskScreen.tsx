"use client";
import { useState } from "react";
import ActivityFeed from "../ActivityFeed";
import Avatar from "../Avatar";
import Composer from "../Composer";
import FieldInput from "../FieldInput";
import Header from "../Header";
import { ask } from "../Overlays";
import { PushLink, useNav } from "../nav";
import Icon from "../Icon";
import Markdown from "../Markdown";
import MdEditor from "../MdEditor";
import { useRefs } from "../Refs";
import { StatusDot } from "../TaskRow";
import { firstTodo } from "@/lib/tasks";
import { db, useTable } from "@/lib/store";
import { PRIORITIES, ago, iconBtn, input, pill, plain, section } from "@/lib/ui";
import type { Comment, Deal, Project, Task } from "@/lib/types";

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex min-h-11 items-center justify-between gap-3 pl-3.5 pr-1.5"><span className="shrink-0 text-[14px] text-muted">{label}</span><div className="flex min-w-0 justify-end">{children}</div></div>
);

export default function TaskScreen({ id }: { id: string }) {
  const { back } = useNav();
  const { statuses, labels, fieldDefs, profiles, name } = useRefs();
  const { rows } = useTable<Task>("tasks");
  const { rows: projects } = useTable<Project>("projects");
  const { rows: deals } = useTable<Deal>("deals");
  const { rows: comments } = useTable<Comment>("task_comments", "created_at", true);
  const [sub, setSub] = useState("");
  const t = rows.find((x) => x.id === id);
  if (!t) return <><Header title="" /><p className="p-4 text-[13px] text-muted">Tâche introuvable.</p></>;

  const subs = rows.filter((x) => x.parent_id === id);
  const upd = (patch: Partial<Task>) => db.update("tasks", id, patch);
  const toggleLabel = (l: string) => upd({ labels: t.labels.includes(l) ? t.labels.filter((x) => x !== l) : [...t.labels, l] });
  function addSub() {
    const s = firstTodo(statuses);
    if (!sub.trim() || !s) return;
    db.insert("tasks", { title: sub.trim(), status_id: s.id, parent_id: id, project_id: t!.project_id, priority: 0, labels: [], fields: {}, description: "", assignee: null, due: null, deal_id: null });
    setSub("");
  }
  async function del() {
    if (!(await ask({ title: "Supprimer cette tâche et ses sous-tâches ?", confirm: "Supprimer la tâche", danger: true }))) return;
    db.remove("tasks", id);
    back();
  }

  return (
    <div className="flex h-full flex-col">
      <Header title={`RYL-${t.num ?? "…"}`}><button className={iconBtn} aria-label="Supprimer" onClick={del}><Icon name="trash" size={18} className="text-muted" /></button></Header>
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 pb-8 pt-4">
        <input key={t.title} className="w-full bg-transparent text-[22px] font-semibold leading-tight tracking-[-0.025em] outline-none" defaultValue={t.title} onBlur={(e) => e.target.value.trim() && e.target.value !== t.title && upd({ title: e.target.value.trim() })} />

        <section className="divide-y divide-line rounded-xl border border-line bg-surface">
          <Row label="Statut"><select className={plain} value={t.status_id} onChange={(e) => upd({ status_id: e.target.value })}>{statuses.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Row>
          <Row label="Priorité"><select className={plain} value={t.priority} onChange={(e) => upd({ priority: Number(e.target.value) })}>{PRIORITIES.map((p, i) => <option key={p} value={i}>{p}</option>)}</select></Row>
          <Row label="Assigné à"><select className={plain} value={t.assignee ?? ""} onChange={(e) => upd({ assignee: e.target.value || null })}><option value="">Personne</option>{profiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Row>
          <Row label="Échéance"><input type="date" className={plain} value={t.due ?? ""} onChange={(e) => upd({ due: e.target.value || null })} /></Row>
          <Row label="Projet"><select className={plain} value={t.project_id ?? ""} onChange={(e) => upd({ project_id: e.target.value || null })}><option value="">Aucun</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Row>
          <Row label="Affaire"><select className={plain} value={t.deal_id ?? ""} onChange={(e) => upd({ deal_id: e.target.value || null })}><option value="">Aucune</option>{deals.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></Row>
          {fieldDefs.map((d) => <Row key={d.id} label={d.name}><FieldInput def={d} value={t.fields[d.id]} onChange={(v) => upd({ fields: { ...t.fields, [d.id]: v } })} /></Row>)}
        </section>

        <section className="flex flex-wrap gap-1.5">
          {labels.map((l) => <button key={l.id} onClick={() => toggleLabel(l.id)} className={`${pill(t.labels.includes(l.id))} gap-1.5`}><span className="h-2 w-2 rounded-full" style={{ background: l.color }} />{l.name}</button>)}
          {!labels.length && <span className="text-[13px] text-muted">Aucune étiquette (⚙️ dans Tâches).</span>}
        </section>

        <section className="space-y-1"><h2 className={section}>Description</h2><MdEditor value={t.description} onSave={(v) => upd({ description: v })} placeholder="Contexte, critères d'acceptation, liens…" /></section>

        {!t.parent_id && (
          <section className="space-y-2">
            <h2 className={section}>Sous-tâches {subs.length > 0 && `· ${subs.length}`}</h2>
            {subs.length > 0 && <div className="divide-y divide-line rounded-xl border border-line bg-surface">{subs.map((s) => <div key={s.id} className="flex min-h-11 items-center gap-3 px-3.5"><StatusDot t={s} /><PushLink to={{ k: "task", id: s.id }} className="flex-1 py-2.5 text-[14.5px]">{s.title}</PushLink></div>)}</div>}
            <div className="flex gap-2"><input className={`${input} !py-1`} placeholder="Ajouter une sous-tâche" value={sub} onChange={(e) => setSub(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addSub()} /></div>
          </section>
        )}

        <section className="space-y-2">
          <h2 className={section}>Commentaires</h2>
          {comments.filter((c) => c.task_id === id).map((c) => (
            <div key={c.id} className="flex gap-2.5"><Avatar name={name(c.author)} size={26} /><div className="min-w-0 flex-1"><div className="text-[13px]"><b className="font-semibold">{name(c.author)}</b> <span className="text-muted">{ago(c.created_at)}</span></div><Markdown text={c.body} /></div></div>
          ))}
          <div className="overflow-hidden rounded-xl border border-line"><Composer flat placeholder="Commenter… (@mention)" onSend={(body) => { db.insert("task_comments", { task_id: id, body }); }} /></div>
        </section>

        <section className="space-y-2"><h2 className={section}>Activité</h2><ActivityFeed id={id} /></section>
      </div>
    </div>
  );
}
