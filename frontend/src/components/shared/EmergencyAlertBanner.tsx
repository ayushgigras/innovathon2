"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Radio, ArrowRight, X, ShieldAlert, CheckCircle2, MapPin } from "lucide-react";
import { MOCK_ALERTS } from "@/lib/api/mock-adapter";
import type { PublicAlert } from "@/types";
import { AlertDetailModal } from "@/components/shared/AlertDetailModal";
import { CitizenNotificationBell } from "@/components/shared/CitizenNotificationBell";

export function EmergencyAlertBanner(): React.ReactElement | null {
  const [dismissed, setDismissed] = useState(false);
  const [alerts, setAlerts] = useState<PublicAlert[]>(MOCK_ALERTS);
  const [userDistrict, setUserDistrict] = useState<string>("All J&K");
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [modalAlert, setModalAlert] = useState<PublicAlert | null>(null);

  useEffect(() => {
    const syncAlertsAndDistrict = () => {
      try {
        const storedAlerts = localStorage.getItem("aapda_grid_alerts");
        if (storedAlerts) {
          const parsed = JSON.parse(storedAlerts) as PublicAlert[];
          if (Array.isArray(parsed) && parsed.length > 0) setAlerts(parsed);
        }
        const storedDist = localStorage.getItem("aapda_citizen_district");
        if (storedDist) {
          setUserDistrict(storedDist);
        }
      } catch (err) {
        console.warn("Banner sync error:", err);
      }
    };

    syncAlertsAndDistrict();
    window.addEventListener("aapda_alerts_updated", syncAlertsAndDistrict);
    window.addEventListener("aapda_district_changed", syncAlertsAndDistrict);
    window.addEventListener("storage", syncAlertsAndDistrict);

    return () => {
      window.removeEventListener("aapda_alerts_updated", syncAlertsAndDistrict);
      window.removeEventListener("aapda_district_changed", syncAlertsAndDistrict);
      window.removeEventListener("storage", syncAlertsAndDistrict);
    };
  }, []);

  if (dismissed) return null;

  // Filter alert based on user's localized sector
  const activeAlerts = alerts.filter((a) => a.isActive);
  const isAll = !userDistrict || userDistrict === "All J&K";

  const localAlert = isAll
    ? activeAlerts[0]
    : activeAlerts.find(
        (a) =>
          a.district.toLowerCase() === userDistrict.toLowerCase() ||
          a.district.toLowerCase() === "all districts"
      );

  const anyOtherAlert = activeAlerts[0];

  const handleOpenAlert = (alertToOpen: PublicAlert) => {
    setModalAlert(alertToOpen);
    setIsDetailOpen(true);
  };

  return (
    <>
      {localAlert ? (
        <div className="bg-gradient-to-r from-red-950 via-red-900 to-stone-900 border-b border-red-700/60 text-white px-4 py-2 text-xs flex items-center justify-between gap-3 shadow-md animate-in slide-in-from-top duration-300">
          <div
            onClick={() => handleOpenAlert(localAlert)}
            className="flex items-center gap-2 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
            title="Click to view full road closure details and alternate diversion routes"
          >
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-600 font-bold uppercase text-[10px] tracking-wider shrink-0 animate-pulse">
              <Radio className="w-3 h-3" />
              EMERGENCY ALERT ({localAlert.district})
            </span>
            <span className="font-bold truncate text-red-100">{localAlert.title}:</span>
            <span className="text-red-200 hidden md:inline truncate">{localAlert.message}</span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => handleOpenAlert(localAlert)}
              className="text-[11px] font-bold text-amber-300 hover:text-white flex items-center gap-1 transition-colors underline underline-offset-2"
            >
              View Details &amp; Alternate Route <ArrowRight className="w-3 h-3" />
            </button>
            <CitizenNotificationBell className="p-1.5 rounded-lg bg-red-950/80 hover:bg-red-800 border-red-700/60" />
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
      ) : anyOtherAlert ? (
        <div className="bg-stone-900/90 border-b border-stone-800 text-stone-300 px-4 py-1.5 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              All Clear in {userDistrict}
            </span>
            <span className="text-stone-500">|</span>
            <span className="text-stone-400 text-[11px] truncate">
              Notice: Highway closure active in neighboring {anyOtherAlert.district} Sector ({anyOtherAlert.affectedRoad || "NH-44"}).
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleOpenAlert(anyOtherAlert)}
              className="text-[11px] text-amber-400 hover:text-amber-300 underline font-medium"
            >
              Inspect {anyOtherAlert.district} Advisory →
            </button>
            <CitizenNotificationBell className="p-1.5 rounded-lg bg-red-950/80 hover:bg-red-800 border-red-700/60" />
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="text-stone-400 hover:text-stone-200 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : null}

      {/* Modal with Full Highway Closure & Alternate Route Details */}
      <AlertDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        alert={modalAlert}
      />
    </>
  );
}
