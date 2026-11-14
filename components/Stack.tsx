"use client";
/* eslint-disable react-hooks/set-state-in-effect, react-hooks/immutability -- animation pilotée par la pile d'URL, styles posés directement sur le DOM (60 i/s) */
import { useEffect, useRef, useState } from "react";
import { type Screen, useNav } from "./nav";

type Layer = { key: string; screen: Screen; phase: "enter" | "idle" | "exit" };
const DUR = 340;
export const EASE = "cubic-bezier(.32,.72,0,1)"; // courbe des transitions UIKit

// Signale qu'un retour arrive d'un geste natif (Safari a déjà animé) : pas de seconde animation.
let skipNext = false;
export const skipNextAnimation = () => { skipNext = true; };

const keyOf = (s: Screen, i: number) => `${i}:${s.k}.${s.id ?? ""}`;

// Pile d'écrans façon UINavigationController : entrée par la droite, parallaxe dessous, retour par balayage du bord.
export default function Stack({ stack, render, under, swipe }: { stack: Screen[]; render: (s: Screen) => React.ReactNode; under: React.RefObject<HTMLDivElement | null>; swipe: boolean }) {
  const [layers, setLayers] = useState<Layer[]>([]);
  const { back } = useNav();

  useEffect(() => {
    const skip = skipNext;
    skipNext = false;
    const keys = stack.map(keyOf);
    setLayers((prev) => {
      const live = stack.map((s, i) => prev.find((l) => l.key === keys[i] && l.phase !== "exit") ?? { key: keys[i], screen: s, phase: skip ? "idle" as const : "enter" as const });
      const leaving = skip ? [] : prev.filter((l) => !keys.includes(l.key)).map((l) => ({ ...l, phase: "exit" as const }));
      return [...live, ...leaving];
    });
  }, [stack]);

  useEffect(() => {
    if (layers.some((l) => l.phase === "enter")) {
      // Deux images pour que la position de départ soit peinte ; minuterie de secours si les images sont suspendues.
      const go = () => setLayers((ls) => ls.map((l) => (l.phase === "enter" ? { ...l, phase: "idle" } : l)));
      let r2 = 0;
      const r1 = requestAnimationFrame(() => { r2 = requestAnimationFrame(go); });
      const t = setTimeout(go, 50);
      return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2); clearTimeout(t); };
    }
    if (layers.some((l) => l.phase === "exit")) {
      const t = setTimeout(() => setLayers((ls) => ls.filter((l) => l.phase !== "exit")), DUR);
      return () => clearTimeout(t);
    }
  }, [layers]);

  const live = layers.filter((l) => l.phase !== "exit");
  const topIdx = live.length - 1;
  // Fond (onglets) décalé en parallaxe dès qu'un écran est empilé.
  useEffect(() => {
    const el = under.current;
    if (!el) return;
    const covered = live.some((l) => l.phase === "idle");
    el.style.transition = `transform ${DUR}ms ${EASE}, filter ${DUR}ms ${EASE}`;
    el.style.transform = covered ? "translateX(-28%)" : "";
    el.style.filter = covered ? "brightness(.94)" : "";
  });

  return (
    <>
      {layers.map((l) => {
        const i = live.indexOf(l);
        const pos = l.phase === "enter" || l.phase === "exit" ? "translateX(100%)" : i < topIdx ? "translateX(-28%)" : "translateX(0)";
        return (
          <Layer key={l.key} pos={pos} dim={i >= 0 && i < topIdx} top={i === topIdx && l.phase === "idle"} swipe={swipe} back={back}
            under={() => (i > 0 ? (document.querySelector(`[data-layer="${live[i - 1].key}"]`) as HTMLElement | null) : under.current)} id={l.key}>
            {render(l.screen)}
          </Layer>
        );
      })}
    </>
  );
}

function Layer({ id, pos, dim, top, swipe, back, under, children }: { id: string; pos: string; dim: boolean; top: boolean; swipe: boolean; back: () => void; under: () => HTMLElement | null; children: React.ReactNode }) {
  const el = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x0: number; t0: number; dx: number } | null>(null);

  const start = (e: React.TouchEvent) => {
    if (!top || !swipe || e.touches[0].clientX > 24) return;
    drag.current = { x0: e.touches[0].clientX, t0: Date.now(), dx: 0 };
  };
  const move = (e: React.TouchEvent) => {
    const d = drag.current; if (!d || !el.current) return;
    d.dx = Math.max(0, e.touches[0].clientX - d.x0);
    el.current.style.transition = "none";
    el.current.style.transform = `translateX(${d.dx}px)`;
    const u = under();
    if (u) { u.style.transition = "none"; u.style.transform = `translateX(calc(-28% + ${d.dx * 0.28}px))`; }
  };
  const end = () => {
    const d = drag.current; drag.current = null; if (!d || !el.current) return;
    const w = el.current.offsetWidth;
    const done = d.dx > w * 0.35 || d.dx / Math.max(1, Date.now() - d.t0) > 0.6;
    const u = under();
    el.current.style.transition = `transform 260ms ${EASE}`;
    if (u) u.style.transition = `transform 260ms ${EASE}, filter 260ms ${EASE}`;
    if (done) {
      el.current.style.transform = "translateX(100%)";
      if (u) { u.style.transform = layerIsTabs(u) ? "" : "translateX(0)"; u.style.filter = ""; }
      setTimeout(() => { skipNextAnimation(); back(); }, 250);
    } else {
      el.current.style.transform = "";
      if (u) u.style.transform = "translateX(-28%)";
    }
  };

  return (
    <div ref={el} data-layer={id} onTouchStart={start} onTouchMove={move} onTouchEnd={end} onTouchCancel={end}
      className="layer fixed inset-x-0 z-[45] mx-auto flex max-w-[640px] flex-col overflow-hidden bg-bg shadow-[-10px_0_30px_rgba(0,0,0,.08)] will-change-transform"
      style={{ top: "var(--vvt, 0px)", height: "var(--vvh, 100dvh)", transform: pos, transition: `transform ${DUR}ms ${EASE}, filter ${DUR}ms ${EASE}`, filter: dim ? "brightness(.94)" : undefined }}>
      {children}
    </div>
  );
}
const layerIsTabs = (el: HTMLElement) => el.dataset.tabs === "1";
