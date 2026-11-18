"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  MapPin,
  Users,
  Map,
  ArrowRight,
  ShieldAlert,
  Search,
  CheckCircle2,
  Radio,
  Navigation,
  Compass,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import {
  computeDemoStats,
  MOCK_INCIDENTS,
  MOCK_ROADS,
  MOCK_ALERTS,
  MOCK_SETTLEMENTS,
  MOCK_RELIEF_REQUESTS,
} from "@/lib/api/mock-adapter";
import type { Incident, PublicAlert, RoadSegment } from "@/types";
import { AlertDetailModal } from "@/components/shared/AlertDetailModal";
import { BlinkitLocationBar } from "@/components/shared/BlinkitLocationBar";
import { CitizenNotificationBell } from "@/components/shared/CitizenNotificationBell";
import { getAlternateRouteForDistrict } from "@/lib/api/alternate-routes";

const POPULAR_DISTRICTS = ["All J&K", "Jammu", "Ramban", "Udhampur", "Doda", "Shopian", "Kishtwar", "Srinagar"];

export default function DashboardPage(): React.ReactElement {
  const [incidents, setIncidents] = useState<Incident[]>(MOCK_INCIDENTS);
  const [alerts, setAlerts] = useState<PublicAlert[]>(MOCK_ALERTS);
  const [roads, setRoads] = useState<RoadSegment[]>(MOCK_ROADS);
  const [userDistrict, setUserDistrict] = useState<string>("All J&K");
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<PublicAlert | null>(null);

  // Sync with live state across tabs
  useEffect(() => {
    const syncAll = () => {
      try {
        const storedInc = localStorage.getItem("aapda_grid_incidents");
        if (storedInc) {
          const parsed = JSON.parse(storedInc);
          if (Array.isArray(parsed) && parsed.length > 0) setIncidents(parsed);
        }

        const storedAlerts = localStorage.getItem("aapda_grid_alerts");
        if (storedAlerts) {
          const parsed = JSON.parse(storedAlerts);
          if (Array.isArray(parsed) && parsed.length > 0) setAlerts(parsed);
        }

        const storedRoads = localStorage.getItem("aapda_grid_roads");
        if (storedRoads) {
          const parsed = JSON.parse(storedRoads);
          if (Array.isArray(parsed) && parsed.length > 0) setRoads(parsed);
        }

        const storedDist = localStorage.getItem("aapda_citizen_district");
        if (storedDist) {
          setUserDistrict(storedDist);
        }
      } catch (e) {
        console.warn("Dashboard sync error:", e);
      }
    };

    syncAll();
    window.addEventListener("aapda_incidents_updated", syncAll);
    window.addEventListener("aapda_alerts_updated", syncAll);
    window.addEventListener("aapda_roads_updated", syncAll);
    window.addEventListener("aapda_district_changed", syncAll);
    window.addEventListener("storage", syncAll);

    return () => {
      window.removeEventListener("aapda_incidents_updated", syncAll);
      window.removeEventListener("aapda_alerts_updated", syncAll);
      window.removeEventListener("aapda_roads_updated", syncAll);
      window.removeEventListener("aapda_district_changed", syncAll);
      window.removeEventListener("storage", syncAll);
    };
  }, []);

  const handleSelectDistrict = (dist: string) => {
    setUserDistrict(dist);
    try {
      localStorage.setItem("aapda_citizen_district", dist);
      window.dispatchEvent(new CustomEvent("aapda_district_changed", { detail: dist }));
    } catch (e) {
      console.warn("Storage district set:", e);
    }
  };

  // Localized alert filtering
  const activeAlerts = alerts.filter((a) => a.isActive);
  const isAll = !userDistrict || userDistrict === "All J&K";

  const matchingAlert = isAll
    ? activeAlerts[0]
    : activeAlerts.find(
        (a) =>
          a.district.toLowerCase() === userDistrict.toLowerCase() ||
          a.district.toLowerCase() === "all districts"
      );

  const primaryAlert = matchingAlert || (isAll ? activeAlerts[0] : null);

  const handleOpenAdvisoryModal = (alertToView: PublicAlert) => {
    setSelectedAlert(alertToView);
    setIsAlertModalOpen(true);
  };

  // Compute live statistics based on synced state
  const totalIncidents = incidents.length;
  const criticalIncidents = incidents.filter((i) => i.severity === "critical").length;
  const roadsClosed = roads.filter((r) => r.status === "closed").length;
  const roadsPartiallyOpen = roads.filter((r) => r.status === "partially_open").length;
  const isolatedSettlements = MOCK_SETTLEMENTS.filter((s) => s.isIsolated).length;

  const recentIncidents = incidents.slice(0, 4);

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">AAPDA Grid — Citizen Portal</h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time disaster intelligence, mountain road closures &amp; citizen reporting for Jammu &amp; Kashmir
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Top-Right Notification Bell for Field Officer Disaster Updates */}
          <CitizenNotificationBell />

          <Link
            href="/dashboard/roads"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-md"
          >
            <Map className="w-3.5 h-3.5" />
            Open Live GIS Map
          </Link>
          <Link
            href="/dashboard/incidents/report"
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-md"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Report Incident
          </Link>
        </div>
      </div>

      {/* ── Blinkit-Style Citizen Area & GPS Location Selector ────────────── */}
      <div className="space-y-2">
        <BlinkitLocationBar autoPromptIfUnset={true} />

        {/* Quick Corridor Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 px-1 text-xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
            Quick Corridors:
          </span>
          {POPULAR_DISTRICTS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => handleSelectDistrict(d)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                userDistrict === d
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-950 scale-105"
                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
              }`}
            >
              {d === "All J&K" ? "All J&K Feed" : d}
            </button>
          ))}
        </div>
      </div>

      {/* ── Official Emergency Broadcast Card (Filtered by Citizen Sector) ──── */}
      {primaryAlert ? (
        <div className="p-5 bg-gradient-to-r from-red-950/60 via-red-900/30 to-stone-900 border border-red-500/50 rounded-2xl space-y-3 shadow-xl animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold uppercase text-red-400">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] tracking-wider animate-pulse">
                <Radio className="w-3.5 h-3.5" />
                OFFICIAL EMERGENCY BROADCAST
              </span>
              <span className="text-stone-300 bg-stone-900/80 px-2.5 py-0.5 rounded-full border border-stone-700 text-[10px]">
                {primaryAlert.district} Sector
              </span>
            </div>
            <span className="bg-red-600 text-white px-2 py-0.5 rounded text-[10px] font-bold">
              VERIFIED DDMA
            </span>
          </div>

          <div>
            <h3 className="font-bold text-base text-stone-100">{primaryAlert.title}</h3>
            <p className="text-xs text-red-200/90 mt-1 leading-relaxed">{primaryAlert.message}</p>
          </div>

          {/* Road Closed & Alternate Diversion Route Strip */}
          {(() => {
            const adv = getAlternateRouteForDistrict(primaryAlert.district);
            const alternate = primaryAlert.alternateRoute || adv.alternateRoute;
            const affectedRoad = primaryAlert.affectedRoad || adv.affectedRoad;

            return (
              <div className="bg-stone-950/90 border border-red-500/30 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-red-300 font-bold">
                    <span>🔴 Closed Corridor:</span>
                    <span className="text-white font-mono">{affectedRoad}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-emerald-300 text-[11px]">
                    <span className="font-bold">🟢 Recommended Alternate:</span>
                    <span className="text-emerald-200 font-medium underline">
                      {alternate.name}
                    </span>
                    {alternate.extraTime && (
                      <span className="bg-emerald-950 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded font-mono text-[10px]">
                        {alternate.extraTime}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenAdvisoryModal(primaryAlert)}
                    className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow transition-all hover:scale-[1.02]"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Inspect Details &amp; Alternate Road
                  </button>
                  <Link
                    href="/dashboard/roads"
                    className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold rounded-xl text-xs flex items-center gap-1 transition-colors"
                  >
                    View on Map →
                  </Link>
                </div>
              </div>
            );
          })()}
        </div>
      ) : (
        /* When no active alert in user's selected sector */
        <div className="p-4 bg-emerald-950/30 border border-emerald-500/40 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-stone-100 flex items-center gap-2">
                <span>All Clear in {userDistrict} Sector</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.2 rounded-full border border-emerald-500/40">
                  NORMAL TRAFFIC
                </span>
              </h3>
              <p className="text-stone-400 text-xs mt-0.5">
                No active highway closures or emergency alerts recorded in {userDistrict}. Corridors are clear for transit.
              </p>
            </div>
          </div>

          {activeAlerts.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-amber-400/90 text-[11px]">
                ({activeAlerts.length} alert active in {activeAlerts[0]?.district} Sector)
              </span>
              <button
                type="button"
                onClick={() => handleSelectDistrict("All J&K")}
                className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-semibold transition-colors"
              >
                Show All Regional Advisories
              </button>
            </div>
          )}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Active Hazards"
          value={totalIncidents}
          sub={`${criticalIncidents} critical`}
          icon={AlertTriangle}
          iconColor="text-red-400"
          cardColor="border-red-500/20"
          href="/dashboard/roads"
        />
        <SummaryCard
          title="Road Closures"
          value={roadsClosed}
          sub={`${roadsPartiallyOpen} partial`}
          icon={Map}
          iconColor="text-orange-400"
          cardColor="border-orange-500/20"
          href="/dashboard/roads"
        />
        <SummaryCard
          title="Cut-Off Villages"
          value={isolatedSettlements}
          sub="awaiting clearance"
          icon={Users}
          iconColor="text-purple-400"
          cardColor="border-purple-500/20"
          href="/dashboard/roads/settlements"
        />
        <SummaryCard
          title="Citizen Tracking"
          value="Track"
          sub="check report ID"
          icon={Search}
          iconColor="text-emerald-400"
          cardColor="border-emerald-500/20"
          href="/track"
        />
      </div>

      {/* Citizen Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CitizenFeatureCard
          title="Live Mountain Road Map"
          description="Interactive satellite & street view showing road-following closures, landslides, and calculated Mughal Road bypass routes."
          icon={Map}
          actionLabel="Explore Mountain Corridors"
          href="/dashboard/roads"
        />
        <CitizenFeatureCard
          title="Citizen Incident Reporting"
          description="Submit eyewitness reports for landslides, floods, or blocked roads. Instant Report ID generated to track DDMA review."
          icon={AlertTriangle}
          actionLabel="File a Disaster Report"
          href="/dashboard/incidents/report"
        />
        <CitizenFeatureCard
          title="Track Report Status"
          description="Check official review progression from submission to field verification and emergency road response."
          icon={Search}
          actionLabel="Track Your Report ID"
          href="/track"
        />
      </div>

      {/* Recent Public Incidents */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-slate-100 font-bold text-sm flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            Reported Disasters in Jammu &amp; Kashmir ({incidents.length})
          </h2>
          <Link
            href="/dashboard/roads"
            className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
          >
            View on Live Map <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="space-y-2">
          {recentIncidents.map((inc) => (
            <Link
              key={inc.id}
              href="/dashboard/roads"
              className="flex items-center justify-between gap-4 p-3 bg-slate-950/60 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full shrink-0 ${inc.severity === "critical" ? "bg-red-500" : "bg-amber-500"}`} />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-slate-200 text-xs font-bold truncate max-w-md">{inc.title}</p>
                    {(inc.reportCount ?? 1) > 1 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded">
                        {inc.reportCount} reports
                      </span>
                    )}
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    {inc.district} Sector · {new Date(inc.reportedAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase shrink-0 ${
                  inc.status === "verified"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                }`}
              >
                {inc.status.replace("_", " ")}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Modal with Full Highway Closure & Alternate Route Details */}
      <AlertDetailModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        alert={selectedAlert}
      />
    </div>
  );
}

function SummaryCard({
  title,
  value,
  sub,
  icon: Icon,
  iconColor,
  cardColor,
  href,
}: {
  title: string;
  value: number | string;
  sub: string;
  icon: React.ElementType;
  iconColor: string;
  cardColor: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className={`block p-4 rounded-2xl bg-slate-900 border ${cardColor} hover:border-slate-700 transition-all shadow-md group`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400 font-semibold">{title}</span>
        <Icon className={`w-4 h-4 ${iconColor} group-hover:scale-110 transition-transform`} />
      </div>
      <p className="text-2xl font-black text-slate-100 mt-2">{value}</p>
      <p className="text-[11px] text-slate-500 mt-0.5">{sub}</p>
    </Link>
  );
}

function CitizenFeatureCard({
  title,
  description,
  icon: Icon,
  actionLabel,
  href,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  actionLabel: string;
  href: string;
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-3 shadow-md">
      <div className="space-y-2">
        <div className="p-2.5 bg-slate-800 w-fit rounded-xl text-emerald-400">
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="font-bold text-sm text-slate-100">{title}</h3>
        <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
      </div>

      <Link
        href={href}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 pt-1"
      >
        <span>{actionLabel}</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
