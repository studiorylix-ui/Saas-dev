import Link from "next/link";
import Icon from "./Icon";

// En-tête collant de 48 px (la safe area du haut est gérée par le layout).
export default function Header({ title, back, children }: { title: string; back?: string; children?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-10 shrink-0 border-b border-line bg-bg">
      <div className="flex h-12 items-center gap-1 px-2">
        {back ? (
          <Link href={back} aria-label="Retour" className="inline-flex h-11 w-11 items-center justify-center rounded-[10px] text-ink active:bg-black/[.05]"><Icon name="back" size={22} /></Link>
        ) : <span className="w-2" />}
        <h1 className="min-w-0 flex-1 truncate text-[17px] font-semibold tracking-[-0.02em]">{title}</h1>
        <div className="flex shrink-0 items-center gap-0.5 pr-1">{children}</div>
      </div>
    </header>
  );
}
