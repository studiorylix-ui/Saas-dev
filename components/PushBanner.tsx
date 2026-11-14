"use client";
import { useEffect, useState } from "react";
import { sb } from "@/lib/supabase/client";
import Icon from "./Icon";

const key64 = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

// Bannière d'activation des notifications. Sur iPhone, ça n'existe que si l'app est sur l'écran d'accueil.
export default function PushBanner() {
  const [state, setState] = useState<"hidden" | "ask" | "install">("hidden");

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      const standalone = (navigator as { standalone?: boolean }).standalone;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- détection navigateur, une seule fois
      setState(/iPhone|iPad/.test(navigator.userAgent) && !standalone && !sessionStorage.getItem("hideInstall") ? "install" : "hidden");
      return;
    }
    navigator.serviceWorker.register("/sw.js")
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setState(sub || Notification.permission === "denied" ? "hidden" : "ask"));
  }, []);

  async function enable() {
    if ((await Notification.requestPermission()) !== "granted") return setState("hidden");
    const reg = await navigator.serviceWorker.ready;
    const sub = (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key64(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!) })).toJSON();
    await sb().from("push_subscriptions").upsert({ endpoint: sub.endpoint, p256dh: sub.keys!.p256dh, auth: sub.keys!.auth }, { onConflict: "endpoint" });
    setState("hidden");
  }
  function close() {
    try { sessionStorage.setItem("hideInstall", "1"); } catch {}
    setState("hidden");
  }

  if (state === "hidden") return null;
  return (
    <div className="shrink-0 border-b border-line bg-surface px-4 py-2.5 text-[13px]">
      <div className="flex items-center gap-3">
        <Icon name="bell" size={18} className="text-muted" />
        <span className="min-w-0 flex-1 text-ink">
          {state === "ask" ? "Recevoir les notifications de l'équipe" : <>Notifications : <span className="text-muted">Partager › Sur l&apos;écran d&apos;accueil, puis ouvrir l&apos;app.</span></>}
        </span>
        {state === "ask"
          ? <button className="h-8 rounded-lg bg-accent px-3 text-[13px] font-medium text-on-accent active:opacity-80" onClick={enable}>Activer</button>
          : <button aria-label="Fermer" className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted active:bg-fill" onClick={close}><Icon name="x" size={16} /></button>}
      </div>
    </div>
  );
}
