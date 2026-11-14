"use client";
import Link from "next/link";
import { toggleTask } from "@/lib/tasks";
import { PCOLOR, day, overdue } from "@/lib/ui";
import type { Task } from "@/lib/types";
import Avatar from "./Avatar";
import Icon from "./Icon";
import { useRefs } from "./Refs";

// Rond de statut (zone tactile 44 px) : terminé <-> à faire.
export function StatusDot({ t }: { t: Task }) {
  const { statuses } = useRefs();
  const s = statuses.find((x) => x.id === t.status_id);
  const done = s?.kind === "done";
  const active = s?.kind === "active";
  return (
    <button aria-label={`Statut : ${s?.name}`} onClick={() => toggleTask(t, statuses)} className="-m-3 inline-flex h-11 w-11 shrink-0 items-center justify-center">
      <span className="relative inline-flex h-[18px] w-[18px] items-center justify-center rounded-full border-[1.5px]" style={{ borderColor: s?.color, background: done ? s?.color : "transparent" }}>
        {active && <span className="h-2 w-2 rounded-full" style={{ background: s?.color }} />}
        {done && <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>}
      </span>
    </button>
  );
}

const Prio = ({ p }: { p: number }) => (
  <span aria-label={`Priorité ${p}`} className="inline-flex h-3 items-end gap-[2px]">
    {[1, 2, 3].map((i) => <span key={i} className="w-[3px] rounded-[1px]" style={{ height: 4 + i * 2.5, background: p >= 4 ? PCOLOR[4] : i <= p ? PCOLOR[p] : "#e2e2e2" }} />)}
  </span>
);

// Ligne de tâche façon Linear : statut, identifiant, titre, méta discrètes.
export default function TaskRow({ t, subs }: { t: Task; subs?: Task[] }) {
  const { statuses, labels, name } = useRefs();
  const done = statuses.find((x) => x.id === t.status_id)?.kind === "done";
  const sd = subs?.filter((x) => statuses.find((s) => s.id === x.status_id)?.kind === "done").length;
  return (
    <div className="flex items-start gap-3 bg-surface px-4 py-3">
      <div className="pt-[1px]"><StatusDot t={t} /></div>
      <Link href={`/tasks/${t.id}`} className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={`min-w-0 flex-1 truncate text-[15px] ${done ? "text-muted line-through decoration-muted/50" : ""}`}>{t.title}</span>
          {t.assignee && <Avatar name={name(t.assignee)} size={22} />}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12px] text-muted">
          <span className="font-mono text-[11.5px] tracking-tight">RYL-{t.num}</span>
          {t.priority > 0 && <Prio p={t.priority} />}
          {t.labels.map((id) => { const l = labels.find((x) => x.id === id); return l && <span key={id} className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full" style={{ background: l.color }} />{l.name}</span>; })}
          {t.due && <span className={`inline-flex items-center gap-1 ${overdue(t.due) && !done ? "text-[#d93636]" : ""}`}><Icon name="calendar" size={12} />{day(t.due)}</span>}
          {subs && subs.length > 0 && <span className="inline-flex items-center gap-1"><Icon name="check" size={12} />{sd}/{subs.length}</span>}
        </div>
      </Link>
    </div>
  );
}
