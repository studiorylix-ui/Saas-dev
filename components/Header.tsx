"use client";
import Icon, { type IconName } from "./Icon";
import { type Screen, useNav } from "./nav";
import { useRefs } from "./Refs";

export const roundBtn = "tap relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/[.05] text-ink";

export function RoundPush({ to, icon, label, dot }: { to: Screen; icon: IconName; label: string; dot?: boolean }) {
  const { push } = useNav();
  return (
    <button aria-label={label} onClick={() => push(to)} className={roundBtn}>
      <Icon name={icon} size={18} />
      {dot && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border-2 border-bg bg-[#e5484d]" />}
    </button>
  );
}

// Boutons globaux des pages racines : recherche + activité.
export function GlobalActions() {
  const { feedUnseen } = useRefs();
  return (<><RoundPush to={{ k: "search" }} icon="search" label="Rechercher" /><RoundPush to={{ k: "activity" }} icon="heart" label="Activité" dot={feedUnseen} /></>);
}

// En-tête d'un écran empilé : retour, titre centré façon iOS, actions à droite.
export default function Header({ title, children }: { title: string; children?: React.ReactNode }) {
  const { back } = useNav();
  return (
    <header className="z-10 shrink-0 border-b border-line bg-bg">
      <div className="relative flex h-12 items-center px-1.5">
        <button onClick={back} aria-label="Retour" className="tap inline-flex h-11 items-center gap-0.5 rounded-[10px] pl-1 pr-2 text-[16px]"><Icon name="back" size={24} /></button>
        <h1 className="pointer-events-none absolute inset-x-16 truncate text-center text-[16.5px] font-semibold tracking-[-0.02em]">{title}</h1>
        <div className="ml-auto flex shrink-0 items-center gap-1 pr-1">{children}</div>
      </div>
    </header>
  );
}
