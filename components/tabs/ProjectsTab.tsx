"use client";
import { useState } from "react";
import Avatar from "../Avatar";
import { roundBtn } from "../Header";
import Icon from "../Icon";
import { PushLink } from "../nav";
import { useRefs } from "../Refs";
import TabScaffold, { Skeleton } from "../TabScaffold";
import { db, useReady, useTable } from "@/lib/store";
import { STAGES, STAGE_PROB, btn, day, eur, input, overdue, seg, segItem } from "@/lib/ui";
import type { Deal, Project, Task } from "@/lib/types";

const STATUS_DOT: Record<string, string> = { idée: "#b5b5b5", "en cours": "#d08a1c", "en pause": "#8a8a8a", terminé: "#1f9d55" };

export default function ProjectsTab() {
  const { statuses, name } = useRefs();
  const { rows: projects } = useTable<Project>("projects");
  const { rows: tasks } = useTable<Task>("tasks");
  const { rows: deals } = useTable<Deal>("deals");
  const [tab, setTab] = useState<"projects" | "deals">("projects");
  const [title, setTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const ready = useReady("projects", "deals", "tasks");
  const isDone = (t: Task) => statuses.find((s) => s.id === t.status_id)?.kind === "done";

  function add() {
    const n = title.trim();
    if (!n) return;
    if (tab === "projects") {
      const p = db.insert<Project>("projects", { name: n, description: "", status: "en cours", lead: null, start_date: null, due_date: null });
      db.insert("channels", { name: n.toLowerCase().replace(/\s+/g, "-"), description: `Canal du projet ${n}`, project_id: p.id, kind: "channel", members: [] });
    } else db.insert("deals", { name: n, client: "", stage: "prospect", amount: null, description: "", next_action: "", next_action_date: null, owner: null });
    setTitle("");
  }
  const open = deals.filter((d) => d.stage !== "gagnée" && d.stage !== "perdue");
  const kpis: [string, number][] = [["Pipeline", open.reduce((s, d) => s + (d.amount ?? 0), 0)], ["Pondéré", open.reduce((s, d) => s + (d.amount ?? 0) * STAGE_PROB[d.stage], 0)], ["Gagné", deals.filter((d) => d.stage === "gagnée").reduce((s, d) => s + (d.amount ?? 0), 0)]];

  return (
    <TabScaffold title={tab === "projects" ? "Projets" : "Affaires"}
      actions={<button aria-label="Ajouter" onClick={() => setAdding(!adding)} className={`${roundBtn} ${adding ? "" : "btn-light !text-on-accent"}`}><Icon name={adding ? "x" : "plus"} size={19} stroke={2.2} /></button>}
      sub={<div className="space-y-2 px-4 pb-3">
        {adding && (
          <div className="rise flex gap-2 pb-1">
            <input autoFocus className={input} placeholder={tab === "projects" ? "Nouveau projet (crée aussi son canal)" : "Nouvelle affaire"} value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") add(); if (e.key === "Escape") setAdding(false); }} />
            <button className={`${btn} px-3.5`} onClick={add} disabled={!title.trim()}>Ajouter</button>
          </div>
        )}
        <div className={seg}>{(["projects", "deals"] as const).map((t) => <button key={t} onClick={() => setTab(t)} className={segItem(tab === t)}>{t === "projects" ? "Projets" : "Affaires"}</button>)}</div>
      </div>}>
      {!ready ? <Skeleton avatar={false} /> : <div>
        {tab === "projects" ? (!projects.length ? <p className="py-20 text-center text-[13px] text-muted">Aucun projet. Chaque projet crée aussi son canal de discussion.</p> :
          <div className="group-card mx-4 divide-y divide-line">
            {projects.map((p) => {
              const t = tasks.filter((x) => x.project_id === p.id && !x.parent_id);
              const done = t.filter(isDone).length;
              const pct = t.length ? Math.round((done / t.length) * 100) : 0;
              return (
                <PushLink key={p.id} to={{ k: "project", id: p.id }} className="rise block bg-surface px-4 py-3.5 active:bg-subtle">
                  <div className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 truncate text-[15px] font-medium">{p.name}</span>
                    {p.lead && <Avatar name={name(p.lead)} size={22} />}
                    <Icon name="chevron" size={16} className="text-muted/60" />
                  </div>
                  <div className="mt-2.5 flex items-center gap-3">
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-ink transition-[width] duration-200 ease-out" style={{ width: `${pct}%` }} /></div>
                    <span className="w-9 text-right text-[12px] tabular-nums text-muted">{pct}%</span>
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-[12px] text-muted">
                    <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full" style={{ background: STATUS_DOT[p.status] }} />{p.status}</span>
                    <span>{done}/{t.length} tâches</span>
                    {p.due_date && <span className={`inline-flex items-center gap-1 ${overdue(p.due_date) && p.status !== "terminé" ? "text-danger" : ""}`}><Icon name="calendar" size={12} />{day(p.due_date)}</span>}
                  </div>
                </PushLink>
              );
            })}
          </div>
        ) : (
          <div className="pb-4">
            <div className="group-card mx-4 grid grid-cols-3 divide-x divide-line">
              {kpis.map(([l, v]) => <div key={l} className="px-4 py-3"><div className="text-[11.5px] text-muted">{l}</div><div className="mt-0.5 text-[15px] font-semibold tabular-nums tracking-tight">{eur(v)}</div></div>)}
            </div>
            <div className="scroll-x flex snap-x gap-3 overflow-x-auto px-4 pt-3">
              {STAGES.map((s) => {
                const col = deals.filter((d) => d.stage === s);
                return (
                  <div key={s} className="w-[72vw] max-w-[280px] shrink-0 snap-start">
                    <h2 className="mb-2 flex items-baseline gap-2 text-[13px] font-medium capitalize">{s}<span className="font-normal normal-case text-muted">{col.length} · {eur(col.reduce((a, d) => a + (d.amount ?? 0), 0))}</span></h2>
                    <div className="space-y-2">
                      {col.map((d) => (
                        <PushLink key={d.id} to={{ k: "deal", id: d.id }} className="tap rise block group-card p-3">
                          <div className="flex items-start justify-between gap-2"><span className="text-[14.5px] font-medium">{d.name}</span>{d.amount != null && <span className="text-[13px] tabular-nums">{eur(d.amount)}</span>}</div>
                          {d.client && <div className="text-[12.5px] text-muted">{d.client}</div>}
                          {d.next_action && <div className={`mt-2 border-t border-line pt-2 text-[12px] ${overdue(d.next_action_date) ? "text-danger" : "text-muted"}`}>{d.next_action}{d.next_action_date && ` · ${day(d.next_action_date)}`}</div>}
                        </PushLink>
                      ))}
                      {!col.length && <div className="rounded-2xl border border-dashed border-line py-6 text-center text-[12px] text-muted">Vide</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>}
    </TabScaffold>
  );
}
