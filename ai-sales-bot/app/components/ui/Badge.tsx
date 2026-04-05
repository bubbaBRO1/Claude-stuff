import { ReactNode } from "react";

type Color = "green" | "yellow" | "red" | "blue" | "gray" | "purple";

interface BadgeProps {
  color?: Color;
  children: ReactNode;
  className?: string;
}

const colors: Record<Color, string> = {
  green: "bg-green-500/15 text-green-400 border-green-500/30",
  yellow: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  red: "bg-red-500/15 text-red-400 border-red-500/30",
  blue: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  gray: "bg-zinc-700/40 text-zinc-400 border-zinc-600/30",
  purple: "bg-purple-500/15 text-purple-400 border-purple-500/30",
};

export default function Badge({ color = "gray", children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs rounded border font-mono ${colors[color]} ${className}`}
    >
      {children}
    </span>
  );
}

export function statusColor(status: string): Color {
  switch (status) {
    case "new":
      return "blue";
    case "contacted":
      return "yellow";
    case "interested":
      return "green";
    case "closed":
      return "purple";
    case "sent":
      return "green";
    case "failed":
      return "red";
    case "pending":
      return "yellow";
    case "draft":
      return "gray";
    case "partial":
      return "yellow";
    default:
      return "gray";
  }
}
