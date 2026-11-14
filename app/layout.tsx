import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: "Rylix Hub",
  description: "Espace d'équipe : discussion, posts, tâches, projets, notes.",
  appleWebApp: { capable: true, title: "Hub", statusBarStyle: "default" },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, maximumScale: 1, viewportFit: "cover", themeColor: "#fafafa", interactiveWidget: "resizes-content" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${geist.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="h-full bg-bg font-sans text-[15px] text-ink">{children}</body>
    </html>
  );
}
