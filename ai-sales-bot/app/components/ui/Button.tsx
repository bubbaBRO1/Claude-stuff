"use client";
import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: ReactNode;
}

export default function Button({
  variant = "primary",
  size = "md",
  loading,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 font-medium rounded transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed select-none";

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  const variants = {
    primary:
      "bg-[#00ff88] text-black hover:bg-[#00cc6a] active:scale-[0.97]",
    ghost:
      "bg-transparent text-[#a1a1aa] hover:text-white hover:bg-white/5 active:scale-[0.97]",
    danger:
      "bg-red-600/20 text-red-400 border border-red-600/40 hover:bg-red-600/30 active:scale-[0.97]",
    outline:
      "bg-transparent text-[#00ff88] border border-[#00ff88]/40 hover:border-[#00ff88] hover:bg-[#00ff88]/5 active:scale-[0.97]",
  };

  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}
