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
export default function TabBar() {
  const path = usePathname();
  const { unread } = useRefs();
  const [typing, setTyping] = useState(false);
  const root = tabs.some((t) => path === t.href);
  const show = root && !typing;
  const unreadTotal = Object.values(unread).reduce((a, b) => a + b, 0);

  useEffect(() => {
    const on = (e: FocusEvent) => { if ((e.target as Element)?.matches?.(TYPING)) setTyping(true); };
    const off = () => setTyping(false);
    document.addEventListener("focusin", on);
    document.addEventListener("focusout", off);
    return () => { document.removeEventListener("focusin", on); document.removeEventListener("focusout", off); };
  }, []);
  useEffect(() => { document.body.toggleAttribute("data-tabbar", show); }, [show]);

  if (!show) return null;
  return (
    <nav className="pointer-events-none fixed inset-x-0 z-40 mx-auto max-w-[640px] px-3" style={{ bottom: "max(env(safe-area-inset-bottom), 10px)" }}>
      <div className="pointer-events-auto grid h-[62px] grid-cols-5 gap-0.5 rounded-full border border-black/[.06] bg-white/70 p-[5px] shadow-[0_8px_30px_rgba(0,0,0,.10)] backdrop-blur-2xl backdrop-saturate-150">
        {tabs.map((t) => {
          const on = path === t.href;
          const badge = t.href === "/chat" ? unreadTotal : 0;
          return (
            <Link key={t.href} href={t.href} aria-current={on ? "page" : undefined}
              className={`relative flex min-w-0 flex-col items-center justify-center gap-[3px] rounded-full transition-colors duration-200 ease-out ${on ? "bg-black/[.07] text-ink" : "text-ink/55 active:bg-black/[.04]"}`}>
              <Icon name={t.icon} size={22} stroke={on ? 2.1 : 1.7} />
              <span className={`truncate text-[10px] leading-none ${on ? "font-semibold" : "font-medium"}`}>{t.label}</span>
              {badge > 0 && <span className="absolute right-[18%] top-1 inline-flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-ink px-1 text-[10px] font-semibold text-white">{badge > 99 ? "99+" : badge}</span>}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
