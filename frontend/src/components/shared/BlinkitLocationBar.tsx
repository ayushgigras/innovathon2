"use client";

import React, { useState, useEffect } from "react";
import {
  MapPin,
  ChevronDown,
  Crosshair,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Compass,
} from "lucide-react";
import {
  LocationSelectorModal,
  JK_LOCATION_DIRECTORY,
} from "@/components/shared/LocationSelectorModal";
import { MOCK_ALERTS } from "@/lib/api/mock-adapter";
import type { PublicAlert } from "@/types";

interface BlinkitLocationBarProps {
  className?: string;
  autoPromptIfUnset?: boolean;
}

export function BlinkitLocationBar({
  className = "",
  autoPromptIfUnset = true,
}: BlinkitLocationBarProps): React.ReactElement {
  const [district, setDistrict] = useState<string>("All J&K");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [alerts, setAlerts] = useState<PublicAlert[]>(MOCK_ALERTS);

  useEffect(() => {
    const syncDistrictAndAlerts = () => {
      try {
        const storedDist = localStorage.getItem("aapda_citizen_district");
        if (storedDist) {
          setDistrict(storedDist);
        } else if (autoPromptIfUnset) {
          // If the user hasn't selected a district yet, automatically prompt them like Blinkit!
          setIsModalOpen(true);
        }

        const storedAlerts = localStorage.getItem("aapda_grid_alerts");
        if (storedAlerts) {
          const parsed = JSON.parse(storedAlerts);
          if (Array.isArray(parsed) && parsed.length > 0) setAlerts(parsed);
        }
      } catch (e) {
        console.warn("Location sync:", e);
      }
    };

    syncDistrictAndAlerts();
    window.addEventListener("aapda_district_changed", syncDistrictAndAlerts);
    window.addEventListener("aapda_alerts_updated", syncDistrictAndAlerts);
    window.addEventListener("storage", syncDistrictAndAlerts);

    return () => {
      window.removeEventListener("aapda_district_changed", syncDistrictAndAlerts);
      window.removeEventListener("aapda_alerts_updated", syncDistrictAndAlerts);
      window.removeEventListener("storage", syncDistrictAndAlerts);
    };
  }, [autoPromptIfUnset]);

  const handleSelectDistrict = (newDist: string) => {
    setDistrict(newDist);
    try {
      localStorage.setItem("aapda_citizen_district", newDist);
      window.dispatchEvent(new CustomEvent("aapda_district_changed", { detail: newDist }));
    } catch (e) {
      console.warn("Storage set:", e);
    }
  };

  const districtInfo = JK_LOCATION_DIRECTORY.find(
    (d) => d.district.toLowerCase() === district.toLowerCase()
  );

  const activeDistrictAlerts = alerts.filter(
    (a) =>
      a.isActive &&
      (district === "All J&K" ||
        a.district.toLowerCase() === district.toLowerCase() ||
        a.district.toLowerCase() === "all districts")
  );

  const hasAlerts = activeDistrictAlerts.length > 0;

  return (
    <>
      <div
        className={`bg-stone-900 border border-stone-800 hover:border-emerald-500/50 rounded-2xl p-3 sm:p-4 shadow-xl transition-all cursor-pointer group ${className}`}
        onClick={() => setIsModalOpen(true)}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left: Blinkit Style Delivery / Alert Location Pill */}
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 shadow-md ${
                hasAlerts
                  ? "bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse"
                  : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
              }`}
            >
              <MapPin className="w-5 h-5" />
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400">
                  Targeted Alert Sector:
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.2 rounded-full flex items-center gap-1 ${
                    hasAlerts
                      ? "bg-red-500/20 text-red-300 border border-red-500/40"
                      : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  }`}
                >
                  {hasAlerts ? (
                    <>
                      <Radio className="w-2.5 h-2.5 animate-pulse" />
                      {activeDistrictAlerts.length} Active Hazard
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-2.5 h-2.5" /> Corridors Clear
                    </>
                  )}
                </span>
              </div>

              <div className="flex items-center gap-1.5 font-black text-stone-100 text-sm sm:text-base group-hover:text-emerald-300 transition-colors">
                <span>
                  {district === "All J&K"
                    ? "All Jammu & Kashmir (Statewide)"
                    : district === "Jammu"
                    ? "Jammu Sector (University of Jammu Area)"
                    : `${district} Sector`}
                </span>
                <ChevronDown className="w-4 h-4 text-emerald-400 group-hover:translate-y-0.5 transition-transform" />
              </div>

              <p className="text-[11px] text-stone-400 truncate max-w-sm sm:max-w-md">
                {districtInfo ? `${districtInfo.tagline} · ${districtInfo.corridors}` : "Receiving regional broadcasts across all 10 mountain corridors."}
              </p>
            </div>
          </div>

          {/* Right: Quick Change / GPS Action */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsModalOpen(true);
              }}
              className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-stone-700 shadow-sm"
            >
              <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
              <span>Change Area / GPS</span>
            </button>
          </div>
        </div>
      </div>

      {/* Blinkit Location Selector Dialog */}
      <LocationSelectorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentDistrict={district}
        onSelectDistrict={handleSelectDistrict}
        alerts={alerts}
      />
    </>
  );
}
