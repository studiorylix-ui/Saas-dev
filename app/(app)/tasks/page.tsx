"use client";
import { useState } from "react";
import Header from "@/components/Header";
import { sb } from "@/lib/supabase/client";
import { useTable } from "@/lib/useTable";
import { btn, card, input } from "@/lib/ui";
import type { Deal, Profile, Project, Task } from "@/lib/types";

const NEXT = { todo: "doing", doing: "done", done: "todo" } as const;
const ICON = { todo: "○", doing: "◐", done: "●" } as const;
const STAGES = ["prospect", "devis", "négociation", "gagnée", "perdue"];

export default function Tasks() {
  const [tab, setTab] = useState<"tasks" | "deals">("tasks");
  const { rows: tasks } = useTable<Task>("tasks");
  const { rows: deals } = useTable<Deal>("deals");
  const { rows: projects } = useTable<Project>("projects");
  const { rows: profiles } = useTable<Profile>("profiles", "name", true);
  const [title, setTitle] = useState("");
  const [project, setProject] = useState("");
  const [assignee, setAssignee] = useState("");
  const [client, setClient] = useState("");

  const who = (id: string | null) => profiles.find((p) => p.id === id)?.name;

  async function addTask() {
    if (!title.trim()) return;
    await sb().from("tasks").insert({ title: title.trim(), project_id: project || null, assignee: assignee || null });
    setTitle("");
  }
  async function addDeal() {
    if (!title.trim()) return;
    await sb().from("deals").insert({ name: title.trim(), client });
    setTitle(""); setClient("");
  }
  const sorted = [...tasks].sort((a, b) => Number(a.status === "done") - Number(b.status === "done"));

  return (
    <div className="flex h-full flex-col">
      <Header title={tab === "tasks" ? "Tâches" : "Affaires"}>
        <div className="flex rounded-lg bg-neutral-100 p-0.5 text-sm dark:bg-neutral-800">
          {(["tasks", "deals"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`rounded-md px-3 py-1 ${tab === t ? "bg-white shadow dark:bg-neutral-700" : ""}`}>{t === "tasks" ? "Tâches" : "Affaires"}</button>
          ))}
        </div>
      </Header>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {tab === "tasks" ? sorted.map((t) => (
          <div key={t.id} className={`${card} flex items-start gap-3 ${t.status === "done" ? "opacity-50" : ""}`}>
            <button className="text-2xl leading-none text-indigo-600" onClick={() => sb().from("tasks").update({ status: NEXT[t.status] }).eq("id", t.id).then()}>{ICON[t.status]}</button>
            <div className="flex-1">
              <div className={t.status === "done" ? "line-through" : ""}>{t.title}</div>
              <div className="text-xs text-neutral-500">{[projects.find((p) => p.id === t.project_id)?.name, who(t.assignee) && `@${who(t.assignee)}`].filter(Boolean).join(" · ")}</div>
            </div>
            <button className="text-neutral-400" onClick={() => sb().from("tasks").delete().eq("id", t.id).then()}>✕</button>
          </div>
        )) : deals.map((d) => (
          <div key={d.id} className={card}>
            <div className="flex items-center justify-between gap-2">
              <div><b>{d.name}</b><div className="text-xs text-neutral-500">{d.client}</div></div>
              <select className="rounded-lg bg-neutral-100 px-2 py-1 text-sm dark:bg-neutral-800" value={d.stage} onChange={(e) => sb().from("deals").update({ stage: e.target.value }).eq("id", d.id).then()}>
                {STAGES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
        ))}
        {!(tab === "tasks" ? tasks : deals).length && <p className="pt-10 text-center text-neutral-500">Rien ici pour l&apos;instant.</p>}
      </div>
      <div className="space-y-2 border-t border-neutral-200 p-2 dark:border-neutral-800">
        {tab === "tasks" ? (
          <div className="flex gap-2">
            <select className={`${input} !w-auto`} value={project} onChange={(e) => setProject(e.target.value)}><option value="">Projet</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
            <select className={`${input} !w-auto`} value={assignee} onChange={(e) => setAssignee(e.target.value)}><option value="">Pour</option>{profiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
          </div>
        ) : (
          <input className={input} placeholder="Client" value={client} onChange={(e) => setClient(e.target.value)} />
        )}
        <div className="flex gap-2">
          <input className={input} placeholder={tab === "tasks" ? "Nouvelle tâche" : "Nouvelle affaire"} value={title} onChange={(e) => setTitle(e.target.value)} />
          <button className={btn} onClick={tab === "tasks" ? addTask : addDeal} disabled={!title.trim()}>＋</button>
        </div>
      </div>
    </div>
  );
}
