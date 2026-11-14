"use client";
import { useLayoutEffect, useRef, useState } from "react";
import { refetchAll } from "@/lib/store";
import { GlobalActions } from "./Header";

// Squelette de chargement (lignes grises animées).
export function Skeleton({ rows = 6, avatar = true }: { rows?: number; avatar?: boolean }) {
  return (
    <div className="space-y-5 px-4 py-4">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex gap-3">
          {avatar && <div className="skel h-9 w-9 shrink-0 rounded-full" />}
          <div className="flex-1 space-y-2 pt-1"><div className="skel h-3 w-1/3 rounded" /><div className="skel h-3 rounded" style={{ width: `${55 + ((i * 37) % 40)}%` }} /></div>
        </div>
      ))}
    </div>
  );
}

// Hauteur d'un élément suivie en direct (pour que le contenu défile sous les barres translucides).
function useHeight<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [h, setH] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setH(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, h] as const;
}

// Page racine façon iOS : barre translucide au-dessus du contenu, grand titre qui se replie, tirer pour actualiser.
export default function TabScaffold({ title, actions, sub, children, footer, scroll = true }: { title: string; actions?: React.ReactNode; sub?: React.ReactNode; children: React.ReactNode; footer?: React.ReactNode; scroll?: boolean }) {
  const [collapsed, setCollapsed] = useState(false);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const y0 = useRef<number | null>(null);
  const [head, headH] = useHeight<HTMLDivElement>();
  const [foot, footH] = useHeight<HTMLDivElement>();

  const touch = {
    onTouchStart: (e: React.TouchEvent) => { y0.current = box.current && box.current.scrollTop <= 0 ? e.touches[0].clientY : null; setDragging(y0.current != null); },
    onTouchMove: (e: React.TouchEvent) => { if (y0.current == null || refreshing) return; const dy = e.touches[0].clientY - y0.current; setPull(dy > 0 ? Math.min(90, dy * 0.45) : 0); },
    onTouchEnd: async () => {
      y0.current = null;
      setDragging(false);
      if (pull > 58 && !refreshing) { setRefreshing(true); setPull(52); await refetchAll(); setRefreshing(false); }
      setPull(0);
    },
  };
  const bar = (
    <div className="relative flex h-11 items-center justify-end gap-2 px-4">
      <span className="pointer-events-none absolute inset-x-24 text-center text-[16.5px] font-semibold tracking-[-0.02em] transition-all duration-200" style={{ opacity: collapsed ? 1 : 0, transform: collapsed ? "none" : "translateY(4px)" }}>{title}</span>
      <GlobalActions />
      {actions}
    </div>
  );
  const big = <h1 className="px-4 pb-2 pt-0.5 text-[32px] font-bold leading-[1.1] tracking-[-0.035em]">{title}</h1>;
  const vars = { "--head": `${headH}px`, "--foot": `${footH}px` } as React.CSSProperties;

  if (!scroll) {
    // Chat : en-tête (titre + pastilles) et barre de saisie translucides, les messages défilent dessous.
    return (
      <div className="relative flex h-full flex-col" style={vars}>
        <div ref={head} className="glass absolute inset-x-0 top-0 z-20">{bar}{big}{sub}</div>
        <div className="relative flex min-h-0 flex-1 flex-col">{children}</div>
        <div ref={foot} className="absolute inset-x-0 bottom-0 z-20">{footer}</div>
      </div>
    );
  }
  return (
    <div className="relative flex h-full flex-col" style={vars}>
      <div className={`absolute inset-x-0 top-0 z-20 border-b transition-[background-color,border-color,backdrop-filter] duration-200 ${collapsed ? "glass border-line" : "border-transparent"}`}>{bar}</div>
      <div ref={box} {...touch} onScroll={(e) => setCollapsed(e.currentTarget.scrollTop > 34)} className="tabpad relative min-h-0 flex-1 overflow-y-auto overscroll-y-contain pt-11">
        {(pull > 0 || refreshing) && (
          <div className="pointer-events-none absolute inset-x-0 top-11 flex justify-center" style={{ height: pull, opacity: Math.min(1, pull / 50) }}>
            <span className={`mt-3 h-5 w-5 rounded-full border-2 border-ink/15 border-t-ink ${refreshing || pull > 58 ? "animate-spin" : ""}`} style={{ transform: refreshing ? undefined : `rotate(${pull * 4}deg)` }} />
          </div>
        )}
        <div style={{ transform: pull ? `translateY(${pull}px)` : undefined, transition: dragging ? "none" : "transform 300ms cubic-bezier(.32,.72,0,1)" }}>
          {big}{sub}{children}
        </div>
      </div>
      <div ref={foot}>{footer}</div>
    </div>
  );
}
