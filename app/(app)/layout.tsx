import TabBar from "@/components/TabBar";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex h-dvh flex-col">
      <div className="min-h-0 flex-1">{children}</div>
      <TabBar />
    </div>
  );
}
