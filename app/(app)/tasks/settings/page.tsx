"use client";
import { useState } from "react";
import Header from "@/components/Header";
import { useRefs } from "@/components/Refs";
import { sb } from "@/lib/supabase/client";
import { btn, card, input, sel } from "@/lib/ui";
import type { FieldDef, Status } from "@/lib/types";

const KINDS = [["todo", "À faire"], ["active", "En cours"], ["done", "Terminé"]] as const;
const TYPES = [["text", "Texte"], ["number", "Nombre"], ["date", "Date"], ["select", "Liste"], ["checkbox", "Case"]] as const;

// Personnalisation : statuts, étiquettes et champs personnalisés des tâches.
export default function TaskSettings() {
  const { statuses, labels, fieldDefs } = useRefs();
  const [sName, setSName] = useState("");
  const [lName, setLName] = useState("");
  const [fName, setFName] = useState("");
  const [fType, setFType] = useState<FieldDef["type"]>("text");
  const fail = (e: { message: string } | null) => e && alert(e.message.includes("violates") ? "Impossible : élément encore utilisé par des tâches." : e.message);
  const run = async (q: PromiseLike<{ error: { message: string } | null }>) => fail((await q).error);
  const swap = async (table: string, a: { id: string; position: number }, b?: { id: string; position: number }) => {
    if (!b) return;
    await sb().from(table).update({ position: b.position }).eq("id", a.id);
    await sb().from(table).update({ position: a.position }).eq("id", b.id);
  };
  const next = (l: { position: number }[]) => Math.max(-1, ...l.map((x) => x.position)) + 1;

  return (
    <div className="flex h-full flex-col">
      <Header title="Personnaliser les tâches" back="/tasks" />
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-4">
        <section className="space-y-2">
          <h2 className="font-semibold">Statuts</h2>
          <p className="text-xs text-neutral-500">Le type décide du comportement : « Terminé » compte dans l&apos;avancement des projets.</p>
          {statuses.map((s: Status, i) => (
            <div key={s.id} className={`${card} flex items-center gap-2`}>
              <input type="color" className="h-8 w-8 shrink-0 rounded" value={s.color} onChange={(e) => sb().from("statuses").update({ color: e.target.value }).eq("id", s.id).then(() => {})} />
              <input key={s.name} className={`${input} !py-1`} defaultValue={s.name} onBlur={(e) => e.target.value.trim() && e.target.value !== s.name && run(sb().from("statuses").update({ name: e.target.value.trim() }).eq("id", s.id))} />
              <select className={sel} value={s.kind} onChange={(e) => run(sb().from("statuses").update({ kind: e.target.value }).eq("id", s.id))}>{KINDS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
              <button disabled={i === 0} onClick={() => swap("statuses", s, statuses[i - 1])}>↑</button>
              <button disabled={i === statuses.length - 1} onClick={() => swap("statuses", s, statuses[i + 1])}>↓</button>
              <button onClick={() => run(sb().from("statuses").delete().eq("id", s.id))}>🗑</button>
            </div>
          ))}
          <div className="flex gap-2"><input className={input} placeholder="Nouveau statut" value={sName} onChange={(e) => setSName(e.target.value)} /><button className={btn} disabled={!sName.trim()} onClick={async () => { await run(sb().from("statuses").insert({ name: sName.trim(), kind: "active", position: next(statuses) })); setSName(""); }}>＋</button></div>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold">Étiquettes</h2>
          {labels.map((l) => (
            <div key={l.id} className={`${card} flex items-center gap-2`}>
              <input type="color" className="h-8 w-8 shrink-0 rounded" value={l.color} onChange={(e) => sb().from("labels").update({ color: e.target.value }).eq("id", l.id).then(() => {})} />
              <input key={l.name} className={`${input} !py-1`} defaultValue={l.name} onBlur={(e) => e.target.value.trim() && e.target.value !== l.name && run(sb().from("labels").update({ name: e.target.value.trim() }).eq("id", l.id))} />
              <button onClick={() => run(sb().from("labels").delete().eq("id", l.id))}>🗑</button>
            </div>
          ))}
          <div className="flex gap-2"><input className={input} placeholder="Nouvelle étiquette" value={lName} onChange={(e) => setLName(e.target.value)} /><button className={btn} disabled={!lName.trim()} onClick={async () => { await run(sb().from("labels").insert({ name: lName.trim().toLowerCase() })); setLName(""); }}>＋</button></div>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold">Champs personnalisés</h2>
          <p className="text-xs text-neutral-500">Apparaissent sur chaque tâche (estimation, environnement, version, lien PR…).</p>
          {fieldDefs.map((f, i) => (
            <div key={f.id} className={`${card} space-y-2`}>
              <div className="flex items-center gap-2">
                <input key={f.name} className={`${input} !py-1`} defaultValue={f.name} onBlur={(e) => e.target.value.trim() && e.target.value !== f.name && run(sb().from("field_defs").update({ name: e.target.value.trim() }).eq("id", f.id))} />
                <span className="rounded bg-neutral-100 px-2 py-1 text-xs dark:bg-neutral-800">{TYPES.find(([k]) => k === f.type)?.[1]}</span>
                <button disabled={i === 0} onClick={() => swap("field_defs", f, fieldDefs[i - 1])}>↑</button>
                <button disabled={i === fieldDefs.length - 1} onClick={() => swap("field_defs", f, fieldDefs[i + 1])}>↓</button>
                <button onClick={() => confirm("Supprimer ce champ ? Les valeurs restent masquées.") && run(sb().from("field_defs").delete().eq("id", f.id))}>🗑</button>
              </div>
              {f.type === "select" && <input key={f.options.join()} className={`${input} !py-1`} placeholder="Options séparées par des virgules" defaultValue={f.options.join(", ")} onBlur={(e) => run(sb().from("field_defs").update({ options: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) }).eq("id", f.id))} />}
            </div>
          ))}
          <div className="flex gap-2">
            <input className={input} placeholder="Nouveau champ" value={fName} onChange={(e) => setFName(e.target.value)} />
            <select className={sel} value={fType} onChange={(e) => setFType(e.target.value as FieldDef["type"])}>{TYPES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
            <button className={btn} disabled={!fName.trim()} onClick={async () => { await run(sb().from("field_defs").insert({ name: fName.trim(), type: fType, position: next(fieldDefs) })); setFName(""); }}>＋</button>
          </div>
        </section>
      </div>
    </div>
  );
}
