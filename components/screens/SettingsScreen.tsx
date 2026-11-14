"use client";
import { useState } from "react";
import Header from "../Header";
import Icon from "../Icon";
import { useRefs } from "../Refs";
import { db } from "@/lib/store";
import { btn, input, section, sel } from "@/lib/ui";
import type { FieldDef, Status } from "@/lib/types";

const KINDS = [["todo", "À faire"], ["active", "En cours"], ["done", "Terminé"]] as const;
const TYPES = [["text", "Texte"], ["number", "Nombre"], ["date", "Date"], ["select", "Liste"], ["checkbox", "Case"]] as const;

// Personnalisation : statuts, étiquettes et champs personnalisés des tâches.
export default function SettingsScreen() {
  const { statuses, labels, fieldDefs } = useRefs();
  const [sName, setSName] = useState("");
  const [lName, setLName] = useState("");
  const [fName, setFName] = useState("");
  const [fType, setFType] = useState<FieldDef["type"]>("text");
  const swap = async (table: string, a: { id: string; position: number }, b?: { id: string; position: number }) => {
    if (!b) return;
    db.update(table as "statuses", a.id, { position: b.position });
    db.update(table as "statuses", b.id, { position: a.position });
  };
  const next = (l: { position: number }[]) => Math.max(-1, ...l.map((x) => x.position)) + 1;

  return (
    <div className="flex h-full flex-col">
      <Header title="Personnaliser" />
      <div className="min-h-0 flex-1 space-y-7 overflow-y-auto px-4 pb-8 pt-4">
        <section className="space-y-2">
          <h2 className={section}>Statuts</h2>
          <p className="text-[12.5px] leading-snug text-muted">Le type décide du comportement : « Terminé » compte dans l&apos;avancement des projets.</p>
          {statuses.map((s: Status, i) => (
            <div key={s.id} className="flex items-center gap-1.5 rounded-xl border border-line bg-surface py-1.5 pl-2.5 pr-1">
              <input type="color" className="h-7 w-7 shrink-0 cursor-pointer rounded-md border border-line bg-transparent p-0" value={s.color} onChange={(e) => db.update("statuses", s.id, { color: e.target.value })} />
              <input key={s.name} className="h-9 min-w-0 flex-1 bg-transparent px-1 text-[15px] outline-none" defaultValue={s.name} onBlur={(e) => e.target.value.trim() && e.target.value !== s.name && db.update("statuses", s.id, { name: e.target.value.trim() })} />
              <select className={sel} value={s.kind} onChange={(e) => db.update("statuses", s.id, { kind: e.target.value })}>{KINDS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
              <button aria-label="Monter" className="inline-flex h-9 w-7 shrink-0 items-center justify-center text-muted disabled:opacity-25" disabled={i === 0} onClick={() => swap("statuses", s, statuses[i - 1])}>↑</button>
              <button aria-label="Descendre" className="inline-flex h-9 w-7 shrink-0 items-center justify-center text-muted disabled:opacity-25" disabled={i === statuses.length - 1} onClick={() => swap("statuses", s, statuses[i + 1])}>↓</button>
              <button onClick={() => db.remove("statuses", s.id)} aria-label="Supprimer" className="inline-flex h-9 w-9 shrink-0 items-center justify-center text-muted"><Icon name="trash" size={16} /></button>
            </div>
          ))}
          <div className="flex gap-2"><input className={input} placeholder="Nouveau statut" value={sName} onChange={(e) => setSName(e.target.value)} /><button className={`${btn} w-11 !px-0`} disabled={!sName.trim()} onClick={async () => { db.insert("statuses", { name: sName.trim(), kind: "active", position: next(statuses) }); setSName(""); }} aria-label="Ajouter"><Icon name="plus" size={20} stroke={2.2} /></button></div>
        </section>

        <section className="space-y-2">
          <h2 className={section}>Étiquettes</h2>
          {labels.map((l) => (
            <div key={l.id} className="flex items-center gap-1.5 rounded-xl border border-line bg-surface py-1.5 pl-2.5 pr-1">
              <input type="color" className="h-7 w-7 shrink-0 cursor-pointer rounded-md border border-line bg-transparent p-0" value={l.color} onChange={(e) => db.update("labels", l.id, { color: e.target.value })} />
              <input key={l.name} className="h-9 min-w-0 flex-1 bg-transparent px-1 text-[15px] outline-none" defaultValue={l.name} onBlur={(e) => e.target.value.trim() && e.target.value !== l.name && db.update("labels", l.id, { name: e.target.value.trim() })} />
              <button onClick={() => db.remove("labels", l.id)} aria-label="Supprimer" className="inline-flex h-9 w-9 shrink-0 items-center justify-center text-muted"><Icon name="trash" size={16} /></button>
            </div>
          ))}
          <div className="flex gap-2"><input className={input} placeholder="Nouvelle étiquette" value={lName} onChange={(e) => setLName(e.target.value)} /><button className={`${btn} w-11 !px-0`} disabled={!lName.trim()} onClick={async () => { db.insert("labels", { name: lName.trim().toLowerCase() }); setLName(""); }} aria-label="Ajouter"><Icon name="plus" size={20} stroke={2.2} /></button></div>
        </section>

        <section className="space-y-2">
          <h2 className={section}>Champs personnalisés</h2>
          <p className="text-[12.5px] leading-snug text-muted">Apparaissent sur chaque tâche (estimation, environnement, version, lien PR…).</p>
          {fieldDefs.map((f, i) => (
            <div key={f.id} className="space-y-2 rounded-xl border border-line bg-surface p-2.5">
              <div className="flex items-center gap-2">
                <input key={f.name} className={`${input} !py-1`} defaultValue={f.name} onBlur={(e) => e.target.value.trim() && e.target.value !== f.name && db.update("field_defs", f.id, { name: e.target.value.trim() })} />
                <span className="rounded-md border border-line px-1.5 py-0.5 text-[11.5px] text-muted">{TYPES.find(([k]) => k === f.type)?.[1]}</span>
                <button aria-label="Monter" className="inline-flex h-9 w-7 shrink-0 items-center justify-center text-muted disabled:opacity-25" disabled={i === 0} onClick={() => swap("field_defs", f, fieldDefs[i - 1])}>↑</button>
                <button aria-label="Descendre" className="inline-flex h-9 w-7 shrink-0 items-center justify-center text-muted disabled:opacity-25" disabled={i === fieldDefs.length - 1} onClick={() => swap("field_defs", f, fieldDefs[i + 1])}>↓</button>
                <button onClick={() => confirm("Supprimer ce champ ? Les valeurs restent masquées.") && db.remove("field_defs", f.id)} aria-label="Supprimer" className="inline-flex h-9 w-9 shrink-0 items-center justify-center text-muted"><Icon name="trash" size={16} /></button>
              </div>
              {f.type === "select" && <input key={f.options.join()} className={`${input} !py-1`} placeholder="Options séparées par des virgules" defaultValue={f.options.join(", ")} onBlur={(e) => db.update("field_defs", f.id, { options: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })} />}
            </div>
          ))}
          <div className="flex gap-2">
            <input className={input} placeholder="Nouveau champ" value={fName} onChange={(e) => setFName(e.target.value)} />
            <select className={sel} value={fType} onChange={(e) => setFType(e.target.value as FieldDef["type"])}>{TYPES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
            <button className={`${btn} w-11 !px-0`} disabled={!fName.trim()} onClick={async () => { db.insert("field_defs", { name: fName.trim(), type: fType, position: next(fieldDefs) }); setFName(""); }} aria-label="Ajouter"><Icon name="plus" size={20} stroke={2.2} /></button>
          </div>
        </section>
      </div>
    </div>
  );
}
