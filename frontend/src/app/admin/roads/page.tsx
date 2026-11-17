"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MapPin, ArrowRight, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import { MOCK_ROADS, MOCK_ALTERNATIVE_ROUTES, updateRoadStatusMock } from "@/lib/api/mock-adapter";
import type { RoadSegment } from "@/types";

export default function AdminRoadsPage(): React.ReactElement {
  const [roads, setRoads] = useState<RoadSegment[]>(MOCK_ROADS);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleToggleRoad = (roadId: string, newStatus: "open" | "partially_open" | "closed") => {
    updateRoadStatusMock(roadId, newStatus);
    setRoads([...MOCK_ROADS]);
    setFeedback(`Corridor ${roadId} status officially updated to ${newStatus.toUpperCase()}. MargRakshak alternative routes refreshed.`);
    setTimeout(() => setFeedback(null), 3000);
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

      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-stone-800">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-400" />
            <h1 className="text-lg font-bold text-stone-100">MargRakshak Mountain Corridors Authority Control</h1>
          </div>
          <p className="text-xs text-stone-400">
            Official road closure and reopening authority control for Jammu &amp; Kashmir arterial highways.
          </p>
        </div>

        <Link
          href="/dashboard/roads"
          className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
        >
          View on Public GIS Map <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-300 border-collapse">
            <thead>
              <tr className="border-b border-stone-800 text-stone-400 uppercase text-[10px]">
                <th className="py-2.5 px-3">Road ID</th>
                <th className="py-2.5 px-3">Highway Name</th>
                <th className="py-2.5 px-3">District</th>
                <th className="py-2.5 px-3">Current Status</th>
                <th className="py-2.5 px-3">Reason / Hazard</th>
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
                    {road.closureReason || "Clear for all traffic"}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="inline-flex rounded-lg border border-stone-700 bg-stone-800 p-0.5 text-[10px] font-semibold">
                      <button
                        type="button"
                        onClick={() => handleToggleRoad(road.id, "open")}
                        className={`px-2.5 py-1 rounded transition-colors ${
                          road.status === "open" ? "bg-emerald-600 text-white" : "text-stone-400 hover:text-white"
                        }`}
                      >
                        Open
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleRoad(road.id, "partially_open")}
                        className={`px-2.5 py-1 rounded transition-colors ${
                          road.status === "partially_open" ? "bg-orange-600 text-white" : "text-stone-400 hover:text-white"
                        }`}
                      >
                        Partial
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleRoad(road.id, "closed")}
                        className={`px-2.5 py-1 rounded transition-colors ${
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
    </div>
  );
}
