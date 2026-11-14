"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/chat", label: "Discussion", icon: "💬" },
  { href: "/posts", label: "Posts", icon: "📣" },
  { href: "/tasks", label: "Tâches", icon: "✅" },
  { href: "/projects", label: "Projets", icon: "📊", also: "/deals" },
  { href: "/notes", label: "Notes", icon: "📝" },
];

export default function TabBar() {
  const path = usePathname();
  return (
    <nav className="flex border-t border-neutral-200 bg-white pb-[env(safe-area-inset-bottom)] dark:border-neutral-800 dark:bg-neutral-950">
      {tabs.map((t) => (
        <Link key={t.href} href={t.href} className={`flex flex-1 flex-col items-center py-2 text-[11px] ${(path.startsWith(t.href) || (t.also && path.startsWith(t.also))) ? "font-semibold text-indigo-600" : "text-neutral-500"}`}>
          <span className="text-xl">{t.icon}</span>
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
