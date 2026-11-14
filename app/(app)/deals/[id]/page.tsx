"use client";
import { useState } from "react";
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
import { STAGES, STAGE_PROB, eur, iconBtn, input, section, sel } from "@/lib/ui";
import type { Deal, Task } from "@/lib/types";

export default function DealPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { statuses, profiles } = useRefs();
  const { rows: deals } = useTable<Deal>("deals");
  const { rows: tasks } = useTable<Task>("tasks");
  const [ti, setTi] = useState("");
  const d = deals.find((x) => x.id === id);
  if (!d) return <div className="p-4 text-muted">Chargement…</div>;

  const upd = (patch: Partial<Deal>) => sb().from("deals").update(patch).eq("id", id).then(() => {});
  const mine = tasks.filter((t) => t.deal_id === id && !t.parent_id);
  async function addTask() {
    const s = firstTodo(statuses);
    if (!ti.trim() || !s) return;
    await sb().from("tasks").insert({ title: ti.trim(), status_id: s.id, deal_id: id });
    setTi("");
  }

  return (
    <div className="flex h-full flex-col">
      <Header title="Affaire" back="/projects"><button className={iconBtn} aria-label="Supprimer" onClick={async () => { if (confirm("Supprimer cette affaire ?")) { await sb().from("deals").delete().eq("id", id); router.replace("/projects"); } }}><Icon name="trash" size={18} className="text-muted" /></button></Header>
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 pb-8 pt-4">
        <input key={d.name} className="w-full bg-transparent text-[22px] font-semibold leading-tight tracking-[-0.025em] outline-none" defaultValue={d.name} onBlur={(e) => e.target.value.trim() && e.target.value !== d.name && upd({ name: e.target.value.trim() })} />
        <section className="grid grid-cols-2 gap-x-3 gap-y-3 text-[13px]">
          <label className="space-y-1"><span className="text-muted">Client</span><input key={d.client} className={`${input} !py-1`} defaultValue={d.client} onBlur={(e) => e.target.value !== d.client && upd({ client: e.target.value })} /></label>
          <label className="space-y-1"><span className="text-muted">Montant (€)</span><input key={d.amount ?? ""} type="number" className={`${input} !py-1`} defaultValue={d.amount ?? ""} onBlur={(e) => upd({ amount: e.target.value === "" ? null : Number(e.target.value) })} /></label>
          <label className="space-y-1"><span className="text-muted">Étape</span><select className={`${sel} w-full`} value={d.stage} onChange={(e) => upd({ stage: e.target.value })}>{STAGES.map((s) => <option key={s}>{s}</option>)}</select></label>
          <label className="space-y-1"><span className="text-muted">Responsable</span><select className={`${sel} w-full`} value={d.owner ?? ""} onChange={(e) => upd({ owner: e.target.value || null })}><option value="">—</option>{profiles.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
        </section>
        {d.amount != null && <p className="text-[13px] text-muted">Valeur pondérée ({Math.round(STAGE_PROB[d.stage] * 100)} %) : <b>{eur(d.amount * STAGE_PROB[d.stage])}</b></p>}
        <section className="space-y-1">
          <h2 className={section}>Prochaine action</h2>
          <div className="flex gap-2"><input key={d.next_action} className={`${input} !py-1`} placeholder="Ex : envoyer le devis" defaultValue={d.next_action} onBlur={(e) => e.target.value !== d.next_action && upd({ next_action: e.target.value })} /><input type="date" className={sel} value={d.next_action_date ?? ""} onChange={(e) => upd({ next_action_date: e.target.value || null })} /></div>
        </section>
        <section className="space-y-1"><h2 className={section}>Notes</h2><MdEditor value={d.description} onSave={(v) => upd({ description: v })} placeholder="Contexte client, besoins, échanges…" /></section>
        <section className="space-y-2">
          <h2 className={section}>Tâches</h2>
          {mine.length > 0 && <div className="divide-y divide-line overflow-hidden rounded-xl border border-line">{mine.map((t) => <TaskRow key={t.id} t={t} subs={tasks.filter((x) => x.parent_id === t.id)} />)}</div>}
          <input className={`${input} !py-1`} placeholder="Ajouter une tâche à cette affaire" value={ti} onChange={(e) => setTi(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTask()} />
        </section>
        <section className="space-y-2"><h2 className={section}>Posts liés</h2><LinkedPosts type="deal" id={id} /></section>
        <section className="space-y-2"><h2 className={section}>Activité</h2><ActivityFeed id={id} /></section>
      </div>
    </div>
  );
}
