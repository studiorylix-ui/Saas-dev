"use client";
import { useSyncExternalStore } from "react";
import { toastItems, toastSubscribe } from "@/lib/toast";

const none: never[] = [];
export default function Toasts() {
  const items = useSyncExternalStore(toastSubscribe, toastItems, () => none);
  return (
    <div className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+8px)] z-[70] mx-auto flex max-w-[640px] flex-col items-center gap-2 px-4">
      {items.map((t) => <div key={t.id} className="toast-in rounded-full bg-ink px-4 py-2.5 text-[13.5px] font-medium text-white shadow-[0_8px_24px_rgba(0,0,0,.18)]">{t.text}</div>)}
    </div>
  );
}
