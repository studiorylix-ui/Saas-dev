"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Icon, { type IconName } from "./Icon";
import { EASE } from "./Stack";

/*
 * Surcouches globales façon iOS, appelables depuis n'importe où :
 *  - openMenu(...)  : menu contextuel flouté (appui long) avec réactions et actions ;
 *  - ask(...)       : feuille de confirmation (remplace window.confirm) ;
 *  - editText(...)  : feuille d'édition d'un texte.
 */
export type MenuItem = { label: string; icon: IconName; run: () => void; danger?: boolean };
type Menu = { preview: React.ReactNode; items: MenuItem[]; reactions?: { mine: string[]; pick: (e: string) => void } };
type Ask = { title: string; message?: string; confirm: string; danger?: boolean; done: (ok: boolean) => void };
type Edit = { title: string; value: string; done: (v: string | null) => void };
type State = { menu: Menu | null; ask: Ask | null; edit: Edit | null };

let st: State = { menu: null, ask: null, edit: null };
const subs = new Set<() => void>();
const set = (p: Partial<State>) => { st = { ...st, ...p }; subs.forEach((l) => l()); };
const sub = (l: () => void) => { subs.add(l); return () => { subs.delete(l); }; };

export const openMenu = (m: Menu) => set({ menu: m });
export const ask = (a: Omit<Ask, "done">) => new Promise<boolean>((done) => set({ ask: { ...a, done } }));
export const editText = (e: Omit<Edit, "done">) => new Promise<string | null>((done) => set({ edit: { ...e, done } }));

// Appui long (iPhone) ou clic droit (ordinateur), annulé si le doigt bouge (défilement).
let timer: ReturnType<typeof setTimeout> | undefined;
let origin: { x: number; y: number; el: HTMLElement } | null = null;
const release = () => { clearTimeout(timer); if (origin) origin.el.style.transform = ""; origin = null; };
export function pressHandlers(on: () => void) {
  return {
    onTouchStart: (e: React.TouchEvent<HTMLElement>) => {
      const p = e.touches[0];
      const el = e.currentTarget;
      origin = { x: p.clientX, y: p.clientY, el };
      el.style.transition = "transform 420ms cubic-bezier(.2,.8,.2,1)";
      el.style.transform = "scale(.975)";
      timer = setTimeout(() => { release(); on(); }, 430);
    },
    onTouchMove: (e: React.TouchEvent) => { const p = e.touches[0]; if (origin && Math.hypot(p.clientX - origin.x, p.clientY - origin.y) > 8) release(); },
    onTouchEnd: release,
    onTouchCancel: release,
    onContextMenu: (e: React.MouseEvent) => { e.preventDefault(); release(); on(); },
  };
}

const EMOJIS = ["❤️", "👍", "😂", "🔥", "👀", "✅"];

export default function Overlays() {
  const s = useSyncExternalStore(sub, () => st, () => st);
  return <><MenuHost m={s.menu} /><AskHost a={s.ask} /><EditHost e={s.edit} /></>;
}

// Laisse l'élément monté le temps de l'animation de sortie.
function useLinger<T>(v: T | null, ms = 260) {
  const [kept, setKept] = useState(v);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- animation d'entrée/sortie */
    if (v) { setKept(v); const r = requestAnimationFrame(() => setShown(true)); const t = setTimeout(() => setShown(true), 30); return () => { cancelAnimationFrame(r); clearTimeout(t); }; }
    setShown(false);
    const t = setTimeout(() => setKept(null), ms);
    return () => clearTimeout(t);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [v, ms]);
  return [kept, shown] as const;
}

function MenuHost({ m }: { m: Menu | null }) {
  const [menu, shown] = useLinger(m);
  if (!menu) return null;
  const close = () => set({ menu: null });
  const act = (f: () => void) => { close(); setTimeout(f, 180); };
  return (
    <div className="fixed inset-0 z-[80] flex flex-col justify-end px-3 pb-[max(env(safe-area-inset-bottom),14px)]" onClick={close}
      style={{ background: shown ? "rgba(0,0,0,.18)" : "rgba(0,0,0,0)", backdropFilter: shown ? "blur(14px) saturate(140%)" : "blur(0)", WebkitBackdropFilter: shown ? "blur(14px) saturate(140%)" : "blur(0)", transition: "background 240ms, backdrop-filter 240ms, -webkit-backdrop-filter 240ms" }}>
      <div className="mx-auto w-full max-w-[420px] space-y-2" onClick={(e) => e.stopPropagation()}
        style={{ transform: shown ? "none" : "scale(.92) translateY(14px)", opacity: shown ? 1 : 0, transition: `transform 340ms ${EASE}, opacity 200ms` }}>
        {menu.reactions && (
          <div className="glass-strong mx-auto flex w-fit gap-1 rounded-full p-1.5 shadow-float">
            {EMOJIS.map((e) => (
              <button key={e} onClick={() => act(() => menu.reactions!.pick(e))}
                className={`tap inline-flex h-11 w-11 items-center justify-center rounded-full text-[24px] ${menu.reactions!.mine.includes(e) ? "bg-fill" : ""}`}>{e}</button>
            ))}
          </div>
        )}
        <div className="max-h-[38dvh] overflow-hidden rounded-[20px] bg-surface p-3 shadow-float">{menu.preview}</div>
        <div className="glass-strong overflow-hidden rounded-[20px] shadow-float">
          {menu.items.map((it, i) => (
            <button key={it.label} onClick={() => act(it.run)}
              className={`flex h-[50px] w-full items-center justify-between px-4 text-[16px] active:bg-fill ${i ? "border-t border-line" : ""} ${it.danger ? "text-danger" : "text-ink"}`}>
              {it.label}<Icon name={it.icon} size={19} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function AskHost({ a }: { a: Ask | null }) {
  const [q, shown] = useLinger(a);
  if (!q) return null;
  const done = (ok: boolean) => { set({ ask: null }); q.done(ok); };
  return (
    <div className="fixed inset-0 z-[85] flex flex-col justify-end px-2.5 pb-[max(env(safe-area-inset-bottom),10px)]" onClick={() => done(false)}
      style={{ background: shown ? "rgba(0,0,0,.28)" : "rgba(0,0,0,0)", transition: "background 240ms" }}>
      <div className="mx-auto w-full max-w-[460px] space-y-2" onClick={(e) => e.stopPropagation()}
        style={{ transform: shown ? "none" : "translateY(110%)", transition: `transform 380ms ${EASE}` }}>
        <div className="glass-strong overflow-hidden rounded-[20px] text-center">
          <div className="px-5 pb-3 pt-4"><div className="text-[13px] font-semibold text-muted">{q.title}</div>{q.message && <div className="mt-1 text-[13px] text-muted">{q.message}</div>}</div>
          <button onClick={() => done(true)} className={`h-14 w-full border-t border-line text-[18px] active:bg-fill ${q.danger ? "text-danger" : "text-ink"}`}>{q.confirm}</button>
        </div>
        <button onClick={() => done(false)} className="h-14 w-full rounded-[20px] bg-surface text-[18px] font-semibold active:bg-subtle">Annuler</button>
      </div>
    </div>
  );
}

function EditHost({ e }: { e: Edit | null }) {
  const [ed, shown] = useLinger(e);
  const ta = useRef<HTMLTextAreaElement>(null);
  const [v, setV] = useState("");
  const [lastEd, setLastEd] = useState<Edit | null>(null);
  if (ed !== lastEd) { setLastEd(ed); if (ed) setV(ed.value); }
  useEffect(() => { if (shown) setTimeout(() => { ta.current?.focus(); ta.current?.setSelectionRange(9e9, 9e9); }, 260); }, [shown]);
  if (!ed) return null;
  const done = (r: string | null) => { set({ edit: null }); ed.done(r); };
  return (
    <div className="fixed inset-0 z-[85]" style={{ background: shown ? "rgba(0,0,0,.28)" : "rgba(0,0,0,0)", transition: "background 240ms" }}>
      <div className="absolute inset-x-0 bottom-0 mx-auto flex max-w-[640px] flex-col rounded-t-[22px] bg-surface" style={{ top: "calc(var(--vvt, 0px) + env(safe-area-inset-top) + 10px)", height: "calc(var(--vvh, 100dvh) - env(safe-area-inset-top) - 10px)", transform: shown ? "none" : "translateY(105%)", transition: `transform 380ms ${EASE}` }}>
        <div className="grid h-14 shrink-0 grid-cols-[1fr_auto_1fr] items-center border-b border-line px-2">
          <button className="tap h-10 justify-self-start rounded-lg px-2.5 text-[16px]" onClick={() => done(null)}>Annuler</button>
          <span className="text-[16px] font-semibold">{ed.title}</span>
          <button className="tap h-10 justify-self-end rounded-lg px-2.5 text-[16px] font-semibold disabled:opacity-30" disabled={!v.trim()} onClick={() => done(v.trim())}>OK</button>
        </div>
        <textarea ref={ta} value={v} onChange={(x) => setV(x.target.value)} className="min-h-0 flex-1 resize-none bg-transparent px-4 py-3 text-[16px] leading-relaxed outline-none" />
      </div>
    </div>
  );
}
