"use client";

// Feuille qui monte du bas, avec voile. Toujours montée pour permettre la transition.
export default function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: React.ReactNode }) {
  return (
    <div className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      <div onClick={onClose} className={`absolute inset-0 bg-black/25 transition-opacity duration-200 ease-out ${open ? "opacity-100" : "opacity-0"}`} />
      <div className={`absolute inset-x-0 bottom-0 mx-auto max-h-[85dvh] max-w-[640px] overflow-y-auto rounded-t-[12px] bg-surface pb-[max(env(safe-area-inset-bottom),16px)] transition-transform duration-200 ease-out ${open ? "translate-y-0" : "translate-y-full"}`}>
        <div className="mx-auto mt-2 h-1 w-9 rounded-full bg-black/15" />
        {title && <div className="px-4 pb-1 pt-3 text-[15px] font-semibold">{title}</div>}
        {children}
      </div>
    </div>
  );
}
