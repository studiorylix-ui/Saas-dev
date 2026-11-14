import { PRIORITIES } from "./ui";
import type { Activity, Label, Profile, Status } from "./types";

type Ctx = { profiles: Profile[]; statuses: Status[]; labels: Label[] };

const dt = (v: unknown) => (v ? new Date(String(v)).toLocaleDateString("fr-FR") : "—");

// Transforme une ligne d'activité en phrases lisibles.
export function describe(a: Activity, c: Ctx): string[] {
  if (a.action === "created") return [`a créé « ${String(a.changes.title ?? "")} »`];
  const nm = (v: unknown) => c.profiles.find((p) => p.id === v)?.name ?? "—";
  const st = (v: unknown) => c.statuses.find((s) => s.id === v)?.name ?? "?";
  return Object.entries(a.changes).map(([k, [o, n]]) => {
    switch (k) {
      case "status_id": return `statut : ${st(o)} → ${st(n)}`;
      case "priority": return `priorité : ${PRIORITIES[Number(o)]} → ${PRIORITIES[Number(n)]}`;
      case "assignee": case "lead": case "owner": return `${k === "assignee" ? "assigné" : k === "lead" ? "responsable" : "propriétaire"} : ${nm(o)} → ${nm(n)}`;
      case "due": case "due_date": case "start_date": case "next_action_date": return `${k === "start_date" ? "début" : "échéance"} : ${dt(o)} → ${dt(n)}`;
      case "title": case "name": return `renommé : « ${o} » → « ${n} »`;
      case "description": return "a modifié la description";
      case "labels": return "a modifié les étiquettes";
      case "fields": return "a modifié des champs";
      case "status": case "stage": return `${k === "stage" ? "étape" : "statut"} : ${o} → ${n}`;
      case "amount": return `montant : ${o ?? "—"} → ${n ?? "—"}`;
      case "project_id": return "projet modifié";
      case "deal_id": return "affaire modifiée";
      case "parent_id": return "tâche parente modifiée";
      default: return `${k} modifié`;
    }
  });
}
