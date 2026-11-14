"use client";
import { area } from "@/lib/ui";
import Avatar from "./Avatar";
import Icon from "./Icon";
import { useComposer, type OnSend } from "./useComposer";

export function Suggestions({ list, pick }: { list: { id: string; name: string }[]; pick: (n: string) => void }) {
  if (!list.length) return null;
  return (
    <div className="mb-2 overflow-hidden rounded-xl border border-line bg-surface">
      {list.map((p) => (
        <button key={p.id} onClick={() => pick(p.name)} className="flex h-11 w-full items-center gap-2.5 px-3 text-left text-[14px] active:bg-subtle">
          <Avatar name={p.name} size={24} /><span className="font-medium">{p.name}</span>
        </button>
      ))}
    </div>
  );
}

export function Thumbs({ imgs, remove }: { imgs: string[]; remove: (u: string) => void }) {
  if (!imgs.length) return null;
  return (
    <div className="mb-2 flex gap-2">
      {imgs.map((u) => (
        <div key={u} className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={u} alt="" className="h-16 w-16 rounded-[10px] border border-line object-cover" />
          <button aria-label="Retirer" className="absolute -right-1.5 -top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-ink text-white" onClick={() => remove(u)}><Icon name="x" size={12} stroke={2.5} /></button>
        </div>
      ))}
    </div>
  );
}

// Barre de saisie compacte (chat, réponses, commentaires). Cmd/Ctrl+Entrée envoie.
export default function Composer({ placeholder, onSend, images = false, flat = false, className = "", onTyping }: { placeholder: string; onSend: OnSend; images?: boolean; flat?: boolean; className?: string; onTyping?: () => void }) {
  const { ta, ...c } = useComposer(onSend, onTyping);
  return (
    <div className={`shrink-0 ${flat ? "" : "glass border-t border-black/[.06]"} px-3 py-2 ${className}`}>
      <Suggestions list={c.sugg} pick={c.pick} />
      <Thumbs imgs={c.imgs} remove={(u) => c.setImgs(c.imgs.filter((x) => x !== u))} />
      <div className="flex items-end gap-1.5">
        {images && (
          <label aria-label="Ajouter des photos" className={`inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-[10px] text-muted active:bg-black/[.05] ${c.imgs.length >= 4 ? "pointer-events-none opacity-30" : ""}`}>
            <Icon name="image" size={21} />
            <input type="file" accept="image/*" multiple hidden onChange={(e) => { c.addFiles(e.target.files); e.target.value = ""; }} />
          </label>
        )}
        <textarea ref={ta} rows={1} className={`${area} max-h-40 min-h-11 resize-none`} placeholder={placeholder} value={c.text} onChange={c.change}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) c.send(); }} />
        <button aria-label="Envoyer" onPointerDown={(e) => e.preventDefault()} onClick={c.send} disabled={!c.can}
          className="tap inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-white disabled:opacity-20">
          {c.busy ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <Icon name="send" size={19} stroke={2.2} />}
        </button>
      </div>
    </div>
  );
}
