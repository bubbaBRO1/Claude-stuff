"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/chat", label: "Chat", icon: "◈" },
  { href: "/leads", label: "Leads", icon: "◉" },
  { href: "/campaigns", label: "Campaigns", icon: "◎" },
  { href: "/leadgen", label: "Lead Gen", icon: "◆" },
];

export default function Sidebar() {
  const path = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-14 md:w-52 bg-[#0d0d0f] border-r border-zinc-800 flex flex-col z-40">
      {/* logo */}
      <div className="px-3 md:px-5 py-5 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="text-[#00ff88] text-xl font-bold">⚡</span>
          <span className="hidden md:block text-xs font-bold tracking-[0.25em] text-zinc-200 uppercase">
            SalesBot
          </span>
        </div>
      </div>

      {/* nav */}
      <nav className="flex-1 py-4 flex flex-col gap-1 px-2">
        {nav.map(({ href, label, icon }) => {
          const active = path === href || path.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded text-xs transition-all ${
                active
                  ? "bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20"
                  : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50"
              }`}
            >
              <span className="text-base w-5 text-center">{icon}</span>
              <span className="hidden md:block tracking-wider uppercase font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* status */}
      <div className="px-3 md:px-5 py-4 border-t border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse" />
          <span className="hidden md:block text-[10px] text-zinc-500 tracking-widest uppercase">
            Max Online
          </span>
        </div>
      </div>
    </aside>
  );
}
