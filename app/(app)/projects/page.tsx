"use client";
import { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import { useRefs } from "@/components/Refs";
import { sb } from "@/lib/supabase/client";
import { useTable } from "@/lib/useTable";
import { STAGES, STAGE_PROB, btn, card, day, eur, input, overdue } from "@/lib/ui";
import type { Deal, Project, Task } from "@/lib/types";

export default function Projects() {
  const { statuses, name } = useRefs();
  const { rows: projects } = useTable<Project>("projects");
  const { rows: tasks } = useTable<Task>("tasks");
  const { rows: deals } = useTable<Deal>("deals");
  const [tab, setTab] = useState<"projects" | "deals">("projects");
  const [title, setTitle] = useState("");
  const isDone = (t: Task) => statuses.find((s) => s.id === t.status_id)?.kind === "done";

  async function add() {
    const n = title.trim();
    if (!n) return;
    if (tab === "projects") {
      const { data } = await sb().from("projects").insert({ name: n }).select().single();
      if (data) await sb().from("channels").insert({ name: n.toLowerCase().replace(/\s+/g, "-"), description: `Canal du projet ${n}`, project_id: data.id });
    } else await sb().from("deals").insert({ name: n });
    setTitle("");
  }
  const open = deals.filter((d) => d.stage !== "gagnée" && d.stage !== "perdue");
  const pipeline = open.reduce((s, d) => s + (d.amount ?? 0), 0);
  const weighted = open.reduce((s, d) => s + (d.amount ?? 0) * STAGE_PROB[d.stage], 0);
  const won = deals.filter((d) => d.stage === "gagnée").reduce((s, d) => s + (d.amount ?? 0), 0);

  return (
    <div className="flex h-full flex-col">
      <Header title={tab === "projects" ? "Projets" : "Affaires"}>
        <div className="flex rounded-lg bg-neutral-100 p-0.5 text-sm dark:bg-neutral-800">
          {(["projects", "deals"] as const).map((t) => <button key={t} onClick={() => setTab(t)} className={`rounded-md px-3 py-1 ${tab === t ? "bg-white shadow dark:bg-neutral-700" : ""}`}>{t === "projects" ? "Projets" : "Affaires"}</button>)}
        </div>
      </Header>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {tab === "projects" ? (
          <div className="space-y-2">
            {projects.map((p) => {
              const t = tasks.filter((x) => x.project_id === p.id && !x.parent_id);
              const done = t.filter(isDone).length;
              const pct = t.length ? Math.round((done / t.length) * 100) : 0;
              return (
                <Link key={p.id} href={`/projects/${p.id}`} className={`${card} block`}>
                  <div className="flex items-center justify-between gap-2"><b>{p.name}</b><span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs dark:bg-neutral-800">{p.status}</span></div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800"><div className="h-full bg-indigo-600" style={{ width: `${pct}%` }} /></div>
                  <div className="mt-1 flex justify-between text-xs text-neutral-500"><span>{done}/{t.length} tâches · {pct}%</span><span className={overdue(p.due_date) && p.status !== "terminé" ? "text-red-600" : ""}>{p.lead ? `@${name(p.lead)} ` : ""}{p.due_date ? `📅 ${day(p.due_date)}` : ""}</span></div>
                </Link>
              );
            })}
            {!projects.length && <p className="pt-10 text-center text-neutral-500">Aucun projet.</p>}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              {[["Pipeline", pipeline], ["Pondéré", weighted], ["Gagné", won]].map(([l, v]) => <div key={l as string} className={card}><div className="text-xs text-neutral-500">{l}</div><div className="font-semibold">{eur(v as number)}</div></div>)}
            </div>
            <div className="-mx-3 flex gap-3 overflow-x-auto px-3 pb-2">
              {STAGES.map((s) => {
                const col = deals.filter((d) => d.stage === s);
                return (
                  <div key={s} className="w-64 shrink-0 space-y-2">
                    <h2 className="px-1 text-sm font-semibold capitalize">{s} <span className="text-neutral-400">{col.length} · {eur(col.reduce((a, d) => a + (d.amount ?? 0), 0))}</span></h2>
                    {col.map((d) => (
                      <Link key={d.id} href={`/deals/${d.id}`} className={`${card} block`}>
                        <b>{d.name}</b><div className="text-xs text-neutral-500">{d.client}</div>
                        {d.amount != null && <div className="mt-1 text-sm">{eur(d.amount)}</div>}
                        {d.next_action && <div className={`mt-1 text-xs ${overdue(d.next_action_date) ? "text-red-600" : "text-neutral-500"}`}>→ {d.next_action} {d.next_action_date && `(${day(d.next_action_date)})`}</div>}
                      </Link>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      <div className="flex gap-2 border-t border-neutral-200 p-2 dark:border-neutral-800">
        <input className={input} placeholder={tab === "projects" ? "Nouveau projet (crée aussi son canal)" : "Nouvelle affaire"} value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
        <button className={btn} onClick={add} disabled={!title.trim()}>＋</button>
      </div>
    </div>
  );
}
