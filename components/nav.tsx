"use client";
import { createContext, useContext } from "react";

export type ScreenKind = "task" | "project" | "deal" | "post" | "search" | "activity" | "settings" | "note" | "account";
export type Screen = { k: ScreenKind; id?: string };

export const encStack = (s: Screen[]) => s.map((x) => (x.id ? `${x.k}.${x.id}` : x.k)).join("~");
export const decStack = (v: string | null): Screen[] =>
  (v ?? "").split("~").filter(Boolean).map((p) => { const i = p.indexOf("."); return i < 0 ? { k: p as ScreenKind } : { k: p.slice(0, i) as ScreenKind, id: p.slice(i + 1) }; });
export const urlFor = (path: string, s: Screen[]) => (s.length ? `${path}?s=${encStack(s)}` : path);

type Nav = { push: (s: Screen) => void; back: () => void; href: (s: Screen) => string };
export const NavCtx = createContext<Nav>({ push: () => {}, back: () => {}, href: () => "#" });
export const useNav = () => useContext(NavCtx);

// Lien qui empile un écran (navigation instantanée, sans serveur).
export function PushLink({ to, className, children, label }: { to: Screen; className?: string; children: React.ReactNode; label?: string }) {
  const { push, href } = useNav();
  return <a href={href(to)} aria-label={label} className={className} onClick={(e) => { e.preventDefault(); push(to); }}>{children}</a>;
}
