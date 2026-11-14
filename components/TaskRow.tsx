"use client";
import Link from "next/link";
import { toggleTask } from "@/lib/tasks";
import { PCOLOR, day, overdue } from "@/lib/ui";
import type { Task } from "@/lib/types";
import { useRefs } from "./Refs";

export function StatusDot({ t }: { t: Task }) {
  const { statuses } = useRefs();
  const s = statuses.find((x) => x.id === t.status_id);
  const done = s?.kind === "done";
  return (
    <button aria-label={s?.name} onClick={() => toggleTask(t, statuses)} className="mt-0.5 h-5 w-5 shrink-0 rounded-full border-2" style={{ borderColor: s?.color, background: done ? s?.color : "transparent" }} />
  );
}

export default function TaskRow({ t, subs }: { t: Task; subs?: Task[] }) {
  const { statuses, labels, name } = useRefs();
  const done = statuses.find((x) => x.id === t.status_id)?.kind === "done";
  const sd = subs?.filter((x) => statuses.find((s) => s.id === x.status_id)?.kind === "done").length;
  return (
    <div className={`flex items-start gap-3 rounded-2xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900 ${done ? "opacity-50" : ""}`}>
      <StatusDot t={t} />
      <Link href={`/tasks/${t.id}`} className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-xs text-neutral-400">
          RYL-{t.num}
          {t.priority > 0 && <span style={{ color: PCOLOR[t.priority] }}>{"!".repeat(t.priority)}</span>}
        </div>
        <div className={done ? "line-through" : ""}>{t.title}</div>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
          {t.labels.map((id) => { const l = labels.find((x) => x.id === id); return l && <span key={id} className="rounded-full px-2 py-0.5 text-white" style={{ background: l.color }}>{l.name}</span>; })}
          {t.due && <span className={overdue(t.due) && !done ? "text-red-600" : "text-neutral-500"}>📅 {day(t.due)}</span>}
          {subs && subs.length > 0 && <span className="text-neutral-500">☑ {sd}/{subs.length}</span>}
          {t.assignee && <span className="rounded-full bg-neutral-100 px-2 py-0.5 dark:bg-neutral-800">@{name(t.assignee)}</span>}
        </div>
      </Link>
    </div>
  );
}
