"use client";

import React, { useState } from "react";
import { Package, CheckCircle2, ShieldCheck, FileCheck, AlertTriangle } from "lucide-react";
import { MOCK_RELIEF_REQUESTS } from "@/lib/api/mock-adapter";

export default function AdminReliefPage(): React.ReactElement {
  const [requests, setRequests] = useState(MOCK_RELIEF_REQUESTS);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleAuthorize = (reqId: string, settlement: string) => {
    setRequests(
      requests.map((r) => (r.id === reqId ? { ...r, status: "approved" as const } : r))
    );
    setFeedback(`Relief dispatch for ${settlement} authorized by Incident Commander. Vehicle scheduled.`);
    setTimeout(() => setFeedback(null), 3500);
  };

  return (
    <div className="space-y-6">
      {feedback && (
        <div className="p-3 bg-emerald-950 border border-emerald-500 rounded-xl text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{feedback}</span>
          </div>
          <button type="button" onClick={() => setFeedback(null)} className="text-stone-400 hover:text-stone-200">×</button>
        </div>
      )}

      <div className="pb-2 border-b border-stone-800">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-blue-400" />
          <h1 className="text-lg font-bold text-stone-100">RahatGrid Relief Allocation &amp; Headroom</h1>
        </div>
        <p className="text-xs text-stone-400">
          AI-assisted relief stock prioritization with physical road accessibility validation and human sign-off.
        </p>
      </div>

      <div className="space-y-3">
        {requests.map((req) => (
          <div
            key={req.id}
            className="bg-stone-900 border border-stone-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-stone-400">{req.id}</span>
                <span className="font-bold text-stone-100 text-xs">Destination: {req.settlementName}</span>
                <span className="text-[10px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded font-bold">
                  {req.priority.toUpperCase()} PRIORITY
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    req.status === "approved"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-amber-500/20 text-amber-400"
                  }`}
                >
                  {req.status.toUpperCase()}
                </span>
              </div>
              <div className="text-xs text-stone-400">
                Requested: <strong>{req.items.map((i) => `${i.quantityRequested}x ${i.name}`).join(", ")}</strong>
              </div>
              {req.aiAllocationSuggestion && (
                <p className="text-[11px] text-emerald-400">
                  ✓ MargRakshak Corridor Verification: Passable route verified from Chanderkote Depot.
                </p>
              )}
            </div>

            {req.status === "pending" && (
              <button
                type="button"
                onClick={() => handleAuthorize(req.id, req.settlementName)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md"
              >
                <FileCheck className="w-3.5 h-3.5" />
                Authorize Allocation
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
