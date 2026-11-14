"use client";
import { useRef } from "react";
import { EASE } from "./Stack";

// Feuille qui monte du bas ; on la ferme en touchant le voile ou en la tirant vers le bas.
export function useDragToClose(onClose: () => void) {
  const panel = useRef<HTMLDivElement>(null);
  const d = useRef<{ y0: number; t0: number; dy: number } | null>(null);
  return {
    panel,
    handlers: {
      onTouchStart: (e: React.TouchEvent) => { d.current = { y0: e.touches[0].clientY, t0: Date.now(), dy: 0 }; },
      onTouchMove: (e: React.TouchEvent) => {
        const s = d.current; if (!s || !panel.current) return;
        s.dy = Math.max(0, e.touches[0].clientY - s.y0);
        panel.current.style.transition = "none";
        panel.current.style.transform = `translateY(${s.dy}px)`;
      },
      onTouchEnd: () => {
        const s = d.current; d.current = null; if (!s || !panel.current) return;
        panel.current.style.transition = `transform 320ms ${EASE}`;
        panel.current.style.transform = "";
        if (s.dy > 110 || s.dy / Math.max(1, Date.now() - s.t0) > 0.6) onClose();
      },
    },
  };
}

export default function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: React.ReactNode }) {
  const { panel, handlers } = useDragToClose(onClose);
  return (
    <div className={`fixed inset-0 z-[60] ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      <div onClick={onClose} className="absolute inset-0 bg-black/30 transition-opacity duration-300" style={{ opacity: open ? 1 : 0 }} />
      <div className="absolute inset-x-0 bottom-0 mx-auto max-w-[640px]" style={{ transform: open ? "translateY(0)" : "translateY(105%)", transition: `transform 420ms ${EASE}` }}>
        <div ref={panel} className="glass-strong max-h-[85dvh] overflow-y-auto rounded-t-[14px] pb-[max(env(safe-area-inset-bottom),16px)] shadow-[0_-8px_30px_rgba(0,0,0,.08)]">
          <div {...handlers} className="cursor-grab touch-none pb-1 pt-2">
            <div className="mx-auto h-[5px] w-9 rounded-full bg-black/15" />
            {title && <div className="px-4 pb-1 pt-3 text-[15px] font-semibold">{title}</div>}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
