"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Map,
  Shield,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Search,
  MapPin,
  Lock,
  LayoutDashboard,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const PUBLIC_NAV: NavItem[] = [
  {
    label: "Mountain Road Map",
    href: "/dashboard/roads",
    icon: Map,
  },
  {
    label: "Public Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Report Disaster Incident",
    href: "/dashboard/incidents/report",
    icon: AlertTriangle,
  },
  {
    label: "Track Your Report",
    href: "/track",
    icon: Search,
  },
  {
    label: "Settlement Status",
    href: "/dashboard/roads/settlements",
    icon: MapPin,
  },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <aside
      aria-label="Main navigation"
      className={cn(
        "relative flex flex-col h-full bg-slate-900 border-r border-slate-800 transition-all duration-300",
        collapsed ? "w-16" : "w-60",
        className
      )}
    >
      {/* ── Logo ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-800">
        <Shield className="w-7 h-7 text-emerald-500 flex-shrink-0" aria-hidden="true" />
        {!collapsed && (
          <div className="overflow-hidden">
            <span className="text-slate-100 font-bold text-sm leading-tight block truncate">
              AAPDA Grid
            </span>
            <span className="text-slate-400 text-xs leading-tight block truncate">
              Citizen Disaster Portal
            </span>
          </div>
        )}
      </div>

      {/* ── Collapse Toggle ───────────────────────────────────────────────── */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="absolute -right-3 top-14 z-10 w-6 h-6 rounded-full bg-slate-800 border border-slate-700 shadow-sm flex items-center justify-center hover:bg-slate-700 transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
        )}
      </button>

      {/* ── Navigation ───────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1.5" aria-label="Public navigation">
        {PUBLIC_NAV.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group",
                active
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-200"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                className={cn(
                  "w-4 h-4 flex-shrink-0",
                  active ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                )}
                aria-hidden="true"
              />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* ── Bottom: Official EOC Admin Login Only ─────────────────────────── */}
      <div className="border-t border-slate-800 p-3">
        <Link
          href="/admin/login"
          className={cn(
            "flex items-center gap-2.5 px-3 py-2 bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700/80 transition-colors",
            collapsed ? "justify-center px-2" : ""
          )}
          title="Restricted EOC Officer Login"
        >
          <Lock className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          {!collapsed && <span>Official EOC Login</span>}
        </Link>
      </div>
    </aside>
  );
}
