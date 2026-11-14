"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon, { type IconName } from "./Icon";

const tabs: { href: string; label: string; icon: IconName; also?: string }[] = [
  { href: "/chat", label: "Discussion", icon: "chat" },
  { href: "/posts", label: "Posts", icon: "at" },
  { href: "/tasks", label: "Tâches", icon: "check" },
  { href: "/projects", label: "Projets", icon: "folder", also: "/deals" },
  { href: "/notes", label: "Notes", icon: "note" },
];

// Barre d'onglets fine : 5 colonnes fixes (jamais de retour à la ligne), safe area du bas incluse.
export default function TabBar() {
  const path = usePathname();
  return (
    <nav className="shrink-0 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]">
      <div className="grid h-[52px] grid-cols-5">
        {tabs.map((t) => {
          const on = path.startsWith(t.href) || (!!t.also && path.startsWith(t.also));
          return (
            <Link key={t.href} href={t.href} aria-current={on ? "page" : undefined}
              className={`relative flex min-w-0 flex-col items-center justify-center gap-[3px] transition-colors duration-150 ease-out ${on ? "text-ink" : "text-muted/80"}`}>
              {on && <span className="absolute inset-x-[30%] top-0 h-[2px] rounded-b-full bg-ink" />}
              <Icon name={t.icon} size={22} stroke={on ? 2 : 1.6} />
              <span className={`truncate text-[10.5px] leading-none ${on ? "font-semibold" : "font-medium"}`}>{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
