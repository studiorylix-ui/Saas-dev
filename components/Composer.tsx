"use client";
import { useRef, useState } from "react";
import { area } from "@/lib/ui";
import { uploadImage } from "@/lib/upload";
import { extractMentions } from "@/lib/mentions";
import Avatar from "./Avatar";
import Icon from "./Icon";
import { useRefs } from "./Refs";

// Zone de saisie : @mentions avec suggestions, photos (4 max), Markdown. Cmd/Ctrl+Entrée envoie.
export default function Composer({ placeholder, onSend, images = false, extra, flat = false }: { placeholder: string; onSend: (text: string, images: string[], mentions: string[]) => Promise<void> | void; images?: boolean; extra?: React.ReactNode; flat?: boolean }) {
  const { profiles, me } = useRefs();
  const [text, setText] = useState("");
  const [imgs, setImgs] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [caret, setCaret] = useState(0);
  const ta = useRef<HTMLTextAreaElement>(null);
  const q = /@([\w-]*)$/.exec(text.slice(0, caret));
  const sugg = q ? profiles.filter((p) => p.id !== me && p.name.toLowerCase().startsWith(q[1].toLowerCase())).slice(0, 4) : [];
  const can = !busy && (!!text.trim() || imgs.length > 0);

  const grow = () => { const t = ta.current; if (t) { t.style.height = "auto"; t.style.height = `${Math.min(t.scrollHeight, 160)}px`; } };
  function pick(n: string) {
    const before = text.slice(0, caret).replace(/@([\w-]*)$/, `@${n} `);
    setText(before + text.slice(caret));
    setCaret(before.length);
    ta.current?.focus();
  }
  async function addFiles(list: FileList | null) {
    if (!list || !me) return;
    setBusy(true);
    try {
      const urls = await Promise.all(Array.from(list).slice(0, 4 - imgs.length).map((f) => uploadImage(f, me)));
      setImgs((i) => [...i, ...urls].slice(0, 4));
    } catch { alert("Envoi de la photo impossible."); }
    setBusy(false);
  }
  async function send() {
    const t = text.trim();
    if (!can) return;
    setBusy(true);
    await onSend(t, imgs, extractMentions(t, profiles));
    setText(""); setImgs([]); setBusy(false);
    requestAnimationFrame(grow);
  }

  return (
    <div className={`shrink-0 ${flat ? "" : "border-t border-line bg-surface"} px-3 py-2`}>
      {sugg.length > 0 && (
        <div className="mb-2 overflow-hidden rounded-xl border border-line bg-surface">
          {sugg.map((p) => (
            <button key={p.id} onClick={() => pick(p.name)} className="flex h-11 w-full items-center gap-2.5 px-3 text-left text-[14px] active:bg-subtle">
              <Avatar name={p.name} size={24} /><span className="font-medium">{p.name}</span>
            </button>
          ))}
        </div>
      )}
      {imgs.length > 0 && (
        <div className="mb-2 flex gap-2">
          {imgs.map((u) => (
            <div key={u} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt="" className="h-16 w-16 rounded-[10px] border border-line object-cover" />
              <button aria-label="Retirer" className="absolute -right-1.5 -top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-ink text-white" onClick={() => setImgs(imgs.filter((x) => x !== u))}><Icon name="x" size={12} stroke={2.5} /></button>
            </div>
          ))}
        </div>
      )}
      {extra}
      <div className="flex items-end gap-1.5">
        {images && (
          <label aria-label="Ajouter des photos" className={`inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-[10px] text-muted active:bg-black/[.05] ${imgs.length >= 4 ? "pointer-events-none opacity-30" : ""}`}>
            <Icon name="image" size={21} />
            <input type="file" accept="image/*" multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
          </label>
        )}
        <textarea ref={ta} rows={1} className={`${area} max-h-40 min-h-11 resize-none`} placeholder={placeholder} value={text}
          onChange={(e) => { setText(e.target.value); setCaret(e.target.selectionStart); grow(); }}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send(); }} />
        <button aria-label="Envoyer" onClick={send} disabled={!can}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-accent text-white transition-opacity duration-150 ease-out active:opacity-80 disabled:opacity-20">
          {busy ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <Icon name="send" size={19} stroke={2.2} />}
        </button>
      </div>
    </div>
  );
}
