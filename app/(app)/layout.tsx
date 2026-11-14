import { Suspense } from "react";
import Shell from "@/components/Shell";
import { Skeleton } from "@/components/TabScaffold";

// Tout l'intérieur de l'app est rendu côté téléphone par <Shell /> ; les pages d'onglet sont vides.
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Suspense fallback={<div className="pt-[env(safe-area-inset-top)]"><Skeleton rows={8} /></div>}><Shell /></Suspense>
      {children}
    </>
  );
}
