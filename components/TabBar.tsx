"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon, { type IconName } from "./Icon";
import { useRefs } from "./Refs";

const tabs: { href: string; label: string; icon: IconName }[] = [
  { href: "/chat", label: "Discussion", icon: "chat" },
  { href: "/posts", label: "Posts", icon: "at" },
  { href: "/tasks", label: "Tâches", icon: "check" },
  { href: "/projects", label: "Projets", icon: "folder" },
  { href: "/notes", label: "Notes", icon: "note" },
];
const TYPING = "input:not([type=checkbox]):not([type=color]):not([type=date]):not([type=file]), textarea";

// Barre d'onglets flottante façon iOS 26 : capsule translucide floutée.
// Visible seulement sur les 5 pages racines, masquée pendant la saisie (clavier ouvert).
export default function TabBar({ hidden = false }: { hidden?: boolean }) {
  const path = usePathname();
  const { unread } = useRefs();
  const [typing, setTyping] = useState(false);
  const root = tabs.some((t) => path === t.href);
  const show = root && !typing && !hidden;
  const idx = tabs.findIndex((t) => path === t.href);
  const unreadTotal = Object.values(unread).reduce((a, b) => a + b, 0);

  useEffect(() => {
    const on = (e: FocusEvent) => { if ((e.target as Element)?.matches?.(TYPING)) setTyping(true); };
    const off = () => setTyping(false);
    document.addEventListener("focusin", on);
    document.addEventListener("focusout", off);
    return () => { document.removeEventListener("focusin", on); document.removeEventListener("focusout", off); };
  }, []);
  useEffect(() => { document.body.toggleAttribute("data-tabbar", show); }, [show]);

  return (
    <nav className="pointer-events-none fixed inset-x-0 z-40 mx-auto max-w-[640px] px-3"
      style={{ bottom: "max(env(safe-area-inset-bottom), 10px)", transform: show ? "none" : "translateY(140%)", opacity: show ? 1 : 0, transition: "transform 380ms cubic-bezier(.32,.72,0,1), opacity 200ms" }}>
      <div className="glass-strong pointer-events-auto relative grid h-[64px] grid-cols-5 rounded-full p-[5px]">
        {/* Pastille de sélection qui glisse d'un onglet à l'autre (courbe à ressort). */}
        <span aria-hidden className="absolute inset-y-[5px] left-[5px] w-[calc((100%-10px)/5)] rounded-full bg-[var(--lens)] shadow-card"
          style={{ transform: `translateX(${Math.max(0, idx) * 100}%)`, opacity: idx < 0 ? 0 : 1, transition: "transform 420ms cubic-bezier(.34,1.3,.64,1), opacity 200ms" }} />
        {tabs.map((t) => {
          const on = path === t.href;
          const badge = t.href === "/chat" ? unreadTotal : 0;
          return (
            <Link key={t.href} href={t.href} aria-current={on ? "page" : undefined}
              className={`tap relative z-10 flex min-w-0 flex-col items-center justify-center gap-[3px] rounded-full transition-colors duration-200 ease-out ${on ? "text-ink" : "text-muted"}`}>
              <span className="transition-transform duration-300" style={{ transform: on ? "translateY(-1px) scale(1.06)" : "none" }}><Icon name={t.icon} size={22} stroke={on ? 2.1 : 1.7} /></span>
              <span className={`truncate text-[10px] leading-none ${on ? "font-semibold" : "font-medium"}`}>{t.label}</span>
              {badge > 0 && <span className="pop absolute right-[17%] top-[3px] inline-flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white shadow-[0_0_0_2px_var(--surface)]">{badge > 99 ? "99+" : badge}</span>}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
