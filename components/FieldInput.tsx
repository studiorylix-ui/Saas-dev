"use client";
import { input, sel } from "@/lib/ui";
import type { FieldDef } from "@/lib/types";

type V = string | number | boolean | undefined;

// Champ personnalisé de tâche, selon son type.
export default function FieldInput({ def, value, onChange }: { def: FieldDef; value: V; onChange: (v: string | number | boolean) => void }) {
  if (def.type === "checkbox") return <input type="checkbox" className="h-5 w-5" checked={!!value} onChange={(e) => onChange(e.target.checked)} />;
  if (def.type === "select") return <select className={sel} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)}><option value="">—</option>{def.options.map((o) => <option key={o}>{o}</option>)}</select>;
  return (
    <input className={`${input} !py-1`} type={def.type === "number" ? "number" : def.type === "date" ? "date" : "text"} defaultValue={String(value ?? "")}
      onBlur={(e) => e.target.value !== String(value ?? "") && onChange(def.type === "number" && e.target.value !== "" ? Number(e.target.value) : e.target.value)} />
  );
}
