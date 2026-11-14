"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Icon, { type IconName } from "./Icon";
import { useRefs } from "./Refs";

export const roundBtn = "relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/[.05] text-ink transition-colors duration-150 ease-out active:bg-black/10";

export function RoundLink({ href, icon, label, dot }: { href: string; icon: IconName; label: string; dot?: boolean }) {
  return (
    <Link href={href} aria-label={label} className={roundBtn}>
      <Icon name={icon} size={18} />
      {dot && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border-2 border-bg bg-[#e5484d]" />}
    </Link>
  );
}

// En-tête : grand titre façon iOS (pages racines, avec recherche + activité) ou barre compacte avec retour.
export default function Header({ title, back, children, large }: { title: string; back?: string; children?: React.ReactNode; large?: boolean }) {
  const router = useRouter();
  const { feedUnseen } = useRefs();
  if (large) {
    return (
      <header className="shrink-0 bg-bg px-4 pb-2 pt-1.5">
        <div className="flex h-10 items-center justify-end gap-2">
          <RoundLink href="/search" icon="search" label="Rechercher" />
          <RoundLink href="/activity" icon="heart" label="Activité" dot={feedUnseen} />
          {children}
        </div>
        <h1 className="mt-1 truncate text-[32px] font-bold leading-[1.1] tracking-[-0.035em]">{title}</h1>
      </header>
    );
  }
  return (
    <header className="sticky top-0 z-10 shrink-0 border-b border-line bg-bg">
      <div className="flex h-12 items-center gap-1 px-2">
        {back ? (
          back === "back"
            ? <button onClick={() => router.back()} aria-label="Retour" className="inline-flex h-11 w-11 items-center justify-center rounded-[10px] active:bg-black/[.05]"><Icon name="back" size={22} /></button>
            : <Link href={back} aria-label="Retour" className="inline-flex h-11 w-11 items-center justify-center rounded-[10px] active:bg-black/[.05]"><Icon name="back" size={22} /></Link>
        ) : <span className="w-2" />}
        <h1 className="min-w-0 flex-1 truncate text-[17px] font-semibold tracking-[-0.02em]">{title}</h1>
        <div className="flex shrink-0 items-center gap-1 pr-1">{children}</div>
      </div>
    </header>
  );
}
