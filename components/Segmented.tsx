"use client";

// Sélecteur segmenté iOS : pastille surélevée qui glisse sous l'option choisie.
export default function Segmented<K extends string>({ options, value, onChange }: { options: readonly (readonly [K, string])[]; value: K; onChange: (k: K) => void }) {
  const i = Math.max(0, options.findIndex(([k]) => k === value));
  return (
    <div className="relative flex h-9 rounded-[12px] bg-fill p-[3px] text-[13px]">
      <span aria-hidden className="absolute inset-y-[3px] left-[3px] rounded-[9px] bg-[var(--lens)] shadow-card"
        style={{ width: `calc((100% - 6px) / ${options.length})`, transform: `translateX(${i * 100}%)`, transition: "transform 380ms cubic-bezier(.34,1.25,.64,1)" }} />
      {options.map(([k, l]) => (
        <button key={k} onClick={() => onChange(k)} aria-pressed={k === value}
          className={`relative z-10 flex-1 rounded-[9px] px-3 transition-colors duration-200 ${k === value ? "font-semibold text-ink" : "text-muted"}`}>{l}</button>
      ))}
    </div>
  );
}
