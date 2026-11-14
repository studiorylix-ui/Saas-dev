"use client";
import { useTable } from "@/lib/store";
import { describe } from "@/lib/activity";
import { ago } from "@/lib/ui";
import type { Activity } from "@/lib/types";
import { useRefs } from "./Refs";

export default function ActivityFeed({ id }: { id: string }) {
  const { profiles, statuses, labels, name } = useRefs();
  const { rows } = useTable<Activity>("activity");
  const mine = rows.filter((a) => a.entity_id === id);
  if (!mine.length) return <p className="text-[13px] text-muted">Aucune activité.</p>;
  return (
    <ul className="relative space-y-3 border-l border-line pl-4 text-[13px]">
      {mine.map((a) => (
        <li key={a.id} className="relative leading-snug text-muted"><span className="absolute -left-[19.5px] top-[5px] h-[7px] w-[7px] rounded-full bg-surface shadow-card" />
          <span className="font-medium text-ink">{name(a.actor)}</span> {describe(a, { profiles, statuses, labels }).join(" · ")} <span className="text-muted/70">· {ago(a.created_at)}</span>
        </li>
      ))}
    </ul>
  );
}
