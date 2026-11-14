"use client";
import { useRef, useState } from "react";
import { uploadImage } from "@/lib/upload";
import { extractMentions } from "@/lib/mentions";
import { useRefs } from "./Refs";

export type OnSend = (text: string, images: string[], mentions: string[]) => Promise<void> | void;

// Logique commune aux zones de saisie : texte, @mentions suggérées, photos (4 max), envoi.
export function useComposer(onSend: OnSend, onTyping?: () => void) {
  const { profiles, me } = useRefs();
  const [text, setText] = useState("");
  const [imgs, setImgs] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [caret, setCaret] = useState(0);
  const ta = useRef<HTMLTextAreaElement>(null);
  const q = /@([\w-]*)$/.exec(text.slice(0, caret));
  const sugg = q ? profiles.filter((p) => p.id !== me && p.name.toLowerCase().startsWith(q[1].toLowerCase())).slice(0, 4) : [];
  const can = !busy && (!!text.trim() || imgs.length > 0);

  const grow = () => { const t = ta.current; if (t) { t.style.height = "auto"; t.style.height = `${Math.min(t.scrollHeight, 240)}px`; } };
  const change = (e: React.ChangeEvent<HTMLTextAreaElement>) => { setText(e.target.value); setCaret(e.target.selectionStart); grow(); if (e.target.value) onTyping?.(); };
  function pick(n: string) {
    const before = text.slice(0, caret).replace(/@([\w-]*)$/, `@${n} `);
    setText(before + text.slice(caret));
    setCaret(before.length);
    ta.current?.focus();
  }
  function insert(str: string) {
    const v = `${text}${text && !text.endsWith(" ") ? " " : ""}${str}`;
    setText(v); setCaret(v.length);
    requestAnimationFrame(() => { const t = ta.current; if (t) { t.focus(); t.setSelectionRange(v.length, v.length); } });
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
    if (!can) return false;
    setBusy(true);
    const t = text.trim();
    await onSend(t, imgs, extractMentions(t, profiles));
    setText(""); setImgs([]); setBusy(false);
    requestAnimationFrame(grow);
    return true;
  }
  return { text, change, insert, imgs, setImgs, busy, sugg, pick, addFiles, send, ta, can };
}
