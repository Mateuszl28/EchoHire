"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  GitCompareArrows,
  Sparkles,
  PlusCircle,
} from "lucide-react";

const NAV = [
  { href: "/",           label: "Dashboard",   icon: LayoutDashboard, match: (p: string) => p === "/" },
  { href: "/candidates", label: "Candidates",  icon: Users,           match: (p: string) => p.startsWith("/candidates") },
  { href: "/jobs",       label: "Jobs",        icon: Briefcase,       match: (p: string) => p.startsWith("/jobs") },
  { href: "/match",      label: "Match",       icon: Sparkles,        match: (p: string) => p.startsWith("/match") },
  { href: "/compare",    label: "Compare",     icon: GitCompareArrows,match: (p: string) => p.startsWith("/compare") },
];

export function Sidebar() {
  const pathname = usePathname() || "/";
  return (
    <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-border bg-card">
      <Link
        href="/"
        className="flex items-center gap-2 h-14 px-4 border-b border-border"
      >
        <div className="h-7 w-7 rounded-md bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
          E
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold tracking-tight">EchoHire</div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            AI recruiter · v1
          </div>
        </div>
      </Link>

      <nav className="flex-1 p-2 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                active
                  ? "bg-secondary text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border">
        <Link
          href="/candidates?new=1"
          className="flex items-center justify-center gap-2 rounded-md bg-foreground text-background px-3 py-2 text-xs font-medium hover:opacity-90 transition-opacity"
        >
          <PlusCircle className="h-3.5 w-3.5" />
          New candidate
        </Link>
        <p className="mt-3 text-[10px] text-muted-foreground leading-relaxed">
          Data lives locally in your browser. <br />
          Open the dashboard to load samples.
        </p>
      </div>
    </aside>
  );
}
