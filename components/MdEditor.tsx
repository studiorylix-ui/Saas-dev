"use client";
import { useState } from "react";
import Markdown from "./Markdown";
import { area } from "@/lib/ui";

// Zone Markdown : affichage rendu, touche pour éditer, « OK » pour enregistrer.
export default function MdEditor({ value, onSave, placeholder }: { value: string; onSave: (v: string) => void; placeholder: string }) {
  const [edit, setEdit] = useState(false);
  const [v, setV] = useState("");
  if (edit) {
    return (
      <div className="space-y-2">
        <textarea className={`${area} min-h-44 font-mono !text-[14px]`} value={v} onChange={(e) => setV(e.target.value)} autoFocus placeholder="Markdown : **gras**, `code`, ```bloc```, listes, liens…" />
        <div className="flex gap-1 text-[14px]"><button className="h-9 rounded-lg bg-accent px-3.5 font-medium text-on-accent active:opacity-80" onClick={() => { onSave(v); setEdit(false); }}>OK</button><button className="h-9 rounded-lg px-3 text-muted active:bg-fill" onClick={() => setEdit(false)}>Annuler</button></div>
      </div>
    );
  }
  return (
    <div onClick={() => { setV(value); setEdit(true); }} className="field min-h-11 cursor-text px-3 py-2.5 transition-colors duration-150 row">
      {value ? <Markdown text={value} /> : <span className="text-[15px] text-muted/70">{placeholder}</span>}
    </div>
  );
}
