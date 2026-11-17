"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Radio, ArrowRight, X } from "lucide-react";
import { MOCK_ALERTS } from "@/lib/api/mock-adapter";

export function EmergencyAlertBanner(): React.ReactElement | null {
  const [dismissed, setDismissed] = useState(false);
  const activeAlert = MOCK_ALERTS.find((a) => a.isActive && a.severity === "critical") || MOCK_ALERTS[0];

  if (dismissed || !activeAlert) return null;

  return (
    <div className="bg-gradient-to-r from-red-950 via-red-900 to-stone-900 border-b border-red-700/60 text-white px-4 py-2 text-xs flex items-center justify-between gap-3 shadow-md">
      <div className="flex items-center gap-2 overflow-hidden">
        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-600 font-bold uppercase text-[10px] tracking-wider shrink-0 animate-pulse">
          <Radio className="w-3 h-3" />
          ALERT
        </span>
        <span className="font-bold truncate text-red-100">{activeAlert.title}:</span>
        <span className="text-red-200 hidden sm:inline truncate">{activeAlert.message}</span>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <Link
          href="/dashboard/roads"
          className="text-[11px] font-bold text-amber-300 hover:text-white flex items-center gap-1 transition-colors underline underline-offset-2"
        >
          View Alternate Routes <ArrowRight className="w-3 h-3" />
        </Link>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-red-300 hover:text-white p-0.5 rounded hover:bg-red-800/50"
          aria-label="Dismiss alert banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
