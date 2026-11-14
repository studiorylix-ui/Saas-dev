export default function Header({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <header className="flex items-center justify-between border-b border-neutral-200 px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))] dark:border-neutral-800">
      <h1 className="font-semibold">{title}</h1>
      {children}
    </header>
  );
}
