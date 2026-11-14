"use client";
import { useState } from "react";
import Header, { roundBtn } from "@/components/Header";
import Icon from "@/components/Icon";
import { sb } from "@/lib/supabase/client";
import { useTable } from "@/lib/useTable";
import { ago, iconBtn } from "@/lib/ui";
import type { Note } from "@/lib/types";

export default function Notes() {
  const { rows, reload } = useTable<Note>("notes", "updated_at");
  const [openId, setOpenId] = useState<string | null>(null);
  const note = rows.find((n) => n.id === openId);

  async function add() {
    const { data } = await sb().from("notes").insert({ title: "", body: "" }).select().single();
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
      <div className="flex h-full flex-col bg-surface">
        <Header title="">
          <button className={iconBtn} aria-label="Supprimer" onClick={() => del(note.id)}><Icon name="trash" size={18} className="text-muted" /></button>
          <button className="h-9 rounded-lg px-3 text-[15px] font-semibold active:bg-black/[.05]" onClick={() => setOpenId(null)}>OK</button>
        </Header>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pt-4">
          {/* key = id : le champ repart de la valeur serveur à chaque ouverture */}
          <input key={`t${note.id}`} autoFocus={!note.title} className="w-full bg-transparent text-[24px] font-semibold tracking-[-0.025em] outline-none placeholder:text-muted/40" placeholder="Titre" defaultValue={note.title} onBlur={(e) => e.target.value !== note.title && save(note.id, { title: e.target.value })} />
          <div className="mb-3 mt-1 text-[12px] text-muted">Modifiée {ago(note.updated_at)}</div>
          <textarea key={`b${note.id}`} className="min-h-[60vh] w-full flex-1 resize-none bg-transparent text-[16px] leading-relaxed outline-none placeholder:text-muted/40" defaultValue={note.body} placeholder="Commencez à écrire…" onBlur={(e) => e.target.value !== note.body && save(note.id, { body: e.target.value })} />
        </div>
      </div>
    );
  }
  return (
    <div className="flex h-full flex-col">
      <Header large title="Notes"><button aria-label="Nouvelle note" onClick={add} className={`${roundBtn} !bg-accent !text-white`}><Icon name="plus" size={19} stroke={2.2} /></button></Header>
      <div className="tabpad min-h-0 flex-1 overflow-y-auto">
        <div className="divide-y divide-line border-y border-line">
          {rows.map((n) => (
            <button key={n.id} onClick={() => setOpenId(n.id)} className="block w-full bg-surface px-4 py-3 text-left transition-colors duration-150 active:bg-subtle">
              <div className="flex items-baseline gap-3"><span className="min-w-0 flex-1 truncate text-[15px] font-medium">{n.title || "Sans titre"}</span><span className="shrink-0 text-[12px] text-muted">{ago(n.updated_at)}</span></div>
              {n.body && <div className="mt-0.5 line-clamp-2 text-[13.5px] leading-snug text-muted">{n.body}</div>}
            </button>
          ))}
        </div>
        {!rows.length && <p className="py-20 text-center text-[13px] text-muted">Aucune note.</p>}
      </div>
    </div>
  );
}
