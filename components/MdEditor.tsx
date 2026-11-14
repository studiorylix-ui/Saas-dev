"use client";
import { useState } from "react";
import Markdown from "./Markdown";
import { input } from "@/lib/ui";

// Zone Markdown : affichage rendu, touche pour éditer, « OK » pour enregistrer.
export default function MdEditor({ value, onSave, placeholder }: { value: string; onSave: (v: string) => void; placeholder: string }) {
  const [edit, setEdit] = useState(false);
  const [v, setV] = useState("");
  if (edit) {
    return (
      <div className="space-y-2">
        <textarea className={`${input} min-h-40 font-mono text-sm`} value={v} onChange={(e) => setV(e.target.value)} autoFocus placeholder="Markdown : **gras**, `code`, ```bloc```, listes, liens…" />
        <div className="flex gap-3 text-sm"><button className="font-medium text-indigo-600" onClick={() => { onSave(v); setEdit(false); }}>OK</button><button className="text-neutral-500" onClick={() => setEdit(false)}>Annuler</button></div>
      </div>
    );
  }
  return (
    <div onClick={() => { setV(value); setEdit(true); }} className="min-h-10 cursor-text rounded-xl border border-dashed border-neutral-300 p-2 dark:border-neutral-700">
      {value ? <Markdown text={value} /> : <span className="text-neutral-400">{placeholder}</span>}
    </div>
  );
}
