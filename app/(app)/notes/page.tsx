"use client";
import { useState } from "react";
import Header from "@/components/Header";
import { sb } from "@/lib/supabase/client";
import { useTable } from "@/lib/useTable";
import { ago, card, input } from "@/lib/ui";
import type { Note } from "@/lib/types";

export default function Notes() {
  const { rows, reload } = useTable<Note>("notes", "updated_at");
  const [openId, setOpenId] = useState<string | null>(null);
  const note = rows.find((n) => n.id === openId);

  async function add() {
    const { data } = await sb().from("notes").insert({ title: "Nouvelle note", body: "" }).select().single();
    if (data) { await reload(); setOpenId(data.id); }
  }
  const save = (id: string, patch: Partial<Note>) =>
    sb().from("notes").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id).then(reload);
  async function del(id: string) {
    if (!confirm("Supprimer cette note ?")) return;
    await sb().from("notes").delete().eq("id", id);
    setOpenId(null);
  }

  if (note) {
    return (
      <div className="flex h-full flex-col">
        <Header title="Note">
          <span className="flex gap-4"><button className="text-red-600" onClick={() => del(note.id)}>Supprimer</button><button className="text-indigo-600" onClick={() => setOpenId(null)}>OK</button></span>
        </Header>
        <div className="flex min-h-0 flex-1 flex-col gap-2 p-3">
          {/* key = id : le champ repart de la valeur serveur à chaque ouverture */}
          <input key={`t${note.id}`} className={`${input} font-semibold`} defaultValue={note.title} onBlur={(e) => e.target.value !== note.title && save(note.id, { title: e.target.value })} />
          <textarea key={`b${note.id}`} className={`${input} flex-1 resize-none`} defaultValue={note.body} placeholder="Écrire…" onBlur={(e) => e.target.value !== note.body && save(note.id, { body: e.target.value })} />
        </div>
      </div>
    );
  }
  return (
    <div className="flex h-full flex-col">
      <Header title="Notes"><button className="text-2xl text-indigo-600" onClick={add}>＋</button></Header>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {rows.map((n) => (
          <button key={n.id} onClick={() => setOpenId(n.id)} className={`${card} block w-full text-left`}>
            <div className="font-medium">{n.title || "Sans titre"}</div>
            <div className="line-clamp-2 text-sm text-neutral-500">{n.body}</div>
            <div className="mt-1 text-xs text-neutral-400">{ago(n.updated_at)}</div>
          </button>
        ))}
        {!rows.length && <p className="pt-10 text-center text-neutral-500">Aucune note. Touchez ＋.</p>}
      </div>
    </div>
  );
}
