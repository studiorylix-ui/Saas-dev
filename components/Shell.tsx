"use client";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { startSync } from "@/lib/store";
import { sb } from "@/lib/supabase/client";
import { NavCtx, type Screen, decStack, urlFor } from "./nav";
import PushBanner from "./PushBanner";
import RefsProvider from "./Refs";
import Stack, { skipNextAnimation } from "./Stack";
import TabBar from "./TabBar";
import { Skeleton } from "./TabScaffold";
import Toasts from "./Toasts";
import ActivityScreen from "./screens/ActivityScreen";
import DealScreen from "./screens/DealScreen";
import NoteScreen from "./screens/NoteScreen";
import PostScreen from "./screens/PostScreen";
import ProjectScreen from "./screens/ProjectScreen";
import SearchScreen from "./screens/SearchScreen";
import SettingsScreen from "./screens/SettingsScreen";
import TaskScreen from "./screens/TaskScreen";
import ChatTab from "./tabs/ChatTab";
import NotesTab from "./tabs/NotesTab";
import PostsTab from "./tabs/PostsTab";
import ProjectsTab from "./tabs/ProjectsTab";
import TasksTab from "./tabs/TasksTab";

// memo : les onglets ne dépendent d'aucune prop, ils ne se re-rendent pas quand la pile change.
const TABS = { chat: memo(ChatTab), posts: memo(PostsTab), tasks: memo(TasksTab), projects: memo(ProjectsTab), notes: memo(NotesTab) } as const;
type TabKey = keyof typeof TABS;

function render(s: Screen) {
  const id = s.id ?? "";
  switch (s.k) {
    case "task": return <TaskScreen id={id} />;
    case "project": return <ProjectScreen id={id} />;
    case "deal": return <DealScreen id={id} />;
    case "post": return <PostScreen id={id} />;
    case "note": return <NoteScreen id={id} />;
    case "search": return <SearchScreen />;
    case "activity": return <ActivityScreen />;
    case "settings": return <SettingsScreen />;
  }
}

let pushed = 0; // entrées d'historique créées par l'app (sinon « retour » remplace l'URL au lieu de quitter le site)
let ownBack = false;

// Coquille de l'app : session locale (aucun appel réseau par clic), onglets gardés montés, pile d'écrans, clavier iOS.
export default function Shell() {
  const path = usePathname();
  const router = useRouter();
  const sp = useSearchParams();
  const tab = (Object.keys(TABS).find((t) => path.startsWith(`/${t}`)) ?? "chat") as TabKey;
  const stack = useMemo(() => decStack(sp.get("s")), [sp]);
  const [authed, setAuthed] = useState(false);
  const [swipe, setSwipe] = useState(false);
  const [mounted, setMounted] = useState<TabKey[]>([tab]);
  const tabsEl = useRef<HTMLDivElement>(null);
  const prevLen = useRef(stack.length);
  if (!mounted.includes(tab)) setMounted([...mounted, tab]);

  useEffect(() => {
    sb().auth.getSession().then(({ data }) => {
      if (!data.session) return router.replace("/login");
      setAuthed(true);
      startSync();
      // Geste retour maison : en app installée (pas de geste natif) et hors iPhone ; dans Safari, on laisse le geste natif.
      const standalone = (navigator as { standalone?: boolean }).standalone || matchMedia("(display-mode: standalone)").matches;
      setSwipe(standalone || !/iPhone|iPad/.test(navigator.userAgent));
    });
  }, [router]);

  // Hauteur réelle visible (clavier iOS) → variables CSS utilisées par la coquille et les écrans.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const set = () => {
      document.documentElement.style.setProperty("--vvh", `${vv.height}px`);
      document.documentElement.style.setProperty("--vvt", `${vv.offsetTop}px`);
    };
    set();
    vv.addEventListener("resize", set);
    vv.addEventListener("scroll", set);
    return () => { vv.removeEventListener("resize", set); vv.removeEventListener("scroll", set); };
  }, []);

  // Retour système (geste Safari, bouton du navigateur) : Safari anime déjà, on n'anime pas une seconde fois.
  useEffect(() => {
    const ios = /iPhone|iPad/.test(navigator.userAgent) && !(navigator as { standalone?: boolean }).standalone;
    const onPop = () => { if (!ownBack && ios) skipNextAnimation(); ownBack = false; };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  useEffect(() => {
    if (stack.length < prevLen.current) pushed = Math.max(0, pushed - (prevLen.current - stack.length));
    prevLen.current = stack.length;
  }, [stack.length]);

  // Objet de navigation stable (lit la pile via une ref) : les lignes de liste ne se re-rendent pas à chaque navigation.
  const cur = useRef({ stack, path });
  useEffect(() => { cur.current = { stack, path }; }, [stack, path]);
  const nav = useMemo(() => ({
    href: (s: Screen) => urlFor(cur.current.path, [...cur.current.stack, s]),
    push: (s: Screen) => { pushed++; window.history.pushState(null, "", urlFor(cur.current.path, [...cur.current.stack, s])); },
    back: () => {
      if (pushed > 0) { ownBack = true; window.history.back(); }
      else window.history.replaceState(null, "", urlFor(cur.current.path, cur.current.stack.slice(0, -1)));
    },
  }), []);

  return (
    <NavCtx.Provider value={nav}>
      <RefsProvider>
        <div className="fixed inset-x-0 mx-auto flex max-w-[640px] flex-col overflow-hidden bg-bg pt-[env(safe-area-inset-top)] sm:border-x sm:border-line"
          style={{ top: "var(--vvt, 0px)", height: "var(--vvh, 100dvh)" }}>
          <PushBanner />
          <div ref={tabsEl} data-tabs="1" className="relative min-h-0 flex-1 will-change-transform">
            {!authed ? <Skeleton rows={8} /> : mounted.map((t) => {
              const Tab = TABS[t];
              return (
                <div key={t} className={`absolute inset-0 flex flex-col ${t === tab ? "" : "invisible pointer-events-none"}`} aria-hidden={t !== tab}>
                  <Tab />
                </div>
              );
            })}
          </div>
        </div>
        <TabBar hidden={stack.length > 0} />
        {authed && <Stack stack={stack} render={render} under={tabsEl} swipe={swipe} />}
        <Toasts />
      </RefsProvider>
    </NavCtx.Provider>
  );
}
