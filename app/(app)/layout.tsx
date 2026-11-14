import PushBanner from "@/components/PushBanner";
import RefsProvider from "@/components/Refs";
import TabBar from "@/components/TabBar";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <RefsProvider>
      <div className="flex h-dvh flex-col">
        <PushBanner />
        <div className="min-h-0 flex-1">{children}</div>
        <TabBar />
      </div>
    </RefsProvider>
  );
}
