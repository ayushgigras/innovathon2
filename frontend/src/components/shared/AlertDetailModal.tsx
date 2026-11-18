"use client";

import React from "react";
import Link from "next/link";
import {
  ShieldAlert,
  AlertTriangle,
  Radio,
  CheckCircle2,
  Navigation,
  PhoneCall,
  Clock,
  MapPin,
  ArrowRight,
  X,
  ExternalLink,
} from "lucide-react";
import type { PublicAlert } from "@/types";
import { getAlternateRouteForDistrict } from "@/lib/api/alternate-routes";

interface AlertDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  alert: PublicAlert | null;
}

export function AlertDetailModal({
  isOpen,
  onClose,
  alert,
}: AlertDetailModalProps): React.ReactElement | null {
  if (!isOpen || !alert) return null;

  const advisory = getAlternateRouteForDistrict(alert.district);
  const affectedRoad = alert.affectedRoad || advisory.affectedRoad;
  const closureReason = alert.closureReason || advisory.closureReason;
  const alternate = alert.alternateRoute || advisory.alternateRoute;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-stone-900 border border-red-500/40 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl space-y-0">
        {/* Banner Header */}
        <div className="p-5 bg-gradient-to-r from-red-950 via-red-900 to-stone-900 border-b border-red-700/60 flex items-start justify-between text-white">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-600 font-bold uppercase text-[10px] tracking-wider animate-pulse">
                <Radio className="w-3.5 h-3.5" />
                OFFICIAL DDMA ADVISORY
              </span>
              <span className="text-[11px] bg-stone-950/70 border border-stone-700 px-2 py-0.5 rounded-full text-stone-300 font-medium">
                {alert.district} Sector
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                VERIFIED ROAD CLOSURE
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-stone-100">{alert.title}</h2>
            <div className="flex items-center gap-2 text-[11px] text-red-200/80">
              <Clock className="w-3.5 h-3.5" />
              <span>Issued: {new Date(alert.issuedAt).toLocaleTimeString()} ({alert.source})</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto text-xs text-stone-300">
          {/* Section 1: What Happened */}
          <div className="bg-stone-950/80 border border-stone-800 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-stone-100 font-bold text-sm">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span>Incident &amp; Hazard Briefing</span>
            </div>
            <p className="text-stone-300 leading-relaxed text-xs">{alert.message}</p>
          </div>

          {/* Section 2: Highway Status */}
          <div className="bg-red-950/30 border border-red-500/40 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-red-300">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                <span>Highway Status: CLOSED / BLOCKED</span>
              </div>
              <span className="text-[10px] bg-red-600 text-white font-bold px-2 py-0.5 rounded">
                NO THROUGH TRAFFIC
              </span>
            </div>

            <div className="space-y-1">
              <p className="font-semibold text-stone-100 text-xs">
                🔴 Affected Corridor: <span className="text-red-200">{affectedRoad}</span>
              </p>
              <p className="text-stone-400 text-[11px]">
                <strong>Clearance Operations:</strong> {closureReason}
              </p>
            </div>
          </div>

          {/* Section 3: Recommended Alternate / Diversion Route */}
          <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-emerald-300 text-sm">
                <Navigation className="w-4 h-4 text-emerald-400" />
                <span>Recommended Alternate / Diversion Route</span>
              </div>
              <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded">
                OPEN FOR TRAFFIC
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-baseline justify-between gap-2">
                <h4 className="font-bold text-emerald-200 text-xs sm:text-sm">
                  🟢 {alternate.name}
                </h4>
                {alternate.extraTime && (
                  <span className="text-[11px] font-mono font-bold text-amber-400 bg-amber-950/50 px-2 py-0.5 rounded border border-amber-500/30 shrink-0">
                    {alternate.extraTime}
                  </span>
                )}
              </div>

              <p className="text-emerald-100/90 text-xs leading-relaxed">
                {alternate.description}
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-emerald-500/20 text-[11px]">
                <span className="text-stone-400">Passable For:</span>
                <span className="font-bold text-emerald-300 bg-emerald-900/40 px-2 py-0.5 rounded">
                  {alternate.passableFor}
                </span>
                <span className="text-stone-400 ml-auto">On-ground Post:</span>
                <span className="text-stone-300 font-medium">{advisory.fieldPost}</span>
              </div>
            </div>
          </div>

          {/* Section 4: Public Action Hotline */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-stone-950 rounded-2xl border border-stone-800 text-stone-400 text-xs">
            <div className="flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-blue-400" />
              <span>Highway Police &amp; Traffic Helpline:</span>
              <strong className="text-stone-200">{advisory.helpline}</strong>
            </div>
            <a
              href={`tel:${advisory.helpline}`}
              className="px-3 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg font-medium transition-colors"
            >
              Dial Helpline
            </a>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-stone-950 border-t border-stone-800 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-semibold transition-colors"
          >
            Close Advisory
          </button>

          <Link
            href="/dashboard/roads"
            onClick={onClose}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-950 transition-all hover:scale-[1.02]"
          >
            <Navigation className="w-4 h-4" />
            Open Live GIS Map with Diversion Highlighted
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
