export default function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  return (
    <span className="inline-flex shrink-0 items-center justify-center rounded-full border border-line bg-subtle font-medium text-ink" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}
