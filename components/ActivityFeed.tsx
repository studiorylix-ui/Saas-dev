"use client";
import { useTable } from "@/lib/useTable";
import { describe } from "@/lib/activity";
import { ago } from "@/lib/ui";
import type { Activity } from "@/lib/types";
import { useRefs } from "./Refs";

export default function ActivityFeed({ id }: { id: string }) {
  const { profiles, statuses, labels, name } = useRefs();
  const { rows } = useTable<Activity>("activity");
  const mine = rows.filter((a) => a.entity_id === id);
  if (!mine.length) return <p className="text-sm text-neutral-400">Aucune activité.</p>;
  return (
    <ul className="space-y-1.5 text-sm">
      {mine.map((a) => (
        <li key={a.id} className="text-neutral-600 dark:text-neutral-400">
          <b className="text-neutral-800 dark:text-neutral-200">{name(a.actor)}</b> {describe(a, { profiles, statuses, labels }).join(" · ")} <span className="text-xs text-neutral-400">{ago(a.created_at)}</span>
        </li>
      ))}
    </ul>
  );
}
