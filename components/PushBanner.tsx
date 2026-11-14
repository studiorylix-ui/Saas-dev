"use client";
import { useEffect, useState } from "react";
import { sb } from "@/lib/supabase/client";

const key64 = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

// Bannière d'activation des notifications. Sur iPhone, ça n'existe que si l'app est sur l'écran d'accueil.
export default function PushBanner() {
  const [state, setState] = useState<"hidden" | "ask" | "install">("hidden");

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- détection navigateur, une seule fois
      setState(/iPhone|iPad/.test(navigator.userAgent) ? "install" : "hidden");
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

  if (state === "hidden") return null;
  return (
    <div className="flex items-center justify-between gap-3 bg-indigo-600 px-4 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] text-sm text-white">
      {state === "ask" ? (<><span>Recevoir les notifications ?</span><button className="rounded-lg bg-white px-3 py-1 font-medium text-indigo-700" onClick={enable}>Activer</button></>)
        : <span>Pour les notifications : Partager › Sur l&apos;écran d&apos;accueil, puis ouvrez l&apos;app depuis l&apos;icône.</span>}
    </div>
  );
}
