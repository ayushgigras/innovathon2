"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ShieldAlert,
  ArrowLeft,
  Radio,
  LogOut,
  ShieldCheck,
  LayoutDashboard,
  Eye,
  MapPin,
  CloudRain,
  Layers,
  Package,
  Truck,
  Sparkles,
  Lock,
} from "lucide-react";
import { DemoBadge } from "@/components/shared/DemoBadge";

const ADMIN_NAV = [
  { href: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/incidents", label: "Incidents Queue", icon: Eye },
  { href: "/admin/communications", label: "Public Communications", icon: Radio },
  { href: "/admin/roads", label: "Mountain Roads", icon: MapPin },
  { href: "/admin/weather", label: "Weather Explorer", icon: CloudRain },
  { href: "/admin/satellite", label: "Satellite Passes", icon: Layers },
  { href: "/admin/relief", label: "Relief Allocations", icon: Package },
  { href: "/admin/dispatch", label: "Field Dispatch", icon: Truck },
  { href: "/admin/intelligence", label: "Multi-Source AI", icon: Sparkles },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: ShieldCheck },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [officerName, setOfficerName] = useState<string>("Commander R. Sharma (DDMA Ramban)");

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) {
      setIsAuthenticated(true);
      return;
    }
    const session = typeof window !== "undefined" ? localStorage.getItem("aapda_admin_session") : null;
    const user = typeof window !== "undefined" ? localStorage.getItem("aapda_admin_user") : null;
    if (session === "authenticated") {
      setIsAuthenticated(true);
      if (user) setOfficerName(user);
    } else {
      setIsAuthenticated(false);
      router.replace("/admin/login");
    }
  }, [pathname, isLoginPage, router]);

  const handleLogout = () => {
    try {
      localStorage.removeItem("aapda_admin_session");
      localStorage.removeItem("aapda_admin_user");
    } catch (e) {
      console.error(e);
    }
    router.replace("/admin/login");
  };

  // If on login page, render child directly without top command header
  if (isLoginPage) {
    return <>{children}</>;
  }

  // If verifying authentication, render secure splash gate
  if (isAuthenticated === null || isAuthenticated === false) {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center p-6 text-stone-300 space-y-4">
        <div className="p-3 bg-red-600/20 border border-red-600/40 rounded-2xl text-red-500 animate-pulse">
          <Lock className="w-8 h-8" />
        </div>
        <p className="text-sm font-semibold tracking-wide">
          Verifying EOC Administrative Credentials...
        </p>
        <p className="text-xs text-stone-500">
          Redirecting to authorized login terminal if unauthenticated
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col">
      {/* ── Top Command Bar ────────────────────────────────────────────── */}
      <header className="bg-stone-900 border-b border-stone-800 px-6 py-3 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-600/20 border border-red-600/40 rounded-lg text-red-500">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm tracking-wide uppercase text-red-400">
                AAPDA GRID — RESTRICTED CONTROL ROOM
              </span>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                LIVE EOC ACTIVE
              </span>
            </div>
            <p className="text-xs text-stone-400">
              State Emergency Operations Centre (SEOC) &amp; District Disaster Management Authority (DDMA)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <DemoBadge variant="inline" />
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-stone-800 border border-stone-700 rounded-lg text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-stone-300">Commander: <strong>{officerName}</strong></span>
          </div>

          <Link
            href="/dashboard/roads"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-semibold border border-stone-700 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Public View
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-red-950/40 hover:bg-red-900/40 text-red-400 border border-red-800/60 rounded-lg text-xs font-medium transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </header>

      {/* ── Sub-Navigation Bar ─────────────────────────────────────────── */}
      <nav className="bg-stone-900/90 border-b border-stone-800 px-6 py-1.5 flex items-center gap-1 overflow-x-auto text-xs sticky top-[57px] z-40 backdrop-blur-md">
        {ADMIN_NAV.map((nav) => {
          const Icon = nav.icon;
          const isActive = pathname === nav.href;
          return (
            <Link
              key={nav.href}
              href={nav.href}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? "bg-red-600 text-white font-bold shadow-sm"
                  : "text-stone-400 hover:text-stone-100 hover:bg-stone-800"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{nav.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* ── Main Body ──────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
        {children}
      </main>
    </div>
  );
}
