import { Suspense } from "react";
import PushBanner from "@/components/PushBanner";
import RefsProvider from "@/components/Refs";
import TabBar from "@/components/TabBar";

// Colonne plein écran : safe area du haut, contenu défilant, barre d'onglets en bas. Largeur max sur grand écran.
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <RefsProvider>
      <div className="mx-auto flex h-dvh max-w-[640px] flex-col bg-bg pt-[env(safe-area-inset-top)] sm:border-x sm:border-line">
        <PushBanner />
        <div className="flex min-h-0 flex-1 flex-col"><Suspense>{children}</Suspense></div>
        <Suspense fallback={<div className="h-[52px] shrink-0 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]" />}><TabBar /></Suspense>
      </div>
    </RefsProvider>
  );
}
