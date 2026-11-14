"use client";
import { db, useReady, useTable } from "@/lib/store";
import { ago } from "@/lib/ui";
import type { Note } from "@/lib/types";
import { roundBtn } from "../Header";
import Icon from "../Icon";
import { PushLink, useNav } from "../nav";
import TabScaffold, { Skeleton } from "../TabScaffold";

export default function NotesTab() {
  const { rows } = useTable<Note>("notes", "updated_at");
  const ready = useReady("notes");
  const { push } = useNav();
  const add = () => push({ k: "note", id: db.insert<Note>("notes", { title: "", body: "" }).id });

  return (
    <TabScaffold title="Notes" actions={<button aria-label="Nouvelle note" onClick={add} className={`${roundBtn} btn-light !text-on-accent`}><Icon name="plus" size={19} stroke={2.2} /></button>}>
      {!ready ? <Skeleton avatar={false} /> : (
        <div className="group-card mx-4 divide-y divide-line">
          {rows.map((n) => (
            <PushLink key={n.id} to={{ k: "note", id: n.id }} className="rise block bg-surface px-4 py-3 active:bg-subtle">
              <div className="flex items-baseline gap-3"><span className="min-w-0 flex-1 truncate text-[15px] font-medium">{n.title || "Sans titre"}</span><span className="shrink-0 text-[12px] text-muted">{ago(n.updated_at)}</span></div>
              {n.body && <div className="mt-0.5 line-clamp-2 text-[13.5px] leading-snug text-muted">{n.body}</div>}
            </PushLink>
          ))}
        </div>
      )}
      {ready && !rows.length && <p className="py-20 text-center text-[13px] text-muted">Aucune note.</p>}
    </TabScaffold>
  );
}
