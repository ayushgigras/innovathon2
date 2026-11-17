"use client";

import React, { useState, useEffect } from "react";
import {
  Map,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Navigation,
  Users,
} from "lucide-react";
import { DemoBadge } from "@/components/shared/DemoBadge";
import {
  MOCK_ROADS,
  MOCK_SETTLEMENTS,
} from "@/lib/api/mock-adapter";
import type { RoadSegment, Settlement } from "@/types";

export default function RoadsPage(): React.ReactElement {
  const [selected, setSelected] = useState<RoadSegment | null>(null);
  const [MapComponents, setMapComponents] = useState<React.ReactElement | null>(null);

  // Lazy load leaflet (client only — no SSR)
  useEffect(() => {
    void (async () => {
      const { MapWrapper } = await import("@/components/map/MapWrapper");
      setMapComponents(
        <MapWrapper roads={MOCK_ROADS} settlements={MOCK_SETTLEMENTS} onSelectRoad={setSelected} />
      );
    })();
  }, []);

  const closedRoads = MOCK_ROADS.filter((r) => r.status === "closed");
  const partialRoads = MOCK_ROADS.filter((r) => r.status === "partially_open");
  const isolatedSettlements = MOCK_SETTLEMENTS.filter((s) => s.isIsolated);

  return (
    <div className="flex flex-col lg:flex-row h-full overflow-hidden">
      {/* Sidebar */}
      <aside className="w-full lg:w-80 xl:w-96 border-r border-slate-800 overflow-y-auto bg-slate-950 flex-shrink-0">
        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Map className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <div>
              <h1 className="text-lg font-bold text-slate-100">MargRakshak</h1>
              <p className="text-slate-400 text-xs">Road closures &amp; accessibility</p>
            </div>
          </div>
          <DemoBadge variant="banner" />

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            <StatMini label="Closed" value={closedRoads.length} color="text-red-400" />
            <StatMini label="Partial" value={partialRoads.length} color="text-orange-400" />
            <StatMini label="Cut Off" value={isolatedSettlements.length} color="text-purple-400" />
          </div>

          {/* Map Legend */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-1.5">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-2">Map Legend</p>
            <LegendItem color="bg-red-500" label="Road fully closed" />
            <LegendItem color="bg-orange-400" label="Partially open (1 lane)" />
            <LegendItem color="bg-emerald-500" label="Open" />
            <LegendItem color="bg-purple-500" label="Isolated settlement" />
            <LegendItem color="bg-slate-400" label="Connected settlement" />
          </div>

          {/* Road Closures */}
          <div>
            <h2 className="text-slate-300 text-xs font-semibold uppercase tracking-wide mb-2 flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              Road Closures
            </h2>
            <div className="space-y-2">
              {MOCK_ROADS.filter((r) => r.status !== "open").map((road) => (
                <RoadCard
                  key={road.id}
                  road={road}
                  isSelected={selected?.id === road.id}
                  onClick={() => setSelected(selected?.id === road.id ? null : road)}
                />
              ))}
            </div>
          </div>

          {/* Settlements */}
          <div>
            <h2 className="text-slate-300 text-xs font-semibold uppercase tracking-wide mb-2 flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-purple-400" />
              Settlements
            </h2>
            <div className="space-y-2">
              {MOCK_SETTLEMENTS.map((s) => (
                <SettlementCard key={s.id} settlement={s} />
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Map Area */}
      <div className="flex-1 relative min-h-96 lg:min-h-0">
        {MapComponents ?? (
          <div className="flex items-center justify-center h-full bg-slate-900">
            <div className="text-center space-y-2">
              <Map className="w-10 h-10 text-slate-600 mx-auto animate-pulse" />
              <p className="text-slate-400 text-sm">Loading map…</p>
            </div>
          </div>
        )}

        {/* Selected Road Detail Overlay */}
        {selected && (
          <div className="absolute top-4 right-4 z-[1000] w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-4 space-y-3">
            <div className="flex items-start justify-between">
              <h3 className="text-slate-100 font-semibold text-sm">{selected.name}</h3>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="text-slate-500 hover:text-slate-300 text-lg leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <span className={`inline-flex text-xs px-2 py-0.5 rounded border font-medium ${
              selected.status === "closed"
                ? "bg-red-500/10 text-red-400 border-red-500/30"
                : "bg-orange-500/10 text-orange-400 border-orange-500/30"
            }`}>
              {selected.status === "closed" ? "Fully Closed" : "Partially Open"}
            </span>
            <div className="text-xs space-y-1 text-slate-400">
              <p><span className="text-slate-300">Reason:</span> {selected.closureReason}</p>
              <p><span className="text-slate-300">District:</span> {selected.district}</p>
              {selected.affectedFrom && (
                <p><span className="text-slate-300">Since:</span> {formatRelative(selected.affectedFrom)}</p>
              )}
              {selected.estimatedClearance && (
                <p><span className="text-slate-300">Est. clearance:</span> {formatRelative(selected.estimatedClearance)} (ahead)</p>
              )}
              <p>
                <span className="text-slate-300">Affected settlements:</span>{" "}
                {selected.affectedSettlements.length > 0
                  ? selected.affectedSettlements.map(id =>
                      MOCK_SETTLEMENTS.find(s => s.id === id)?.name ?? id
                    ).join(", ")
                  : "None"}
              </p>
            </div>
            {selected.alternateRouteAvailable && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2">
                <p className="text-emerald-400 text-xs font-medium flex items-center gap-1">
                  <Navigation className="w-3.5 h-3.5" />
                  AI-suggested alternate route available
                </p>
                <p className="text-slate-400 text-xs mt-1">
                  Consult field officer to confirm route passability before dispatch.
                </p>
                <DemoBadge className="mt-1" />
              </div>
            )}
            {!selected.alternateRouteAvailable && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2">
                <p className="text-red-400 text-xs font-medium flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  No alternate route available
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function RoadCard({
  road,
  isSelected,
  onClick,
}: {
  road: RoadSegment;
  isSelected: boolean;
  onClick: () => void;
}): React.ReactElement {
  const isClosed = road.status === "closed";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg border transition-all ${
        isSelected
          ? "bg-emerald-500/10 border-emerald-500/30"
          : "bg-slate-900 border-slate-800 hover:border-slate-700"
      }`}
    >
      <div className="flex items-start gap-2.5">
        <MapPin
          className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isClosed ? "text-red-400" : "text-orange-400"}`}
          aria-hidden="true"
        />
        <div className="min-w-0">
          <p className="text-slate-200 text-sm font-medium truncate">{road.name}</p>
          <p className="text-slate-500 text-xs mt-0.5">{road.closureReason}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${
                isClosed
                  ? "bg-red-500/10 text-red-400 border-red-500/30"
                  : "bg-orange-500/10 text-orange-400 border-orange-500/30"
              }`}
            >
              {isClosed ? "Closed" : "Partial"}
            </span>
            {road.alternateRouteAvailable ? (
              <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
                <CheckCircle2 className="w-2.5 h-2.5" /> Alt. route
              </span>
            ) : (
              <span className="text-[10px] text-red-400 flex items-center gap-0.5">
                <AlertTriangle className="w-2.5 h-2.5" /> No alt.
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

function SettlementCard({ settlement }: { settlement: Settlement }): React.ReactElement {
  return (
    <div
      className={`p-3 rounded-lg border ${
        settlement.isIsolated
          ? "bg-purple-500/5 border-purple-500/20"
          : "bg-slate-900 border-slate-800"
      }`}
    >
      <div className="flex items-center gap-2">
        <Users
          className={`w-3.5 h-3.5 flex-shrink-0 ${settlement.isIsolated ? "text-purple-400" : "text-slate-500"}`}
        />
        <p className="text-slate-200 text-sm font-medium truncate">{settlement.name}</p>
        {settlement.isIsolated && (
          <span className="ml-auto shrink-0 text-[10px] px-1.5 py-0.5 bg-purple-500/10 border border-purple-500/30 text-purple-400 rounded">
            ISOLATED
          </span>
        )}
      </div>
      <div className="mt-1.5 text-xs text-slate-500 space-y-0.5">
        <p>Population: <span className="text-slate-300">{settlement.population.toLocaleString()}</span></p>
        {settlement.nearestFacility && (
          <p>
            Nearest facility:{" "}
            <span className="text-slate-300">{settlement.nearestFacility.name} ({settlement.nearestFacility.distanceKm}km)</span>
          </p>
        )}
        {settlement.isIsolated && settlement.isolatedSince && (
          <p className="text-purple-400">
            Isolated: {formatRelative(settlement.isolatedSince)}
          </p>
        )}
      </div>
    </div>
  );
}

function StatMini({ label, value, color }: { label: string; value: number; color: string }): React.ReactElement {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-center">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-slate-500 text-[10px] uppercase tracking-wide mt-0.5">{label}</p>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }): React.ReactElement {
  return (
    <div className="flex items-center gap-2 text-xs text-slate-400">
      <span className={`w-3 h-3 rounded-sm flex-shrink-0 ${color}`} />
      {label}
    </div>
  );
}

function formatRelative(iso: string): string {
  const diff = Math.abs(Date.now() - new Date(iso).getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}
