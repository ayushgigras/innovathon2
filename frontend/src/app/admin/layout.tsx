import React from "react";
import Link from "next/link";
import { ShieldAlert, ArrowLeft, Radio, LogOut, ShieldCheck } from "lucide-react";
import { DemoBadge } from "@/components/shared/DemoBadge";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
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
            <span className="text-stone-300">Commander: <strong>R. Sharma (DDMA Ramban)</strong></span>
          </div>

          <Link
            href="/dashboard/roads"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-semibold border border-stone-700 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Public View
          </Link>

          <Link
            href="/admin/login"
            className="flex items-center gap-1 px-2.5 py-1.5 bg-red-950/40 hover:bg-red-900/40 text-red-400 border border-red-800/60 rounded-lg text-xs font-medium transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </Link>
        </div>
      </header>

      {/* ── Main Body ──────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
        {children}
      </main>
    </div>
  );
}
