"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Eye,
} from "lucide-react";
import { DemoBadge } from "@/components/shared/DemoBadge";
import { SeverityBadge } from "@/components/shared/SeverityBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { HumanConfirmModal } from "@/components/shared/HumanConfirmModal";
import {
  MOCK_INCIDENTS,
} from "@/lib/api/mock-adapter";
import type { Incident, IncidentStatus } from "@/types";

type Tab = "all" | "review_queue" | "duplicates";

export default function IncidentsPage(): React.ReactElement {
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | "all">("all");
  const [incidents, setIncidents] = useState<Incident[]>(MOCK_INCIDENTS);
  const [modal, setModal] = useState<{
    open: boolean;
    action: "approve" | "reject";
    incident: Incident | null;
  }>({ open: false, action: "approve", incident: null });

  const reviewQueue = incidents.filter(
    (i) => i.status === "reported" || i.status === "under_review"
  );
  const duplicateCandidates = incidents.filter(
    (i) => (i.aiScore?.duplicateProbability ?? 0) > 0.2
  );

  const displayedList = (() => {
    let list = tab === "review_queue" ? reviewQueue : tab === "duplicates" ? duplicateCandidates : incidents;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.district.toLowerCase().includes(q) ||
          i.id.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") {
      list = list.filter((i) => i.status === statusFilter);
    }
    return list;
  })();

  const handleAction = (incident: Incident, action: "approve" | "reject"): void => {
    setModal({ open: true, action, incident });
  };

  const handleConfirm = (): void => {
    if (!modal.incident) return;
    const newStatus: IncidentStatus = modal.action === "approve" ? "verified" : "closed";
    setIncidents((prev) =>
      prev.map((i) =>
        i.id === modal.incident!.id ? { ...i, status: newStatus } : i
      )
    );
    setModal({ open: false, action: "approve", incident: null });
  };

  const confidenceLabel = (score: number): string => {
    if (score >= 0.8) return "High Confidence";
    if (score >= 0.6) return "Medium Confidence";
    return "Low Confidence — Verify Before Acting";
  };

  const confidenceColor = (score: number): string => {
    if (score >= 0.8) return "text-emerald-400";
    if (score >= 0.6) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Eye className="w-6 h-6 text-emerald-400" />
          <div>
            <h1 className="text-2xl font-bold text-slate-100">AAPDA Lens</h1>
            <p className="text-slate-400 text-sm">Incident review, deduplication &amp; evidence analysis</p>
          </div>
        </div>
        <DemoBadge variant="banner" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl w-fit">
        {(["all", "review_queue", "duplicates"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            {t === "all" ? `All Incidents (${incidents.length})` : t === "review_queue" ? `Review Queue (${reviewQueue.length})` : `Duplicate Flags (${duplicateCandidates.length})`}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search incidents, district, ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-sm placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as IncidentStatus | "all")}
            className="pl-9 pr-8 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-sm appearance-none focus:outline-none focus:border-emerald-500/50"
          >
            <option value="all">All Statuses</option>
            <option value="reported">Reported</option>
            <option value="under_review">Under Review</option>
            <option value="verified">Verified</option>
            <option value="closed">Closed</option>
            <option value="duplicate">Duplicate</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label="Incident list">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-4 py-3 text-left text-slate-400 font-medium text-xs uppercase tracking-wide">ID</th>
                <th className="px-4 py-3 text-left text-slate-400 font-medium text-xs uppercase tracking-wide">Incident</th>
                <th className="px-4 py-3 text-left text-slate-400 font-medium text-xs uppercase tracking-wide">District</th>
                <th className="px-4 py-3 text-left text-slate-400 font-medium text-xs uppercase tracking-wide">Severity</th>
                <th className="px-4 py-3 text-left text-slate-400 font-medium text-xs uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-left text-slate-400 font-medium text-xs uppercase tracking-wide">
                  AI Confidence <DemoBadge />
                </th>
                <th className="px-4 py-3 text-left text-slate-400 font-medium text-xs uppercase tracking-wide">
                  Dup. Prob. <DemoBadge />
                </th>
                <th className="px-4 py-3 text-left text-slate-400 font-medium text-xs uppercase tracking-wide">Reported</th>
                {tab === "review_queue" && (
                  <th className="px-4 py-3 text-left text-slate-400 font-medium text-xs uppercase tracking-wide">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {displayedList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-slate-500">
                    No incidents match your filters.
                  </td>
                </tr>
              ) : (
                displayedList.map((incident) => (
                  <IncidentRow
                    key={incident.id}
                    incident={incident}
                    showActions={tab === "review_queue"}
                    onApprove={() => handleAction(incident, "approve")}
                    onReject={() => handleAction(incident, "reject")}
                    confidenceLabel={confidenceLabel}
                    confidenceColor={confidenceColor}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Duplicate Pair View (shown in duplicates tab) */}
      {tab === "duplicates" && duplicateCandidates.length >= 2 && (
        <DuplicatePairView
          a={duplicateCandidates[0]!}
          b={duplicateCandidates[1]!}
          onConfirmDuplicate={() => handleAction(duplicateCandidates[1]!, "reject")}
        />
      )}

      {/* Human Confirm Modal */}
      <HumanConfirmModal
        isOpen={modal.open}
        onClose={() => setModal({ open: false, action: "approve", incident: null })}
        onConfirm={handleConfirm}
        title={modal.action === "approve" ? "Verify Incident" : "Reject / Close Incident"}
        aiReasoning={
          modal.incident?.aiScore
            ? `AI confidence: ${Math.round((modal.incident.aiScore.confidence) * 100)}%. Consistency score: ${Math.round(modal.incident.aiScore.consistencyScore * 100)}%. ${modal.incident.aiScore.uncertaintyFlags.length > 0 ? "Uncertainty flags: " + modal.incident.aiScore.uncertaintyFlags.join(", ") + "." : "No uncertainty flags."}`
            : "No AI analysis available for this incident."
        }
        confirmLabel={modal.action === "approve" ? "Confirm Verification" : "Confirm Rejection"}
        variant={modal.action === "approve" ? "approve" : "reject"}
      />
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface IncidentRowProps {
  incident: Incident;
  showActions: boolean;
  onApprove: () => void;
  onReject: () => void;
  confidenceLabel: (n: number) => string;
  confidenceColor: (n: number) => string;
}

function IncidentRow({
  incident,
  showActions,
  onApprove,
  onReject,
  confidenceLabel,
  confidenceColor,
}: IncidentRowProps): React.ReactElement {
  const score = incident.aiScore;
  const dupHigh = score && score.duplicateProbability > 0.2;

  return (
    <tr className={`hover:bg-slate-800/50 transition-colors ${dupHigh ? "border-l-2 border-orange-500" : ""}`}>
      <td className="px-4 py-3 text-slate-400 font-mono text-xs">{incident.id}</td>
      <td className="px-4 py-3">
        <div className="max-w-xs">
          <p className="text-slate-200 font-medium text-sm leading-tight truncate">{incident.title}</p>
          {dupHigh && (
            <span className="inline-flex items-center gap-1 text-[10px] text-orange-400 font-medium mt-0.5">
              <AlertTriangle className="w-2.5 h-2.5" /> Possible duplicate flagged
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-slate-300 text-sm">{incident.district}</td>
      <td className="px-4 py-3">
        <SeverityBadge severity={incident.severity} />
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={incident.status} />
      </td>
      <td className="px-4 py-3">
        {score ? (
          <div>
            <span className={`text-xs font-medium ${confidenceColor(score.confidence)}`}>
              {Math.round(score.confidence * 100)}%
            </span>
            <p className={`text-[10px] leading-tight ${confidenceColor(score.confidence)}`}>
              {confidenceLabel(score.confidence)}
            </p>
          </div>
        ) : (
          <span className="text-slate-500 text-xs">N/A</span>
        )}
      </td>
      <td className="px-4 py-3">
        {score ? (
          <span className={`text-xs font-medium ${score.duplicateProbability > 0.2 ? "text-orange-400" : "text-slate-400"}`}>
            {Math.round(score.duplicateProbability * 100)}%
          </span>
        ) : (
          <span className="text-slate-500 text-xs">N/A</span>
        )}
      </td>
      <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
        {formatRelative(incident.reportedAt)}
      </td>
      {showActions && (
        <td className="px-4 py-3">
          {(incident.status === "reported" || incident.status === "under_review") ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onApprove}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-medium transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Verify
              </button>
              <button
                type="button"
                onClick={onReject}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-xs font-medium transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" /> Reject
              </button>
            </div>
          ) : (
            <span className="text-slate-500 text-xs">—</span>
          )}
        </td>
      )}
    </tr>
  );
}

function DuplicatePairView({
  a,
  b,
  onConfirmDuplicate,
}: {
  a: Incident;
  b: Incident;
  onConfirmDuplicate: () => void;
}): React.ReactElement {
  return (
    <section className="bg-slate-900 border border-orange-500/30 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-orange-400" />
        <h2 className="text-slate-100 font-semibold">Potential Duplicate Pair — Side-by-Side Review</h2>
        <DemoBadge />
      </div>
      <p className="text-xs text-amber-400 italic mb-4 bg-amber-500/5 border border-amber-500/20 rounded-lg p-2">
        AI Recommendation — Requires Human Review: These incidents share similar location proximity, timestamp window and incident type. A DDMA officer must decide.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[a, b].map((inc) => (
          <div key={inc.id} className="bg-slate-800 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-xs font-mono">{inc.id}</span>
              <SeverityBadge severity={inc.severity} />
              <StatusBadge status={inc.status} />
            </div>
            <p className="text-slate-100 font-medium text-sm">{inc.title}</p>
            <p className="text-slate-400 text-xs">{inc.description}</p>
            <div className="text-xs text-slate-500 space-y-0.5">
              <div>District: <span className="text-slate-300">{inc.district}</span></div>
              <div>Location: <span className="text-slate-300">{inc.location.lat.toFixed(3)}, {inc.location.lng.toFixed(3)}</span></div>
              <div>Reported: <span className="text-slate-300">{formatRelative(inc.reportedAt)}</span></div>
              <div>By: <span className="text-slate-300">{inc.reportedBy}</span></div>
            </div>
            {inc.aiScore && (
              <div className="text-xs text-slate-500">
                AI Dup. prob: <span className="text-orange-400 font-medium">{Math.round(inc.aiScore.duplicateProbability * 100)}%</span>
                {inc.aiScore.uncertaintyFlags.length > 0 && (
                  <p className="text-orange-400/70 mt-0.5">⚠ {inc.aiScore.uncertaintyFlags.join(", ")}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={onConfirmDuplicate}
          className="px-4 py-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 rounded-lg text-sm font-medium transition-colors"
        >
          Confirm Duplicate (human decision required)
        </button>
        <button
          type="button"
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors"
        >
          Mark as Unique — Not Duplicate
        </button>
      </div>
    </section>
  );
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
