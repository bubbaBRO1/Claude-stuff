import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNav from "./components/layout/BottomNav";
import ThemeProvider from "./components/layout/ThemeProvider";

export const metadata: Metadata = {
  title: "GlowUp — Look Your Best",
  description: "AI face analysis, daily routines, and confidence tools to help you look and feel your best.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "GlowUp" },
};

export const viewport: Viewport = {
  themeColor: "#080810",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased" style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
        <ThemeProvider>
          <main className="max-w-lg mx-auto px-4 pb-safe pt-4 min-h-screen">
            {children}
          </main>
          <BottomNav />
        </ThemeProvider>
      </body>
    </html>
  );
}
