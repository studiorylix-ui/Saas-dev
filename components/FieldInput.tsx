"use client";
import { plain } from "@/lib/ui";
import type { FieldDef } from "@/lib/types";

type V = string | number | boolean | undefined;

// Champ personnalisé de tâche, selon son type.
export default function FieldInput({ def, value, onChange }: { def: FieldDef; value: V; onChange: (v: string | number | boolean) => void }) {
  if (def.type === "checkbox") return <input type="checkbox" className="mr-2 h-5 w-5 accent-ink" checked={!!value} onChange={(e) => onChange(e.target.checked)} />;
  if (def.type === "select") return <select className={plain} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)}><option value="">—</option>{def.options.map((o) => <option key={o}>{o}</option>)}</select>;
  return (
    <input className="h-9 w-40 rounded-lg bg-transparent px-2 text-right text-[14px] outline-none placeholder:text-muted/50 focus:bg-subtle" placeholder="—" type={def.type === "number" ? "number" : def.type === "date" ? "date" : "text"} defaultValue={String(value ?? "")}
      onBlur={(e) => e.target.value !== String(value ?? "") && onChange(def.type === "number" && e.target.value !== "" ? Number(e.target.value) : e.target.value)} />
  );
}
