// Pastille d'initiale, teinte pastel stable par nom.
const TINTS = ["#ece6dd", "#e3e9e4", "#e2e6ee", "#ece3ea", "#e9e7dc", "#e1ebec", "#ebe4e0"];
const tint = (s: string) => TINTS[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % TINTS.length];

export default function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  return (
    <span className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-ink/75" style={{ width: size, height: size, fontSize: size * 0.4, background: tint(name) }}>
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}
