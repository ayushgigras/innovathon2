"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Eye,
  AlertTriangle,
  PhoneCall,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  MapPin,
  ShieldCheck,
  UserCheck,
  Radio,
  FileText,
  Upload,
  ArrowRight,
  Users,
} from "lucide-react";
import { getFieldOfficerForDistrict } from "@/lib/api/field-officers";
import { getAlternateRouteForDistrict } from "@/lib/api/alternate-routes";
import { FieldOfficerCallModal } from "@/components/shared/FieldOfficerCallModal";
import {
  MOCK_INCIDENTS,
  addCitizenReport,
  broadcastAlert,
  updateRoadStatusMock,
} from "@/lib/api/mock-adapter";
import type { Incident } from "@/types";

export default function AdminIncidentsPage(): React.ReactElement {
  const [incidents, setIncidents] = useState<Incident[]>(MOCK_INCIDENTS);
  const [selectedIncident, setSelectedIncident] = useState<Incident>(MOCK_INCIDENTS[0]);

  // Live Sync with citizen submissions across tabs
  useEffect(() => {
    const syncFromStorage = () => {
      try {
        const stored = localStorage.getItem("aapda_grid_incidents");
        if (stored) {
          const parsed = JSON.parse(stored) as Incident[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            setIncidents(parsed);
            // keep selected incident fresh
            const found = parsed.find((i) => i.id === selectedIncident?.id);
            if (found) setSelectedIncident(found);
          }
        }
      } catch (err) {
        console.warn("Storage sync error:", err);
      }
    };
    syncFromStorage();
    window.addEventListener("aapda_incidents_updated", syncFromStorage);
    window.addEventListener("storage", syncFromStorage);
    return () => {
      window.removeEventListener("aapda_incidents_updated", syncFromStorage);
      window.removeEventListener("storage", syncFromStorage);
    };
  }, [selectedIncident?.id]);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");

  // Call Transcript Intake State (Part 3B)
  const [isCallIntakeOpen, setIsCallIntakeOpen] = useState(false);
  const [callTranscript, setCallTranscript] = useState("");
  const [callerPhone, setCallerPhone] = useState("+91-9876543210");
  const [parsedCallResult, setParsedCallResult] = useState<any>(null);

  // Field Officer Assignment State (Part 6)
  const [assignedOfficer, setAssignedOfficer] = useState("Officer S. Manhas (Patrolling Unit 4)");
  const [fieldNote, setFieldNote] = useState("Visual confirmation of 45-meter debris field blocking both lanes at Panthyal.");
  const [fieldGps, setFieldGps] = useState("33.2452° N, 75.2591° E");
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);

  // Automatically update field officer details when selected incident or district changes
  useEffect(() => {
    if (selectedIncident) {
      const officer = getFieldOfficerForDistrict(selectedIncident.district);
      setAssignedOfficer(`${officer.officerName} (${officer.unit})`);
      setFieldGps(`${selectedIncident.location.lat.toFixed(4)}° N, ${selectedIncident.location.lng.toFixed(4)}° E`);
      setFieldNote(
        `Visual confirmation dispatched to ${officer.officerName} (${officer.rank}) in ${selectedIncident.district} sector. Unit stationed at ${officer.locationBase} (${officer.distanceKm} km away).`
      );
    }
  }, [selectedIncident?.id, selectedIncident?.district]);

  // Feedback Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Handle Call Transcript Parse & Ingest (Client-side mirror of call_intake_service)
  const handleParseCallTranscript = () => {
    if (!callTranscript.trim()) return;

    const lower = callTranscript.toLowerCase();
    const isLandslide = lower.includes("landslide") || lower.includes("rockfall") || lower.includes("shooting stone");
    const isFlood = lower.includes("flood") || lower.includes("river") || lower.includes("overflow") || lower.includes("submerged");
    const category = isLandslide ? "landslide" : isFlood ? "flood" : "road_block";
    const severity = lower.includes("trapped") || lower.includes("urgent") || lower.includes("boulder") ? "critical" : "high";

    const district = lower.includes("doda") ? "Doda" : lower.includes("shopian") ? "Shopian" : "Ramban";
    const title = `${category.toUpperCase().replace("_", " ")}: Emergency Call Helpline Intake`;

    const newInc: Incident = {
      id: `RPT-CALL-${Date.now().toString(36).substring(2, 7).toUpperCase()}`,
      title,
      description: callTranscript,
      severity: severity as any,
      status: "under_review",
      district,
      location: { lat: 33.244, lng: 75.258 },
      reportedAt: new Date().toISOString(),
      reportedBy: `call_center (${callerPhone})`,
      updatedAt: new Date().toISOString(),
      evidence: [],
      aiScore: {
        confidence: 0.89,
        duplicateProbability: 0.04,
        consistencyScore: 0.92,
        uncertaintyFlags: ["Emergency helpline verbal transcript — field patrol verification en route"],
        label: "AI Recommendation (unverified — human review required)",
      },
      tags: ["emergency-helpline-112", "phone-call", category],
      isDemo: true,
    };

    setIncidents([newInc, ...incidents]);
    setSelectedIncident(newInc);
    setToastMessage(`Call report ${newInc.id} ingested into EOC queue! Transcribed from ${callerPhone}.`);
    setCallTranscript("");
    setIsCallIntakeOpen(false);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Preset sample transcripts
  const loadSampleTranscript = (type: 1 | 2) => {
    if (type === 1) {
      setCallTranscript("Helpline 112 Dispatch: Driver calling from NH-44 near Panthyal tunnel approach: 'Massive landslide occurred 10 minutes ago, 4 trucks trapped behind 50-meter debris field, shooting stones active from ridge!'");
      setCallerPhone("+91-9419123456");
    } else {
      setCallTranscript("Helpline 112 Dispatch: Sarpanch calling from Doda Chenab river bank: 'River water level rose by 2 meters in 30 minutes following heavy rain in upper catchment, low lying orchard huts flooding.'");
      setCallerPhone("+91-9622987654");
    }
  };

  // Official Status Transition
  const handleTransitionStatus = (newStatus: Incident["status"]) => {
    const updated = incidents.map((i) =>
      i.id === selectedIncident.id ? { ...i, status: newStatus, updatedAt: new Date().toISOString() } : i
    );
    setIncidents(updated);
    setSelectedIncident({ ...selectedIncident, status: newStatus, updatedAt: new Date().toISOString() });

    // Sync to localStorage and dispatch event for cross-tab reactivity
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("aapda_grid_incidents", JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent("aapda_incidents_updated", { detail: updated }));
        window.dispatchEvent(new CustomEvent("storage"));
      } catch (err) {
        console.warn("Storage incident sync:", err);
      }
    }

    const dist = selectedIncident.district || "Ramban";
    const targetRoadId =
      dist === "Udhampur"
        ? "RD-OPEN-001"
        : dist === "Doda" || dist === "Kishtwar"
        ? "RD-004"
        : dist === "Shopian"
        ? "RD-002"
        : "RD-001";

    if (newStatus === "verified") {
      updateRoadStatusMock(targetRoadId, "closed");
      const advisory = getAlternateRouteForDistrict(dist);

      broadcastAlert({
        title: `CRITICAL: ${selectedIncident.title} — Road Closed`,
        message: `DDMA Incident Commander confirmed road closure in ${dist} sector. Diversion active: ${advisory.alternateRoute.name} (${advisory.alternateRoute.passableFor}).`,
        severity: "critical",
        district: dist,
        affectedRoad: advisory.affectedRoad,
        closureReason: advisory.closureReason,
        alternateRoute: advisory.alternateRoute,
      });

      setToastMessage(`✅ Incident ${selectedIncident.id} CONFIRMED! ${advisory.affectedRoad} CLOSED & Emergency Alert broadcasted to ${dist} citizens!`);
    } else if (newStatus === "closed") {
      updateRoadStatusMock(targetRoadId, "open");
      setToastMessage(`Incident ${selectedIncident.id} marked RESOLVED! Road corridor reopened.`);
    } else {
      setToastMessage(`Incident ${selectedIncident.id} transitioned to ${newStatus.toUpperCase()}.`);
    }

    setTimeout(() => setToastMessage(null), 6000);
  };

  const filtered = incidents.filter((i) => {
    if (statusFilter !== "all" && i.status !== statusFilter) return false;
    if (sourceFilter === "phone_call" && !i.id.includes("CALL")) return false;
    if (sourceFilter === "website" && i.id.includes("CALL")) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="p-3 bg-emerald-950/90 border border-emerald-500 rounded-xl text-emerald-300 text-xs flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
          <button type="button" onClick={() => setToastMessage(null)} className="text-stone-400 hover:text-stone-200">
            ×
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-stone-800">
        <div>
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-amber-400" />
            <h1 className="text-lg font-bold text-stone-100">Incident Review &amp; Verification Desk</h1>
            <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold">
              AAPDA LENS AI + FIELD VERIFICATION
            </span>
          </div>
          <p className="text-xs text-stone-400">
            Multi-signal investigation workspace for citizen submissions and emergency phone-call transcripts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCallIntakeOpen(!isCallIntakeOpen)}
            className="px-3 py-1.5 bg-blue-950/60 hover:bg-blue-900/60 text-blue-300 border border-blue-800/60 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            {isCallIntakeOpen ? "Close Call Intake" : "+ Ingest Emergency Phone Call (112)"}
          </button>
        </div>
      </div>

      {/* ── Emergency Helpline Phone Call Transcript Intake (Part 3B) ────────── */}
      {isCallIntakeOpen && (
        <div className="bg-stone-900 border border-blue-500/40 rounded-2xl p-5 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-400">
              <PhoneCall className="w-4 h-4" />
              <h3 className="font-bold text-sm text-stone-100">
                Helpline 112 Citizen Call Audio Transcript Ingestion
              </h3>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => loadSampleTranscript(1)}
                className="text-[11px] px-2 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded"
              >
                Sample 1: Panthyal Landslide Call
              </button>
              <button
                type="button"
                onClick={() => loadSampleTranscript(2)}
                className="text-[11px] px-2 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded"
              >
                Sample 2: Doda Flood Call
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-stone-300">Spoken Call Transcript</label>
              <textarea
                rows={3}
                value={callTranscript}
                onChange={(e) => setCallTranscript(e.target.value)}
                placeholder="Paste verbal call transcript received from citizen calling emergency helpline 112..."
                className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-stone-300">Caller Phone Number</label>
                <input
                  type="text"
                  value={callerPhone}
                  onChange={(e) => setCallerPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-xs mt-1"
                />
              </div>

              <button
                type="button"
                onClick={handleParseCallTranscript}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Parse Transcript &amp; Ingest
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Two-Column Investigation Workspace ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Incidents Roster */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-stone-400 font-semibold uppercase text-[10px]">Filter:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-stone-900 border border-stone-800 rounded-lg px-2 py-1 text-xs text-stone-300"
              >
                <option value="all">All Statuses ({incidents.length})</option>
                <option value="reported">Reported / Unverified</option>
                <option value="under_review">Under Review</option>
                <option value="verified">Verified</option>
              </select>

              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="bg-stone-900 border border-stone-800 rounded-lg px-2 py-1 text-xs text-stone-300"
              >
                <option value="all">All Sources</option>
                <option value="phone_call">Phone Calls (112)</option>
                <option value="website">Website Submissions</option>
              </select>
            </div>
          </div>

          <div className="space-y-2 max-h-[650px] overflow-y-auto pr-1">
            {filtered.map((inc) => {
              const isSelected = selectedIncident.id === inc.id;
              const isCall = inc.id.includes("CALL");
              return (
                <div
                  key={inc.id}
                  onClick={() => setSelectedIncident(inc)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? "bg-stone-900 border-emerald-500 shadow-lg"
                      : "bg-stone-900/60 border-stone-800 hover:border-stone-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] text-stone-400">{inc.id}</span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                          inc.severity === "critical"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-amber-500/20 text-amber-400"
                        }`}
                      >
                        {inc.severity}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                          (inc.reportCount ?? 1) > 1
                            ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                            : "bg-stone-800 text-stone-400"
                        }`}
                      >
                        {(inc.reportCount ?? 1)}x
                      </span>
                      {isCall && (
                        <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1.5 py-0.2 rounded font-bold flex items-center gap-0.5">
                          <PhoneCall className="w-2.5 h-2.5" /> CALL
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        inc.status === "verified"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : inc.status === "reported"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-amber-500/20 text-amber-400"
                      }`}
                    >
                      {inc.status.toUpperCase()}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-stone-100 mt-1 line-clamp-1">{inc.title}</h3>
                  <p className="text-[11px] text-stone-400 line-clamp-1">{inc.description}</p>

                  <div className="flex items-center justify-between text-[10px] text-stone-500 mt-2 pt-1 border-t border-stone-800">
                    <span className="text-stone-400">📍 {inc.district} Sector</span>
                    <span className="text-emerald-400 font-medium flex items-center gap-1">
                      👮 {getFieldOfficerForDistrict(inc.district).officerName}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Complete Investigation Workspace (Part 6) */}
        <div className="lg:col-span-7 bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-stone-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-emerald-400">{selectedIncident.id}</span>
                <span className="text-xs bg-stone-800 text-stone-300 px-2 py-0.5 rounded font-medium">
                  {selectedIncident.district} District
                </span>
                <span className="text-xs text-stone-500">
                  Coords: [{selectedIncident.location.lat.toFixed(4)}, {selectedIncident.location.lng.toFixed(4)}]
                </span>
              </div>
              <h2 className="text-base font-bold text-stone-100 mt-1">{selectedIncident.title}</h2>
              <p className="text-xs text-stone-300 mt-0.5">{selectedIncident.description}</p>

              {/* Consolidated Multi-Citizen Reports Group */}
              {(selectedIncident.reportCount ?? 1) > 1 && (
                <div className="bg-purple-950/40 border border-purple-500/30 rounded-xl p-3 text-xs text-purple-200 space-y-2 mt-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-purple-300">
                      <Users className="w-3.5 h-3.5 text-purple-400" />
                      <span>Consolidated Reports ({selectedIncident.reportCount} citizen submissions)</span>
                    </div>
                    <span className="text-[10px] text-purple-300 bg-purple-900/50 px-2 py-0.5 rounded font-mono font-bold">
                      Multi-Citizen Corroboration
                    </span>
                  </div>
                  {selectedIncident.subReports && selectedIncident.subReports.length > 0 && (
                    <div className="space-y-1 pt-1 border-t border-purple-500/20 text-[11px]">
                      {selectedIncident.subReports.map((sub, idx) => (
                        <div key={sub.id || idx} className="flex flex-wrap items-center gap-2 bg-stone-900/70 p-1.5 rounded-lg border border-stone-800">
                          <span className="font-mono text-purple-400 font-bold">#{idx + 1}</span>
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
                className={`text-xs font-black px-2.5 py-1 rounded-lg uppercase ${
                  selectedIncident.status === "verified"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                }`}
              >
                {selectedIncident.status.replace("_", " ")}
              </span>
            </div>
          </div>

          {/* Section 1: AAPDA Lens AI Assessment (Part 5) */}
          <div className="bg-stone-950/80 border border-stone-800 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                AAPDA Lens Multi-Signal Evidence Analysis
              </span>
              <span className="text-[10px] text-stone-500">Algorithmic Heuristic Only</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 bg-stone-900 rounded-lg">
                <p className="text-stone-400 text-[10px]">Location Match</p>
                <p className="font-bold text-emerald-400">
                  {((selectedIncident.aiScore?.confidence ?? 0.88) * 100).toFixed(0)}%
                </p>
              </div>
              <div className="p-2 bg-stone-900 rounded-lg">
                <p className="text-stone-400 text-[10px]">Duplicate Risk</p>
                <p className="font-bold text-stone-200">
                  {((selectedIncident.aiScore?.duplicateProbability ?? 0.04) * 100).toFixed(0)}%
                </p>
              </div>
              <div className="p-2 bg-stone-900 rounded-lg">
                <p className="text-stone-400 text-[10px]">Temporal Validity</p>
                <p className="font-bold text-emerald-400">
                  {((selectedIncident.aiScore?.consistencyScore ?? 0.94) * 100).toFixed(0)}%
                </p>
              </div>
            </div>

            <p className="text-[11px] text-stone-400 italic">
              "AI Recommendation: Citizen description correlates with local steep topography near NH-44 Panthyal. Human field officer verification required prior to official closure."
            </p>
          </div>

          {/* Section 2: Field Officer Verification Workflow (Part 6) */}
          <div className="bg-stone-950/80 border border-stone-800 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-stone-200 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                Field Officer Physical Verification Workflow ({selectedIncident.district} Sector)
              </h4>
              <button
                type="button"
                onClick={() => setIsCallModalOpen(true)}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow transition-all hover:scale-[1.02]"
              >
                <PhoneCall className="w-3 h-3" />
                Call Officer ({selectedIncident.district})
              </button>
            </div>

            {/* Tactical Radio Status Strip */}
            {(() => {
              const officer = getFieldOfficerForDistrict(selectedIncident.district);
              return (
                <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-stone-900 border border-stone-800 rounded-lg text-[11px]">
                  <div className="flex items-center gap-2">
                    <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                    <span className="text-stone-300">
                      Channel: <strong className="text-stone-100 font-mono">{officer.radioFrequency}</strong>
                    </span>
                    <span className="text-stone-500">|</span>
                    <span className="text-stone-400">{officer.locationBase}</span>
                  </div>
                  <span className="text-emerald-400 font-semibold">
                    Proximity: {officer.distanceKm} km from incident
                  </span>
                </div>
              );
            })()}

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] text-stone-400 font-semibold">Assigned Patrolling Unit</label>
                <input
                  type="text"
                  value={assignedOfficer}
                  onChange={(e) => setAssignedOfficer(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-stone-900 border border-stone-800 rounded-lg text-stone-200 text-xs mt-1"
                />
              </div>

              <div>
                <label className="text-[10px] text-stone-400 font-semibold">Field GPS Telemetry</label>
                <input
                  type="text"
                  value={fieldGps}
                  onChange={(e) => setFieldGps(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-stone-900 border border-stone-800 rounded-lg text-stone-200 text-xs mt-1"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-stone-400 font-semibold">Field Officer Ground Observation</label>
              <textarea
                rows={2}
                value={fieldNote}
                onChange={(e) => setFieldNote(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-stone-900 border border-stone-800 rounded-lg text-stone-200 text-xs mt-1"
              />
            </div>
          </div>

          {/* Section 3: Official Decision Buttons (Part 7) */}
          <div className="pt-2 border-t border-stone-800 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Authorized Incident Commander Actions
            </h4>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleTransitionStatus("under_review")}
                className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-amber-400 rounded-lg font-semibold transition-colors"
              >
                Mark Under Review
              </button>

              <button
                type="button"
                onClick={() => handleTransitionStatus("verified")}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-md transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Officially Confirm &amp; Close Highway
              </button>

              <button
                type="button"
                onClick={() => handleTransitionStatus("closed")}
                className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-emerald-400 rounded-lg font-semibold transition-colors"
              >
                Mark Resolved / Reopened
              </button>

              <button
                type="button"
                onClick={() => handleTransitionStatus("rejected" as any)}
                className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-400 rounded-lg transition-colors"
              >
                Reject with Explanation
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Field Officer Call Simulation Modal */}
      {selectedIncident && (
        <FieldOfficerCallModal
          isOpen={isCallModalOpen}
          onClose={() => setIsCallModalOpen(false)}
          officer={getFieldOfficerForDistrict(selectedIncident.district)}
          incident={selectedIncident}
          onCallLogged={(note, actionType) => {
            setFieldNote((prev) => `${prev}\n[Direct Call - ${actionType.toUpperCase()}]: ${note}`);
            setToastMessage(`Tactical order logged with ${getFieldOfficerForDistrict(selectedIncident.district).officerName}!`);
            setTimeout(() => setToastMessage(null), 4000);
          }}
        />
      )}
    </div>
  );
}
