"use client";
import { useState } from "react";
import { btn, input } from "@/lib/ui";
import { uploadImage } from "@/lib/upload";
import { extractMentions } from "@/lib/mentions";
import { useRefs } from "./Refs";

// Zone de saisie : @mentions avec suggestions, photos (4 max), Markdown. Ctrl/Cmd+Entrée envoie.
export default function Composer({ placeholder, onSend, images = false, extra }: { placeholder: string; onSend: (text: string, images: string[], mentions: string[]) => Promise<void> | void; images?: boolean; extra?: React.ReactNode }) {
  const { profiles, me } = useRefs();
  const [text, setText] = useState("");
  const [imgs, setImgs] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [caret, setCaret] = useState(0);
  const q = /@([\w-]*)$/.exec(text.slice(0, caret));
  const sugg = q ? profiles.filter((p) => p.id !== me && p.name.toLowerCase().startsWith(q[1].toLowerCase())).slice(0, 5) : [];

  function pick(n: string) {
    const before = text.slice(0, caret).replace(/@([\w-]*)$/, `@${n} `);
    setText(before + text.slice(caret));
    setCaret(before.length);
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
    if ((!t && !imgs.length) || busy) return;
    setBusy(true);
    await onSend(t, imgs, extractMentions(t, profiles));
    setText(""); setImgs([]); setBusy(false);
  }

  return (
    <div className="space-y-2 border-t border-neutral-200 bg-white p-2 dark:border-neutral-800 dark:bg-neutral-950">
      {sugg.length > 0 && <div className="flex gap-2">{sugg.map((p) => <button key={p.id} className="rounded-full bg-indigo-100 px-3 py-1 text-sm text-indigo-700" onClick={() => pick(p.name)}>@{p.name}</button>)}</div>}
      {imgs.length > 0 && (
        <div className="flex gap-2">
          {imgs.map((u) => (
            <div key={u} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt="" className="h-16 w-16 rounded-lg object-cover" />
              <button className="absolute -right-1 -top-1 rounded-full bg-black/70 px-1.5 text-xs text-white" onClick={() => setImgs(imgs.filter((x) => x !== u))}>✕</button>
            </div>
          ))}
        </div>
      )}
      {extra}
      <div className="flex items-end gap-2">
        {images && (
          <label className={`cursor-pointer rounded-xl bg-neutral-100 px-3 py-2 text-xl dark:bg-neutral-800 ${imgs.length >= 4 ? "opacity-40" : ""}`}>
            📷<input type="file" accept="image/*" multiple hidden disabled={imgs.length >= 4} onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
          </label>
        )}
        <textarea className={`${input} max-h-40 min-h-10 resize-none`} rows={text.includes("\n") ? 4 : 1} placeholder={placeholder} value={text}
          onChange={(e) => { setText(e.target.value); setCaret(e.target.selectionStart); }}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send(); }} />
        <button className={btn} onClick={send} disabled={busy || (!text.trim() && !imgs.length)}>{busy ? "…" : "↑"}</button>
      </div>
    </div>
  );
}
