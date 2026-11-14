"use client";
import { useSyncExternalStore } from "react";
import { dismissToast, toastItems, toastSubscribe } from "@/lib/toast";

const none: never[] = [];
export default function Toasts() {
  const items = useSyncExternalStore(toastSubscribe, toastItems, () => none);
  return (
    <div className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+8px)] z-[90] mx-auto flex max-w-[640px] flex-col items-center gap-2 px-4">
      {items.map((t) => (
        <div key={t.id} className="toast-in pointer-events-auto flex items-center gap-3 rounded-full bg-[#1c1c1e]/85 py-2.5 pl-4 pr-2.5 text-[13.5px] font-medium text-white shadow-[0_10px_30px_rgba(0,0,0,.2)] backdrop-blur-xl">
          <span className="pr-1.5">{t.text}</span>
          {t.action && <button className="tap rounded-full bg-white/15 px-3 py-1 text-[13px] font-semibold" onClick={() => { t.action!.run(); dismissToast(t.id); }}>{t.action.label}</button>}
        </div>
      ))}
    </div>
  );
}
