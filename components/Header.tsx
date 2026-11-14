import Link from "next/link";

export default function Header({ title, back, children }: { title: string; back?: string; children?: React.ReactNode }) {
  return (
    <header className="flex items-center justify-between gap-2 border-b border-neutral-200 px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))] dark:border-neutral-800">
      <div className="flex min-w-0 items-center gap-2">
        {back && <Link href={back} className="text-indigo-600">‹</Link>}
        <h1 className="truncate font-semibold">{title}</h1>
      </div>
      {children}
    </header>
  );
}
