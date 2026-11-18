"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Radio,
  Send,
  MapPin,
  Eye,
  Package,
  Layers,
  Sparkles,
  Clock,
  Compass,
  ArrowRight,
  RefreshCw,
  FileCheck,
  Users,
  PhoneCall,
} from "lucide-react";
import { getFieldOfficerForDistrict } from "@/lib/api/field-officers";
import { getAlternateRouteForDistrict } from "@/lib/api/alternate-routes";
import { FieldOfficerCallModal } from "@/components/shared/FieldOfficerCallModal";
import { RahatGridReliefConsole } from "@/components/relief/RahatGridReliefConsole";

const WeatherExplorer = dynamic(
  () => import("@/components/weather/WeatherExplorer").then((mod) => mod.WeatherExplorer),
  {
    ssr: false,
    loading: () => (
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 text-center text-xs text-stone-400">
        <RefreshCw className="w-5 h-5 text-emerald-400 mx-auto animate-spin mb-2" />
        Loading Live Open-Meteo Weather Explorer...
      </div>
    ),
  }
);
import {
  MOCK_INCIDENTS,
  MOCK_ROADS,
  MOCK_SETTLEMENTS,
  MOCK_ALERTS,
  MOCK_RELIEF_REQUESTS,
  broadcastAlert,
  updateRoadStatusMock,
} from "@/lib/api/mock-adapter";
import type { Incident, RoadSegment, PublicAlert } from "@/types";

export default function AdminDashboardPage(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<"queue" | "alerts" | "roads" | "relief" | "monitoring">("queue");

  // State
  const [incidents, setIncidents] = useState<Incident[]>(MOCK_INCIDENTS);
  const [roads, setRoads] = useState<RoadSegment[]>(MOCK_ROADS);
  const [alerts, setAlerts] = useState<PublicAlert[]>(MOCK_ALERTS);

  // Live Sync with citizen submissions across tabs and pages
  useEffect(() => {
    const syncFromStorage = () => {
      try {
        const stored = localStorage.getItem("aapda_grid_incidents");
        if (stored) {
          const parsed = JSON.parse(stored) as Incident[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            setIncidents(parsed);
          }
        }
      } catch (err) {
        console.warn("Incident storage sync:", err);
      }
    };
    syncFromStorage();
    window.addEventListener("aapda_incidents_updated", syncFromStorage);
    window.addEventListener("storage", syncFromStorage);
    return () => {
      window.removeEventListener("aapda_incidents_updated", syncFromStorage);
      window.removeEventListener("storage", syncFromStorage);
    };
  }, []);

  // Alert Form State
  const [alertTitle, setAlertTitle] = useState("");
  const [alertDistrict, setAlertDistrict] = useState("Ramban");
  const [alertSeverity, setAlertSeverity] = useState<"critical" | "warning" | "advisory">("critical");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertRoad, setAlertRoad] = useState("NH-44 Panthyal");
  const [broadcastNotification, setBroadcastNotification] = useState<string | null>(null);

  // Action feedback
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Field Officer Call Modal State
  const [activeCallIncident, setActiveCallIncident] = useState<Incident | null>(null);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);

  const handleCallLogged = (note: string, _actionType: string) => {
    if (!activeCallIncident) return;
    const officer = getFieldOfficerForDistrict(activeCallIncident.district);
    setActionFeedback(`📞 Dispatch log recorded with ${officer.officerName} (${officer.district}): ${note}`);
    setTimeout(() => setActionFeedback(null), 8000);
  };

  // Handler: Confirm Incident and Block Road
  const handleConfirmIncidentAndBlock = (inc: Incident) => {
    // 1. Update incident status
    const updated = incidents.map((item) =>
      item.id === inc.id ? { ...item, status: "verified" as const } : item
    );
    setIncidents(updated);

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("aapda_grid_incidents", JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent("aapda_incidents_updated", { detail: updated }));
        window.dispatchEvent(new CustomEvent("storage"));
      } catch (e) {
        console.warn("Storage sync:", e);
      }
    }

    const dist = inc.district || "Ramban";
    const targetRoadId =
      dist === "Udhampur"
        ? "RD-OPEN-001"
        : dist === "Doda" || dist === "Kishtwar"
        ? "RD-004"
        : dist === "Shopian"
        ? "RD-002"
        : "RD-001";

    // 2. Block the road segment
    updateRoadStatusMock(targetRoadId, "closed");
    setRoads([...roads]);

    // 3. Issue alert with alternate diversion route
    const advisory = getAlternateRouteForDistrict(dist);
    broadcastAlert({
      title: `CRITICAL: ${inc.title} — Road Closed`,
      message: `DDMA EOC verified: ${inc.description}. Diversion active: ${advisory.alternateRoute.name} (${advisory.alternateRoute.passableFor}).`,
      severity: "critical",
      district: dist,
      affectedRoad: advisory.affectedRoad,
      closureReason: advisory.closureReason,
      alternateRoute: advisory.alternateRoute,
    });
    setAlerts([...MOCK_ALERTS]);

    setActionFeedback(`✅ Incident ${inc.id} confirmed! ${advisory.affectedRoad} CLOSED & Emergency Alert dispatched to ${dist}!`);
    setTimeout(() => setActionFeedback(null), 6000);
  };

  // Handler: Reject / Mark Duplicate
  const handleRejectIncident = (incId: string) => {
    setIncidents(
      incidents.map((item) =>
        item.id === incId ? { ...item, status: "closed" as const } : item
      )
    );
    setActionFeedback(`Incident ${incId} marked resolved/duplicate.`);
    setTimeout(() => setActionFeedback(null), 3000);
  };

  // Handler: Road Status Toggle
  const handleToggleRoad = (roadId: string, newStatus: "open" | "partially_open" | "closed") => {
    updateRoadStatusMock(roadId, newStatus);
    setRoads([...MOCK_ROADS]);
    setActionFeedback(`Road ${roadId} status officially changed to ${newStatus.toUpperCase()}. MargRakshak routes refreshed.`);
    setTimeout(() => setActionFeedback(null), 3000);
  };

  // Handler: Broadcast Alert
  const handleBroadcastAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertTitle.trim() || !alertMessage.trim()) return;

    const newAlert = broadcastAlert({
      title: alertTitle,
      message: alertMessage,
      severity: alertSeverity,
      district: alertDistrict,
      affectedRoad: alertRoad,
    });

    setAlerts([newAlert, ...alerts]);
    setBroadcastNotification(
      `Alert published to Public Web Banner & pushed to 1,420 Telegram Subscribers (@AAPDA_JK_Disaster_Alerts)!`
    );
    setAlertTitle("");
    setAlertMessage("");
    setTimeout(() => setBroadcastNotification(null), 4000);
  };

  const pendingIncidents = incidents.filter((i) => i.status === "reported" || i.status === "under_review");
  const closedRoadsCount = roads.filter((r) => r.status === "closed").length;
  const isolatedSettlementsCount = MOCK_SETTLEMENTS.filter((s) => s.isIsolated).length;

  return (
    <div className="space-y-6">
      {/* ── Action Notification Toast ────────────────────────────────────── */}
      {actionFeedback && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500 rounded-xl text-emerald-300 text-xs flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{actionFeedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionFeedback(null)}
            className="text-stone-400 hover:text-stone-200"
          >
            ×
          </button>
        </div>
      )}

      {/* ── Top Command KPI Ribbon ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-stone-400 text-xs">
            <span>Pending Review</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-400">{pendingIncidents.length}</p>
          <p className="text-[10px] text-stone-500">Citizen &amp; sensor reports</p>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-stone-400 text-xs">
            <span>Closed Roads</span>
            <MapPin className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-2xl font-black text-red-400">{closedRoadsCount}</p>
          <p className="text-[10px] text-stone-500">Active mountain blockages</p>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-stone-400 text-xs">
            <span>Isolated Villages</span>
            <Compass className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-black text-purple-400">{isolatedSettlementsCount}</p>
          <p className="text-[10px] text-stone-500">Road access cut off</p>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-stone-400 text-xs">
            <span>Emergency Alerts</span>
            <Radio className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400">{alerts.length}</p>
          <p className="text-[10px] text-stone-500">Active broadcasts</p>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-xl p-3.5 space-y-1 col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-stone-400 text-xs">
            <span>Relief Pending</span>
            <Package className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-black text-blue-400">{MOCK_RELIEF_REQUESTS.length}</p>
          <p className="text-[10px] text-stone-500">Allocations queued</p>
        </div>
      </div>

      {/* ── Control Room Module Tabs ──────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 border-b border-stone-800 pb-3 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab("queue")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all ${activeTab === "queue"
            ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
            : "text-stone-400 hover:text-stone-200 hover:bg-stone-900"
            }`}
        >
          <Eye className="w-4 h-4" />
          Incoming Reports &amp; Verification ({pendingIncidents.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("alerts")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all ${activeTab === "alerts"
            ? "bg-red-500/20 text-red-300 border border-red-500/40 shadow-sm"
            : "text-stone-400 hover:text-stone-200 hover:bg-stone-900"
            }`}
        >
          <Radio className="w-4 h-4" />
          Emergency Alert Broadcaster ({alerts.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("roads")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all ${activeTab === "roads"
            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
            : "text-stone-400 hover:text-stone-200 hover:bg-stone-900"
            }`}
        >
          <MapPin className="w-4 h-4" />
          MargRakshak Mountain Corridors
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("relief")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all ${activeTab === "relief"
            ? "bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm"
            : "text-stone-400 hover:text-stone-200 hover:bg-stone-900"
            }`}
        >
          <Package className="w-4 h-4" />
          RahatGrid Relief Allocations
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("monitoring")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all ${activeTab === "monitoring"
            ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm"
            : "text-stone-400 hover:text-stone-200 hover:bg-stone-900"
            }`}
        >
          <Layers className="w-4 h-4" />
          Weather &amp; Satellite Status
        </button>

        <button
          type="button"
          onClick={() => {
            if (typeof window !== "undefined") {
              localStorage.removeItem("aapda_grid_incidents");
              window.location.reload();
            }
          }}
          className="ml-auto text-[11px] px-3 py-1.5 bg-stone-850 hover:bg-stone-800 text-stone-300 rounded-xl flex items-center gap-1.5 border border-stone-700 transition-colors"
          title="Clear cached test submissions and reset to clean simulation state"
        >
          <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
          Reset Simulation Data
        </button>
      </div>

      {/* ── TAB 1: INCIDENT & CITIZEN REPORT QUEUE (AAPDA LENS) ───────────── */}
      {activeTab === "queue" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-stone-100 flex items-center gap-2">
                <Eye className="w-4 h-4 text-amber-400" />
                AAPDA Lens Verification Queue
              </h2>
              <p className="text-xs text-stone-400">
                Citizen submissions &amp; field telemetry awaiting official DDMA Incident Commander authorization.
              </p>
            </div>
            <Link
              href="/dashboard/roads"
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              Inspect on GIS Map <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {incidents.map((inc) => {
              const isPending = inc.status === "reported" || inc.status === "under_review";
              return (
                <div
                  key={inc.id}
                  className={`bg-stone-900 border rounded-2xl p-4 space-y-3 transition-colors ${isPending
                    ? "border-amber-500/40 hover:border-amber-500/70"
                    : "border-stone-800 opacity-80"
                    }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-stone-400">{inc.id}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${inc.severity === "critical"
                            ? "bg-red-500/20 text-red-400 border border-red-500/30"
                            : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            }`}
                        >
                          {inc.severity}
                        </span>
                        <span className="text-[10px] text-stone-400 bg-stone-800 px-2 py-0.5 rounded">
                          {inc.district} Sector
                        </span>
                        <span className="text-[10px] text-stone-500">
                          Coords: [{inc.location.lat.toFixed(3)}, {inc.location.lng.toFixed(3)}]
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${(inc.reportCount ?? 1) > 1
                            ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                            : "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                            }`}
                        >
                          📢 Reported {inc.reportCount ?? 1} {(inc.reportCount ?? 1) === 1 ? "time" : "times"}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-stone-100">{inc.title}</h3>
                      <p className="text-xs text-stone-300">{inc.description}</p>

                      {/* Multi-Citizen Deduplicated Reports Grouping */}
                      {(inc.reportCount ?? 1) > 1 && (
                        <div className="bg-purple-950/40 border border-purple-500/30 rounded-xl p-3 text-xs text-purple-200 space-y-2 mt-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 font-bold text-purple-300">
                              <Users className="w-4 h-4 text-purple-400" />
                              <span>Consolidated Incident: Reported {inc.reportCount} times across this sector</span>
                            </div>
                            <span className="text-[10px] bg-purple-900/60 text-purple-200 px-2 py-0.5 rounded font-mono font-bold">
                              Deduplicated into Single Incident
                            </span>
                          </div>
                          {inc.subReports && inc.subReports.length > 0 && (
                            <div className="space-y-1.5 pt-1.5 border-t border-purple-500/20 text-[11px]">
                              {inc.subReports.map((sub, idx) => (
                                <div key={sub.id || idx} className="flex flex-wrap items-center gap-2 bg-stone-900/70 p-1.5 rounded-lg border border-stone-800">
                                  <span className="font-mono font-bold text-purple-400">#{idx + 1}</span>
                                  <span className="text-stone-400">[{new Date(sub.reportedAt).toLocaleTimeString()}]</span>
                                  <span className="text-stone-300 font-semibold">{sub.reporterName}:</span>
                                  <span className="italic text-stone-400 truncate max-w-sm">&quot;{sub.description}&quot;</span>
                                  {sub.mediaUrl && sub.mediaUrl.startsWith("data:image") && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={sub.mediaUrl}
                                      alt="Evidence"
                                      className="w-7 h-7 object-cover rounded border border-emerald-500/40 ml-auto"
                                    />
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg ${inc.status === "verified"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : inc.status === "reported"
                            ? "bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse"
                            : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          }`}
                      >
                        {inc.status === "reported" ? "NEW: CITIZEN REPORTED" : inc.status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* AI Evidence Analysis Card */}
                  {inc.aiScore && (
                    <div className="bg-stone-950/70 border border-stone-800 rounded-xl p-2.5 text-xs flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-stone-300">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>AAPDA Lens AI Assessment:</span>
                        <strong className="text-emerald-400 font-bold">
                          {(inc.aiScore.confidence * 100).toFixed(0)}% Confidence
                        </strong>
                        <span className="text-stone-500">|</span>
                        <span>RapidFuzz Duplicate Risk: <strong>{(inc.aiScore.duplicateProbability * 100).toFixed(0)}%</strong></span>
                      </div>
                      <div className="text-[10px] text-stone-400 italic">
                        Human verification mandatory before road closure.
                      </div>
                    </div>
                  )}

                  {/* Local Area Field Officer Direct Tactical Link */}
                  {(() => {
                    const officer = getFieldOfficerForDistrict(inc.district);
                    return (
                      <div className="bg-stone-950/90 border border-stone-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                            <Radio className="w-4 h-4 animate-pulse" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 font-bold text-stone-200">
                              <span>👮 Ground Officer: {officer.officerName}</span>
                              <span className="text-[10px] bg-stone-800 text-stone-300 px-1.5 py-0.5 rounded font-mono">
                                {officer.rank}
                              </span>
                              <span className="text-[10px] text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 rounded-full font-bold">
                                {officer.distanceKm} km away
                              </span>
                            </div>
                            <div className="text-[11px] text-stone-400 flex flex-wrap items-center gap-2 mt-0.5">
                              <span>📍 {officer.unit}</span>
                              <span>•</span>
                              <span className="font-mono text-stone-500">{officer.radioFrequency}</span>
                              <span>•</span>
                              <span>HQ: {officer.locationBase}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveCallIncident(inc);
                            setIsCallModalOpen(true);
                          }}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950 transition-all hover:scale-[1.02]"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                          Call Field Officer ({officer.district})
                        </button>
                      </div>
                    );
                  })()}

                  {/* Commander Actions */}
                  {isPending && (
                    <div className="flex flex-wrap items-center justify-between pt-2 border-t border-stone-800 gap-2">
                      <div className="text-[11px] text-stone-400 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-stone-500" />
                        Reported by: <strong>{inc.reportedBy}</strong>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleRejectIncident(inc.id)}
                          className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5 text-stone-400" />
                          Dismiss / Duplicate
                        </button>

                        <button
                          type="button"
                          onClick={() => handleConfirmIncidentAndBlock(inc)}
                          className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                          Authorize Road Closure &amp; Broadcast Alert
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB 2: EMERGENCY PUBLIC ALERT BROADCASTER ─────────────────────── */}
      {activeTab === "alerts" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Broadcaster Form */}
          <div className="lg:col-span-1 bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-4">
            <div>
              <h2 className="text-sm font-bold text-stone-100 flex items-center gap-2">
                <Radio className="w-4 h-4 text-red-500 animate-pulse" />
                Dispatch Emergency Alert
              </h2>
              <p className="text-xs text-stone-400">
                Pushes instantaneous banner alert to public web portal and broadcast to Telegram Bot subscribers.
              </p>
            </div>

            {broadcastNotification && (
              <div className="p-3 bg-emerald-950 border border-emerald-500 rounded-xl text-emerald-300 text-xs">
                {broadcastNotification}
              </div>
            )}

            <form onSubmit={handleBroadcastAlert} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-300 font-semibold mb-1">Alert Headline</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. LANDSLIDE: NH-44 Closed at Panthyal"
                  value={alertTitle}
                  onChange={(e) => setAlertTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-xl text-stone-100 focus:outline-none focus:ring-1 focus:ring-red-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-stone-300 font-semibold mb-1">Severity</label>
                  <select
                    value={alertSeverity}
                    onChange={(e) => setAlertSeverity(e.target.value as any)}
                    className="w-full px-2.5 py-2 bg-stone-800 border border-stone-700 rounded-xl text-stone-100 text-xs"
                  >
                    <option value="critical">Critical (Immediate Evac / Block)</option>
                    <option value="warning">Warning (Severe Disruption)</option>
                    <option value="advisory">Advisory (Caution Watch)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-300 font-semibold mb-1">District</label>
                  <select
                    value={alertDistrict}
                    onChange={(e) => setAlertDistrict(e.target.value)}
                    className="w-full px-2.5 py-2 bg-stone-800 border border-stone-700 rounded-xl text-stone-100 text-xs"
                  >
                    <option value="Ramban">Ramban</option>
                    <option value="Doda">Doda</option>
                    <option value="Kishtwar">Kishtwar</option>
                    <option value="Shopian">Shopian</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-stone-300 font-semibold mb-1">Affected Mountain Corridor</label>
                <input
                  type="text"
                  value={alertRoad}
                  onChange={(e) => setAlertRoad(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-xl text-stone-100 focus:outline-none focus:ring-1 focus:ring-red-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-stone-300 font-semibold mb-1">Public Advisory &amp; Diversion Guidance</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detail alternate routes (e.g. Mughal Road), designated relief shelters, and police helpline numbers..."
                  value={alertMessage}
                  onChange={(e) => setAlertMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-xl text-stone-100 focus:outline-none focus:ring-1 focus:ring-red-500 text-xs"
                />
              </div>

              <div className="p-2.5 bg-stone-950 border border-stone-800 rounded-xl space-y-1 text-[11px] text-stone-400">
                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <Send className="w-3 h-3" />
                  <span>Telegram Bot Integration Configured</span>
                </div>
                <p>Channel: <strong>@AAPDA_JK_Disaster_Alerts</strong> (1,420 Active Subscribers)</p>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-colors text-xs"
              >
                <Radio className="w-4 h-4" />
                Broadcast Official Alert Everywhere
              </button>
            </form>
          </div>

          {/* Active Broadcasts Feed */}
          <div className="lg:col-span-2 space-y-4">
            <div>
              <h2 className="text-sm font-bold text-stone-100">Live Active Emergency Bulletins</h2>
              <p className="text-xs text-stone-400">
                Currently visible to all public citizens, road travellers and emergency responders.
              </p>
            </div>

            <div className="space-y-3">
              {alerts.map((alt) => (
                <div
                  key={alt.id}
                  className={`bg-stone-900 border rounded-2xl p-4 space-y-2 ${alt.severity === "critical"
                    ? "border-red-600/50 bg-red-950/20"
                    : "border-stone-800"
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-stone-400">{alt.id}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${alt.severity === "critical"
                          ? "bg-red-600 text-white"
                          : "bg-amber-600 text-white"
                          }`}
                      >
                        {alt.severity}
                      </span>
                      <span className="text-[10px] text-stone-400 bg-stone-800 px-2 py-0.5 rounded">
                        {alt.district}
                      </span>
                    </div>
                    <span className="text-[10px] text-stone-500">
                      Issued {new Date(alt.issuedAt).toLocaleTimeString()}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-stone-100">{alt.title}</h3>
                  <p className="text-xs text-stone-300">{alt.message}</p>

                  <div className="pt-2 border-t border-stone-800/80 flex flex-wrap items-center justify-between text-[11px] text-stone-400">
                    <div>
                      Source: <strong>{alt.source}</strong>
                    </div>
                    {alt.telegramBroadcastStatus && (
                      <div className="text-emerald-400 flex items-center gap-1 font-medium">
                        ✓ Telegram Broadcast Active ({alt.telegramBroadcastStatus.subscribersCount} Subscribed)
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: MARGRAKSHAK MOUNTAIN CORRIDORS OVERRIDE ────────────────── */}
      {activeTab === "roads" && (
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-stone-100 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              MargRakshak Mountain Corridors Authority Control
            </h2>
            <p className="text-xs text-stone-400">
              Manually override mountain road statuses to trigger automated NetworkX Dijkstra alternative route re-computations.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-300 border-collapse">
              <thead>
                <tr className="border-b border-stone-800 text-stone-400 uppercase text-[10px]">
                  <th className="py-2.5 px-3">Road ID</th>
                  <th className="py-2.5 px-3">Corridor Name</th>
                  <th className="py-2.5 px-3">District</th>
                  <th className="py-2.5 px-3">Current Status</th>
                  <th className="py-2.5 px-3">Closure Reason</th>
                  <th className="py-2.5 px-3 text-right">EOC Decision Override</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60">
                {roads.map((road) => (
                  <tr key={road.id} className="hover:bg-stone-800/30">
                    <td className="py-3 px-3 font-mono text-[11px] text-stone-400">{road.id}</td>
                    <td className="py-3 px-3 font-semibold text-stone-100">{road.name}</td>
                    <td className="py-3 px-3 text-stone-400">{road.district}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${road.status === "closed"
                          ? "bg-red-500/20 text-red-400 border border-red-500/30"
                          : road.status === "partially_open"
                            ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                            : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          }`}
                      >
                        {road.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-stone-400 text-[11px] max-w-xs truncate">
                      {road.closureReason || "None (Clear)"}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="inline-flex rounded-lg border border-stone-700 bg-stone-800 p-0.5 text-[10px] font-semibold">
                        <button
                          type="button"
                          onClick={() => handleToggleRoad(road.id, "open")}
                          className={`px-2 py-1 rounded transition-colors ${road.status === "open" ? "bg-emerald-600 text-white" : "text-stone-400 hover:text-white"
                            }`}
                        >
                          Open
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleRoad(road.id, "partially_open")}
                          className={`px-2 py-1 rounded transition-colors ${road.status === "partially_open" ? "bg-orange-600 text-white" : "text-stone-400 hover:text-white"
                            }`}
                        >
                          Partial
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleRoad(road.id, "closed")}
                          className={`px-2 py-1 rounded transition-colors ${road.status === "closed" ? "bg-red-600 text-white" : "text-stone-400 hover:text-white"
                            }`}
                        >
                          Closed
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 4: RAHATGRID RELIEF ALLOCATIONS & FLEET DISPATCH ───────── */}
      {activeTab === "relief" && (
        <RahatGridReliefConsole />
      )}

      {/* ── TAB 5: WEATHER & SATELLITE STATUS ─────────────────────────────── */}
      {activeTab === "monitoring" && (
        <div className="space-y-6">
          <WeatherExplorer />

          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-stone-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              ESA Copernicus Satellite Pass Status &amp; Change Detection
            </h3>
            <p className="text-xs text-stone-400">
              Live Open OData query for Sentinel-2 MSI optical &amp; Sentinel-1 SAR imagery.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-3 bg-stone-950 border border-stone-800 rounded-xl space-y-1 text-xs">
                <span className="text-stone-400">Sentinel-2 Pass:</span>
                <p className="text-purple-400 font-bold text-sm">Acquired ~4 hrs ago</p>
                <span className="text-[10px] text-stone-500">10m Ground Resolution (Pass Validated)</span>
              </div>
              <div className="p-3 bg-stone-950 border border-stone-800 rounded-xl space-y-1 text-xs">
                <span className="text-stone-400">Optical Cloud Cover:</span>
                <p className="text-stone-100 font-bold text-sm">18% (Clear over Jammu &amp; Chenab)</p>
                <span className="text-[10px] text-stone-500">Direct Optical Visibility Confirmed</span>
              </div>
              <div className="p-3 bg-stone-950 border border-stone-800 rounded-xl space-y-1 text-xs">
                <span className="text-stone-400">Change Detection:</span>
                <p className="text-red-400 font-bold text-sm">Surface Scar Detected at Panthyal</p>
                <span className="text-[10px] text-stone-500">NDVI / Band Ratio Difference</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Field Officer Call Simulation Modal */}
      {activeCallIncident && (
        <FieldOfficerCallModal
          isOpen={isCallModalOpen}
          onClose={() => setIsCallModalOpen(false)}
          officer={getFieldOfficerForDistrict(activeCallIncident.district)}
          incident={activeCallIncident}
          onCallLogged={handleCallLogged}
        />
      )}
    </div>
  );
}
