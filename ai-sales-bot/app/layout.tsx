import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "./components/layout/Sidebar";
import { ToastProvider } from "./components/ui/Toast";

export const metadata: Metadata = {
  title: "AI Sales Bot — War Room",
  description: "AI-powered SMS & email sales automation with lead generation",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="scanlines">
        <ToastProvider>
          <Sidebar />
          <main className="pl-14 md:pl-52 min-h-screen">{children}</main>
        </ToastProvider>
      </body>
    </html>
  );
}
