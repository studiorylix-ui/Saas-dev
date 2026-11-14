"use client";
import { useRef } from "react";
import { db, useRows } from "@/lib/store";
import { ago, iconBtn } from "@/lib/ui";
import type { Note } from "@/lib/types";
import Header from "../Header";
import Icon from "../Icon";
import { useNav } from "../nav";

// Éditeur de note plein écran ; enregistrement automatique pendant la frappe (après 600 ms de pause).
export default function NoteScreen({ id }: { id: string }) {
  const note = useRows<Note>("notes").find((n) => n.id === id);
  const { back } = useNav();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  if (!note) return <><Header title="" /><p className="p-4 text-[13px] text-muted">Note introuvable.</p></>;

  const save = (patch: Partial<Note>) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => db.update("notes", id, { ...patch, updated_at: new Date().toISOString() }), 600);
  };
  const del = () => { back(); setTimeout(() => db.removeLater("notes", id, "Note supprimée"), 300); };

  return (
    <>
      <Header title=""><button className={iconBtn} aria-label="Supprimer" onClick={del}><Icon name="trash" size={18} className="text-muted" /></button></Header>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-surface px-5 pt-4">
        <input autoFocus={!note.title} className="w-full bg-transparent text-[24px] font-semibold tracking-[-0.025em] outline-none placeholder:text-muted/40" placeholder="Titre"
          defaultValue={note.title} onChange={(e) => save({ title: e.target.value })} />
        <div className="mb-3 mt-1 text-[12px] text-muted">Modifiée {ago(note.updated_at)}</div>
        <textarea className="min-h-[60vh] w-full flex-1 resize-none bg-transparent text-[16px] leading-relaxed outline-none placeholder:text-muted/40" defaultValue={note.body}
          placeholder="Commencez à écrire…" onChange={(e) => save({ body: e.target.value })} />
      </div>
    </>
  );
}
