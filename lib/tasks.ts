import { sb } from "./supabase/client";
import type { Status, Task } from "./types";

export const firstTodo = (s: Status[]) => s.find((x) => x.kind === "todo") ?? s[0];

// Rond cliquable : terminé <-> premier statut « à faire ».
export function toggleTask(t: Task, statuses: Status[]) {
  const cur = statuses.find((s) => s.id === t.status_id);
  const next = cur?.kind === "done" ? firstTodo(statuses) : statuses.find((s) => s.kind === "done");
  if (next) return sb().from("tasks").update({ status_id: next.id }).eq("id", t.id).then(() => {});
}
