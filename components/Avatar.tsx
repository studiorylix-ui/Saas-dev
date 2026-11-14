// Pastille d'initiale, teinte pastel stable par nom.
// Teintes définies par thème dans globals.css (--tint-0 … --tint-6).
const tint = (s: string) => `var(--tint-${[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % 7})`;

export default function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  return (
    <span className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-ink/75 shadow-[inset_0_0_0_.5px_rgba(0,0,0,.04)]" style={{ width: size, height: size, fontSize: size * 0.4, background: tint(name) }}>
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}
