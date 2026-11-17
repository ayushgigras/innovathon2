"use client";

import React, { useState } from "react";
import Link from "next/link";
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
} from "lucide-react";
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

  // Alert Form State
  const [alertTitle, setAlertTitle] = useState("");
  const [alertDistrict, setAlertDistrict] = useState("Ramban");
  const [alertSeverity, setAlertSeverity] = useState<"critical" | "warning" | "advisory">("critical");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertRoad, setAlertRoad] = useState("NH-44 Panthyal");
  const [broadcastNotification, setBroadcastNotification] = useState<string | null>(null);

  // Action feedback
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Handler: Confirm Incident and Block Road
  const handleConfirmIncidentAndBlock = (inc: Incident) => {
    // 1. Update incident status
    const updated = incidents.map((item) =>
      item.id === inc.id ? { ...item, status: "verified" as const } : item
    );
    setIncidents(updated);

    // 2. Block the road segment
    const nh44 = roads.find((r) => r.id === "RD-001");
    if (nh44) {
      updateRoadStatusMock("RD-001", "closed");
      setRoads([...roads]);
    }

    // 3. Issue alert
    broadcastAlert({
      title: `CONFIRMED CLOSURE: ${inc.title}`,
      message: `DDMA EOC verified: ${inc.description}. Road closed to all traffic until clearance.`,
      severity: "critical",
      district: inc.district,
      affectedRoad: "NH-44 Panthyal Corridor",
    });
    setAlerts([...MOCK_ALERTS]);

    setActionFeedback(`Incident ${inc.id} officially confirmed by Commander. NH-44 marked CLOSED & Telegram Alert dispatched.`);
    setTimeout(() => setActionFeedback(null), 4000);
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
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all ${
            activeTab === "queue"
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
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all ${
            activeTab === "alerts"
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
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all ${
            activeTab === "roads"
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
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all ${
            activeTab === "relief"
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
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all ${
            activeTab === "monitoring"
              ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm"
              : "text-stone-400 hover:text-stone-200 hover:bg-stone-900"
          }`}
        >
          <Layers className="w-4 h-4" />
          Weather &amp; Satellite Status
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
                  className={`bg-stone-900 border rounded-2xl p-4 space-y-3 transition-colors ${
                    isPending
                      ? "border-amber-500/40 hover:border-amber-500/70"
                      : "border-stone-800 opacity-80"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-stone-400">{inc.id}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            inc.severity === "critical"
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
                      </div>
                      <h3 className="text-sm font-bold text-stone-100">{inc.title}</h3>
                      <p className="text-xs text-stone-300">{inc.description}</p>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                          inc.status === "verified"
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
                  className={`bg-stone-900 border rounded-2xl p-4 space-y-2 ${
                    alt.severity === "critical"
                      ? "border-red-600/50 bg-red-950/20"
                      : "border-stone-800"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-stone-400">{alt.id}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          alt.severity === "critical"
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
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          road.status === "closed"
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
                          className={`px-2 py-1 rounded transition-colors ${
                            road.status === "open" ? "bg-emerald-600 text-white" : "text-stone-400 hover:text-white"
                          }`}
                        >
                          Open
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleRoad(road.id, "partially_open")}
                          className={`px-2 py-1 rounded transition-colors ${
                            road.status === "partially_open" ? "bg-orange-600 text-white" : "text-stone-400 hover:text-white"
                          }`}
                        >
                          Partial
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleRoad(road.id, "closed")}
                          className={`px-2 py-1 rounded transition-colors ${
                            road.status === "closed" ? "bg-red-600 text-white" : "text-stone-400 hover:text-white"
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

      {/* ── TAB 4: RAHATGRID RELIEF ALLOCATIONS ───────────────────────────── */}
      {activeTab === "relief" && (
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-stone-100 flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-400" />
              RahatGrid Allocation Recommendations (Human-in-the-Loop)
            </h2>
            <p className="text-xs text-stone-400">
              AI proposes optimal stock distribution and tests road connectivity to prevent dispatching via blocked roads.
            </p>
          </div>

          <div className="space-y-3">
            {MOCK_RELIEF_REQUESTS.map((req) => (
              <div
                key={req.id}
                className="bg-stone-950/70 border border-stone-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-stone-400">{req.id}</span>
                    <span className="font-bold text-stone-100 text-xs">Destination: {req.settlementName}</span>
                    <span className="text-[10px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded font-bold">
                      {req.priority.toUpperCase()} PRIORITY
                    </span>
                  </div>
                  <div className="text-xs text-stone-400">
                    Requested Items:{" "}
                    <strong>
                      {req.items.map((i) => `${i.quantityRequested}x ${i.name}`).join(", ")}
                    </strong>
                  </div>
                  {req.aiAllocationSuggestion && (
                    <p className="text-[11px] text-emerald-400">
                      ✓ AI Route Check: Recommended from Chanderkote Bypass Depot (Road Passable)
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActionFeedback(`Relief dispatch for ${req.settlementName} authorized by Commander. Vehicle assigned.`);
                      setTimeout(() => setActionFeedback(null), 3000);
                    }}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md"
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    Authorize Dispatch
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 5: WEATHER & SATELLITE STATUS ─────────────────────────────── */}
      {activeTab === "monitoring" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-stone-100 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-emerald-400" />
              Open-Meteo Coordinate Weather Feed
            </h3>
            <p className="text-xs text-stone-400">
              Live hourly forecast &amp; soil moisture telemetry active for Jammu &amp; Kashmir sector (33.25°N, 75.25°E).
            </p>
            <div className="p-3 bg-stone-950 border border-stone-800 rounded-xl space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-stone-400">Precipitation:</span>
                <span className="text-emerald-400 font-bold">38.4 mm (High Rain Alert)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Soil Moisture (0-3cm):</span>
                <span className="text-amber-400 font-bold">0.42 m³/m³ (Saturation Near Limit)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Wind Gusts (10m):</span>
                <span className="text-stone-200 font-bold">42 km/h</span>
              </div>
            </div>
          </div>

          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-stone-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              ESA Copernicus Satellite Pass Status
            </h3>
            <p className="text-xs text-stone-400">
              Live Open OData query for Sentinel-2 MSI optical &amp; Sentinel-1 SAR imagery.
            </p>
            <div className="p-3 bg-stone-950 border border-stone-800 rounded-xl space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-stone-400">Sentinel-2 Pass:</span>
                <span className="text-purple-400 font-bold">Acquired ~4 hrs ago</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Cloud Cover:</span>
                <span className="text-stone-200 font-bold">18% (Clear over Chenab Gorge)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Change Detection:</span>
                <span className="text-red-400 font-bold">Surface Scar Detected at Panthyal</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
