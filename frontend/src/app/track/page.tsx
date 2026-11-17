"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  FileText,
  MapPin,
  HelpCircle,
} from "lucide-react";
import { DemoBadge } from "@/components/shared/DemoBadge";
import { MOCK_INCIDENTS } from "@/lib/api/mock-adapter";
import type { Incident } from "@/types";

export default function TrackReportPage(): React.ReactElement {
  const [reportIdInput, setReportIdInput] = useState("");
  const [searchedId, setSearchedId] = useState("");
  const [foundReport, setFoundReport] = useState<Incident | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const id = reportIdInput.trim().toUpperCase();
    if (!id) return;

    setSearchedId(id);
    setHasSearched(true);

    const match = MOCK_INCIDENTS.find(
      (inc) => inc.id.toUpperCase() === id || inc.id.toUpperCase().includes(id)
    );

    if (match) {
      setFoundReport(match);
    } else {
      // Create a mock lookup for newly submitted demo IDs
      setFoundReport({
        id: id,
        title: "Citizen Field Incident Report",
        description: "Your report has been logged and queued in the State Emergency Operations Centre for DDMA review.",
        severity: "high",
        status: "under_review",
        district: "Ramban",
        location: { lat: 33.244, lng: 75.258 },
        reportedAt: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
        reportedBy: "citizen_mobile",
        updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        evidence: [],
        tags: ["citizen-submission", "under-review"],
        isDemo: true,
      });
    }
  };

  const getStepState = (status: string, stepIndex: number) => {
    // Steps: 0: Submitted, 1: Received, 2: Under Review, 3: Corroborated / Verified, 4: Action / Resolved
    const statusMap: Record<string, number> = {
      reported: 1,
      under_review: 2,
      verified: 3,
      closed: 4,
      rejected: 2,
    };
    const currentStep = statusMap[status] ?? 2;
    if (stepIndex < currentStep) return "completed";
    if (stepIndex === currentStep) return "current";
    return "upcoming";
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col">
      {/* Header */}
      <header className="bg-stone-900 border-b border-stone-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-stone-100">AAPDA Grid — Citizen Portal</h1>
            <p className="text-xs text-stone-400">Public Incident Report Tracking System</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <DemoBadge variant="inline" />
          <Link
            href="/dashboard/roads"
            className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-semibold border border-stone-700 transition-colors"
          >
            ← Live Mountain Map
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-6 space-y-6">
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div>
            <h2 className="text-lg font-bold text-stone-100 flex items-center gap-2">
              <Search className="w-5 h-5 text-emerald-400" />
              Track Your Disaster Incident Report
            </h2>
            <p className="text-xs text-stone-400">
              Enter the unique Report ID provided upon submission (e.g., <code>INC-001</code>, <code>INC-002</code>, or your <code>REP-...</code> ID).
            </p>
          </div>

          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                required
                value={reportIdInput}
                onChange={(e) => setReportIdInput(e.target.value)}
                placeholder="Enter Report ID (e.g. INC-001 or REP-...)"
                className="w-full px-4 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-md flex items-center gap-1.5"
            >
              <Search className="w-4 h-4" />
              Check Status
            </button>
          </form>

          {/* Preset Demo Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-stone-400">
            <span className="text-[10px] uppercase font-semibold text-stone-500">Quick Demo IDs:</span>
            <button
              type="button"
              onClick={() => {
                setReportIdInput("INC-001");
                setSearchedId("INC-001");
                setFoundReport(MOCK_INCIDENTS[0]);
                setHasSearched(true);
              }}
              className="px-2 py-1 bg-stone-800 hover:bg-stone-700 rounded text-stone-300 font-mono text-[11px]"
            >
              INC-001 (Verified NH-44 Landslide)
            </button>
            <button
              type="button"
              onClick={() => {
                setReportIdInput("INC-002");
                setSearchedId("INC-002");
                setFoundReport(MOCK_INCIDENTS[1]);
                setHasSearched(true);
              }}
              className="px-2 py-1 bg-stone-800 hover:bg-stone-700 rounded text-stone-300 font-mono text-[11px]"
            >
              INC-002 (Under Review Flood)
            </button>
          </div>
        </div>

        {/* Search Result Card */}
        {hasSearched && foundReport && (
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-stone-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-emerald-400">{foundReport.id}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      foundReport.status === "verified"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    }`}
                  >
                    {foundReport.status.replace("_", " ").toUpperCase()}
                  </span>
                  <span className="text-[10px] bg-stone-800 text-stone-400 px-2 py-0.5 rounded">
                    {foundReport.district} District
                  </span>
                </div>
                <h3 className="text-base font-bold text-stone-100 mt-1">{foundReport.title}</h3>
                <p className="text-xs text-stone-300 mt-0.5">{foundReport.description}</p>
              </div>

              <div className="text-right text-xs text-stone-500">
                <p>Reported: {new Date(foundReport.reportedAt).toLocaleString()}</p>
                <p>Last Update: {new Date(foundReport.updatedAt).toLocaleString()}</p>
              </div>
            </div>

            {/* Lifecycle Progress Bar */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Official Review Lifecycle
              </h4>

              <div className="grid grid-cols-4 gap-2 text-center text-xs pt-1">
                <div
                  className={`p-2.5 rounded-xl border ${
                    getStepState(foundReport.status, 0) === "completed" || getStepState(foundReport.status, 0) === "current"
                      ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-300"
                      : "bg-stone-950 border-stone-800 text-stone-500"
                  }`}
                >
                  <p className="font-bold text-[11px]">1. Submitted</p>
                  <p className="text-[10px] opacity-80">Report Logged</p>
                </div>

                <div
                  className={`p-2.5 rounded-xl border ${
                    getStepState(foundReport.status, 1) === "completed" || getStepState(foundReport.status, 1) === "current"
                      ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-300"
                      : "bg-stone-950 border-stone-800 text-stone-500"
                  }`}
                >
                  <p className="font-bold text-[11px]">2. EOC Received</p>
                  <p className="text-[10px] opacity-80">AI Cross-Check</p>
                </div>

                <div
                  className={`p-2.5 rounded-xl border ${
                    getStepState(foundReport.status, 2) === "completed" || getStepState(foundReport.status, 2) === "current"
                      ? "bg-amber-950/40 border-amber-500/50 text-amber-300"
                      : "bg-stone-950 border-stone-800 text-stone-500"
                  }`}
                >
                  <p className="font-bold text-[11px]">3. Under Review</p>
                  <p className="text-[10px] opacity-80">Field Patrol</p>
                </div>

                <div
                  className={`p-2.5 rounded-xl border ${
                    getStepState(foundReport.status, 3) === "completed" || getStepState(foundReport.status, 3) === "current"
                      ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-300"
                      : "bg-stone-950 border-stone-800 text-stone-500"
                  }`}
                >
                  <p className="font-bold text-[11px]">4. Verified</p>
                  <p className="text-[10px] opacity-80">Action Issued</p>
                </div>
              </div>
            </div>

            {/* Official Status Notice */}
            <div className="p-4 bg-stone-950 border border-stone-800 rounded-xl space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-stone-200 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Current State Emergency Operations Centre Note:</span>
              </div>
              <p className="text-stone-400 text-xs pl-6">
                {foundReport.status === "verified"
                  ? "This incident has been physically confirmed by the field patrolling unit. A road blockage alert and alternative route recommendation via Mughal Road have been published."
                  : "This report is currently queued for human review by DDMA Officers. Satellite pass telemetry and live Open-Meteo precipitation data are being synthesized."}
              </p>
            </div>

            {/* Action Links */}
            <div className="flex justify-between items-center pt-2">
              <Link
                href="/dashboard/roads"
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
              >
                Inspect on Public GIS Map <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/dashboard/incidents/report"
                className="text-xs text-stone-400 hover:text-stone-200"
              >
                Submit another report
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
