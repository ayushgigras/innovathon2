"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Eye,
  Map,
  Package,
  Shield,
  ChevronLeft,
  ChevronRight,
  FileText,
  Truck,
  Archive,
  MapPin,
  ClipboardList,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────
interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

interface NavGroup {
  group: string;
  icon: React.ElementType;
  items: NavItem[];
}

// ─── Navigation Structure ─────────────────────────────────────────────────────
const NAV_GROUPS: (NavItem | NavGroup)[] = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    group: "AAPDA Lens",
    icon: Eye,
    items: [
      { label: "Incidents", href: "/dashboard/incidents", icon: AlertTriangle },
      { label: "Report Public", href: "/dashboard/incidents/report", icon: FileText },
    ],
  },
  {
    group: "MargRakshak",
    icon: Map,
    items: [
      { label: "Road Map", href: "/dashboard/roads", icon: Map },
      { label: "Settlements", href: "/dashboard/roads/settlements", icon: MapPin },
    ],
  },
  {
    group: "RahatGrid",
    icon: Package,
    items: [
      { label: "Relief Requests", href: "/dashboard/relief", icon: ClipboardList },
      { label: "Inventory", href: "/dashboard/relief/inventory", icon: Archive },
      { label: "Allocations", href: "/dashboard/relief/allocations", icon: Package },
      { label: "Deliveries", href: "/dashboard/relief/deliveries", icon: Truck },
    ],
  },
];

const ROLE_LABELS: Record<UserRole, string> = {
  citizen: "Citizen",
  ddma_officer: "DDMA Officer",
  field_officer: "Field Officer",
  ngo_partner: "NGO Partner",
};

function isNavGroup(item: NavItem | NavGroup): item is NavGroup {
  return "group" in item;
}

// ─── Sidebar Component ────────────────────────────────────────────────────────
interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [role, setRole] = useState<UserRole>("ddma_officer");
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
            <span className="text-slate-100 font-semibold text-sm leading-tight block truncate">
              AAPDA Grid
            </span>
            <span className="text-slate-500 text-xs leading-tight block truncate">
              Disaster Intelligence
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
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5 text-slate-600" />
        )}
      </button>

      {/* ── Navigation ───────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1" aria-label="Sidebar navigation">
        {NAV_GROUPS.map((item) => {
          if (!isNavGroup(item)) {
            // Top-level nav item
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group",
                  active
                    ? "bg-emerald-500/15 text-emerald-700 font-semibold border-l-2 border-emerald-600 pl-[10px]"
                    : "text-slate-500 hover:bg-slate-800/80 hover:text-slate-900 border-l-2 border-transparent"
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon
                  className={cn(
                    "w-5 h-5 flex-shrink-0",
                    active ? "text-emerald-700" : "text-slate-500 group-hover:text-slate-700"
                  )}
                  aria-hidden="true"
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          }

          // Nav group
          const GroupIcon = item.icon;
          const hasActiveChild = item.items.some((child) => isActive(child.href));

          return (
            <div key={item.group} className="space-y-0.5">
              {/* Group header */}
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-xs font-semibold uppercase tracking-wider",
                  hasActiveChild ? "text-emerald-700" : "text-slate-500"
                )}
                aria-label={`${item.group} section`}
              >
                <GroupIcon
                  className={cn(
                    "w-4 h-4 flex-shrink-0",
                    hasActiveChild ? "text-emerald-700" : "text-slate-500"
                  )}
                  aria-hidden="true"
                />
                {!collapsed && <span className="truncate">{item.group}</span>}
              </div>

              {/* Group items */}
              {item.items.map((child) => {
                const active = isActive(child.href);
                const ChildIcon = child.icon;
                return (
                  <Link
                    key={child.href}
                    href={child.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 group",
                      collapsed ? "" : "ml-2",
                      active
                        ? "bg-emerald-500/15 text-emerald-700 font-semibold border-l-2 border-emerald-600 pl-[10px]"
                        : "text-slate-500 hover:bg-slate-800/80 hover:text-slate-900 border-l-2 border-transparent"
                    )}
                    title={collapsed ? child.label : undefined}
                  >
                    <ChildIcon
                      className={cn(
                        "w-4 h-4 flex-shrink-0",
                        active ? "text-emerald-700" : "text-slate-500 group-hover:text-slate-700"
                      )}
                      aria-hidden="true"
                    />
                    {!collapsed && <span className="truncate">{child.label}</span>}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* ── Bottom: Role Switcher + DEMO Badge ───────────────────────────── */}
      <div className="border-t border-slate-800 p-3 space-y-3">
        {/* Role Switcher */}
        {!collapsed && (
          <div className="space-y-1">
            <label
              htmlFor="role-switcher"
              className="text-xs text-slate-500 uppercase tracking-wide font-medium"
            >
              Demo Role
            </label>
            <select
              id="role-switcher"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full bg-slate-800 border border-slate-700 rounded-md text-slate-900 text-xs px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              aria-label="Switch demo user role"
            >
              {(Object.entries(ROLE_LABELS) as [UserRole, string][]).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* DEMO Badge */}
        <div
          className={cn(
            "flex items-center gap-2 px-2 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-md",
            collapsed ? "justify-center" : ""
          )}
          title="DEMO / SIMULATED environment — not real data"
        >
          <AlertTriangle
            className="w-3.5 h-3.5 text-amber-500 flex-shrink-0"
            aria-hidden="true"
          />
          {!collapsed && (
            <span className="text-amber-700 text-xs font-semibold">DEMO / SIMULATED</span>
          )}
        </div>
      </div>
    </aside>
  );
}
