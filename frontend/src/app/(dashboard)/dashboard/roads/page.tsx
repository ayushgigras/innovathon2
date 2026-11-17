"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import {
  Map,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Navigation,
  Users,
  Compass,
  ShieldAlert,
} from "lucide-react";
import { DemoBadge } from "@/components/shared/DemoBadge";
import {
  MOCK_ROADS,
  MOCK_SETTLEMENTS,
  MOCK_FACILITIES,
  MOCK_INCIDENTS,
  MOCK_ALTERNATIVE_ROUTES,
} from "@/lib/api/mock-adapter";
import type { RoadSegment, Settlement, Incident, RouteOption } from "@/types";

// Dynamic client-only Leaflet Map component
const MapWrapper = dynamic(
  () => import("@/components/map/MapWrapper").then((mod) => mod.MapWrapper),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full min-h-[500px] bg-stone-100 dark:bg-stone-900 rounded-xl">
        <div className="text-center space-y-2">
          <Map className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mx-auto animate-pulse" />
          <p className="text-stone-600 dark:text-stone-300 text-sm font-medium">Loading GIS Mountain Map...</p>
        </div>
      </div>
    ),
  }
);

export default function RoadsPage(): React.ReactElement {
  const [selectedRoad, setSelectedRoad] = useState<RoadSegment | null>(
    MOCK_ROADS.find((r) => r.id === "RD-001") ?? null
  );
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<RouteOption | null>(
    MOCK_ALTERNATIVE_ROUTES[0] ?? null
  );
  const [activeTab, setActiveTab] = useState<"closures" | "routes" | "settlements">("closures");

  const closedRoads = MOCK_ROADS.filter((r) => r.status === "closed");
  const partialRoads = MOCK_ROADS.filter((r) => r.status === "partially_open");
  const isolatedSettlements = MOCK_SETTLEMENTS.filter((s) => s.isIsolated);

  const handleSelectRoad = (road: RoadSegment) => {
    setSelectedRoad(road);
    setSelectedIncident(null);
    if (road.status === "closed" && road.alternateRouteAvailable) {
      setSelectedRoute(MOCK_ALTERNATIVE_ROUTES[0]);
    }
  };

  const handleSelectIncident = (incident: Incident) => {
    setSelectedIncident(incident);
    const relatedRoad = MOCK_ROADS.find((r) => r.id === "RD-001");
    if (relatedRoad) setSelectedRoad(relatedRoad);
  };

  const handleRequestAlternateRoute = (road: RoadSegment) => {
    setSelectedRoad(road);
    setActiveTab("routes");
    setSelectedRoute(MOCK_ALTERNATIVE_ROUTES[0]);
  };

  return (
    <div className="flex flex-col lg:flex-row h-full overflow-hidden">
      {/* ── Left Sidebar: MargRakshak Control Deck ─────────────────────────── */}
      <aside className="w-full lg:w-84 xl:w-96 border-r border-stone-200 dark:border-stone-800 overflow-y-auto bg-stone-50 dark:bg-stone-950 flex-shrink-0">
        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#2d6a4f]/10 dark:bg-[#2d6a4f]/20 rounded-lg text-[#2d6a4f]">
              <Map className="w-5 h-5 flex-shrink-0" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-stone-900 dark:text-stone-100">MargRakshak</h1>
              <p className="text-stone-500 dark:text-stone-400 text-xs">Mountain Road Sentinel &amp; Accessibility</p>
            </div>
          </div>
          <DemoBadge variant="banner" />

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-2">
            <StatMini label="Closed" value={closedRoads.length} color="text-red-500" bg="bg-red-50 dark:bg-red-950/30" />
            <StatMini label="Partial" value={partialRoads.length} color="text-orange-500" bg="bg-orange-50 dark:bg-orange-950/30" />
            <StatMini label="Cut Off" value={isolatedSettlements.length} color="text-purple-600 dark:text-purple-400" bg="bg-purple-50 dark:bg-purple-950/30" />
          </div>

          {/* Module Sub-tabs */}
          <div className="flex bg-stone-200/80 dark:bg-stone-900 rounded-lg p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab("closures")}
              className={`flex-1 py-1.5 rounded-md transition-all ${
                activeTab === "closures"
                  ? "bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-sm"
                  : "text-stone-600 dark:text-stone-400 hover:text-stone-900"
              }`}
            >
              Road Closures ({closedRoads.length + partialRoads.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("routes")}
              className={`flex-1 py-1.5 rounded-md transition-all ${
                activeTab === "routes"
                  ? "bg-white dark:bg-stone-800 text-emerald-700 dark:text-emerald-400 shadow-sm"
                  : "text-stone-600 dark:text-stone-400 hover:text-stone-900"
              }`}
            >
              Alt Routes ({MOCK_ALTERNATIVE_ROUTES.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("settlements")}
              className={`flex-1 py-1.5 rounded-md transition-all ${
                activeTab === "settlements"
                  ? "bg-white dark:bg-stone-800 text-purple-700 dark:text-purple-400 shadow-sm"
                  : "text-stone-600 dark:text-stone-400 hover:text-stone-900"
              }`}
            >
              Villages ({isolatedSettlements.length} isolated)
            </button>
          </div>

          {/* Tab 1: Road Closures List */}
          {activeTab === "closures" && (
            <div className="space-y-2">
              <h2 className="text-stone-700 dark:text-stone-300 text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                Active Highway Hazards
              </h2>
              {MOCK_ROADS.filter((r) => r.status !== "open").map((road) => (
                <RoadCard
                  key={road.id}
                  road={road}
                  isSelected={selectedRoad?.id === road.id}
                  onClick={() => handleSelectRoad(road)}
                />
              ))}
            </div>
          )}

          {/* Tab 2: Calculated Alternative Routes */}
          {activeTab === "routes" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-stone-700 dark:text-stone-300 text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-emerald-600" />
                  MargRakshak Graph Routes
                </h2>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-1.5 py-0.5 rounded font-bold">
                  Road-Following
                </span>
              </div>
              <p className="text-stone-500 text-xs">
                Alternative corridors avoiding the NH-44 Panthyal landslide choke point:
              </p>
              {MOCK_ALTERNATIVE_ROUTES.map((route) => {
                const isSelected = selectedRoute?.routeId === route.routeId;
                const isRecommended = route.status === "recommended";
                return (
                  <button
                    key={route.routeId}
                    type="button"
                    onClick={() => setSelectedRoute(route)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      isSelected
                        ? isRecommended
                          ? "bg-emerald-500/10 border-emerald-500/40 ring-1 ring-emerald-500"
                          : "bg-blue-500/10 border-blue-500/40 ring-1 ring-blue-500"
                        : "bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-stone-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className={`inline-block px-1.5 py-0.5 text-[10px] font-bold rounded mb-1 ${
                          isRecommended
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                        }`}>
                          {isRecommended ? "⭐ Recommended Bypass" : "Secondary Alternate"}
                        </span>
                        <p className="font-semibold text-xs text-stone-900 dark:text-stone-100">
                          {route.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs font-medium text-stone-600 dark:text-stone-300">
                      <span>📏 {route.distanceKm} km</span>
                      <span>⏱️ ~{Math.floor(route.estimatedTimeMinutes / 60)}h {route.estimatedTimeMinutes % 60}m</span>
                    </div>
                    {route.reason && (
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1.5">
                        {route.reason}
                      </p>
                    )}
                    {route.warnings && (
                      <div className="mt-2 text-[10px] text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/40 p-1.5 rounded">
                        ⚠ {route.warnings[0]}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Tab 3: Settlements & Isolated Villages */}
          {activeTab === "settlements" && (
            <div className="space-y-2">
              <h2 className="text-stone-700 dark:text-stone-300 text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-purple-500" />
                Settlement Statuses
              </h2>
              {MOCK_SETTLEMENTS.map((s) => (
                <SettlementCard key={s.id} settlement={s} />
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* ── Main Map Workspace ────────────────────────────────────────────── */}
      <div className="flex-1 relative flex flex-col p-4 bg-stone-100 dark:bg-stone-900 overflow-hidden">
        <div className="flex-1 w-full h-full relative rounded-xl overflow-hidden shadow-lg border border-stone-200 dark:border-stone-800">
          <MapWrapper
            roads={MOCK_ROADS}
            settlements={MOCK_SETTLEMENTS}
            facilities={MOCK_FACILITIES}
            incidents={MOCK_INCIDENTS}
            alternativeRoutes={MOCK_ALTERNATIVE_ROUTES}
            selectedRoad={selectedRoad}
            selectedIncident={selectedIncident}
            selectedRoute={selectedRoute}
            onSelectRoad={handleSelectRoad}
            onSelectIncident={handleSelectIncident}
            onSelectRoute={(rt) => setSelectedRoute(rt)}
            onRequestAlternativeRoute={handleRequestAlternateRoute}
          />
        </div>

        {/* ── Bottom Information Card: Selected Road / Alternate Route ────── */}
        {selectedRoad && (
          <div className="mt-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-3 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  selectedRoad.status === "closed"
                    ? "bg-red-100 text-red-700 border border-red-300"
                    : selectedRoad.status === "partially_open"
                    ? "bg-orange-100 text-orange-700 border border-orange-300"
                    : "bg-emerald-100 text-emerald-700"
                }`}>
                  {selectedRoad.status === "closed" ? "⛔ Fully Closed" : selectedRoad.status === "partially_open" ? "⚠ Partially Open" : "✓ Open"}
                </span>
                <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                  {selectedRoad.name} ({selectedRoad.district})
                </h3>
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-400">
                <span className="font-semibold text-stone-800 dark:text-stone-200">Incident Details:</span> {selectedRoad.closureReason}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {selectedRoad.alternateRouteAvailable ? (
                <button
                  type="button"
                  onClick={() => handleRequestAlternateRoute(selectedRoad)}
                  className="bg-[#2d6a4f] hover:bg-[#1b4332] text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  View Green Bypass Route
                </button>
              ) : (
                <span className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
                  No immediate alternate
                </span>
              )}
            </div>
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
      className={`w-full text-left p-3 rounded-xl border transition-all ${
        isSelected
          ? isClosed
            ? "bg-red-500/10 border-red-500/40 ring-1 ring-red-500"
            : "bg-orange-500/10 border-orange-500/40 ring-1 ring-orange-500"
          : "bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-stone-300"
      }`}
    >
      <div className="flex items-start gap-2.5">
        <MapPin
          className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isClosed ? "text-red-500" : "text-orange-500"}`}
        />
        <div className="min-w-0 flex-1">
          <p className="text-stone-900 dark:text-stone-100 text-xs font-bold truncate">{road.name}</p>
          <p className="text-stone-500 text-[11px] mt-0.5 line-clamp-1">{road.closureReason}</p>
          <div className="flex items-center justify-between gap-2 mt-2">
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                isClosed
                  ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                  : "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300"
              }`}
            >
              {isClosed ? "Closed" : "Partial"}
            </span>
            {road.alternateRouteAvailable ? (
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                <CheckCircle2 className="w-2.5 h-2.5" /> Alt Available
              </span>
            ) : (
              <span className="text-[10px] text-red-500 font-semibold flex items-center gap-0.5">
                <AlertTriangle className="w-2.5 h-2.5" /> No Alt
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
      className={`p-3 rounded-xl border ${
        settlement.isIsolated
          ? "bg-purple-500/10 border-purple-500/30"
          : "bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800"
      }`}
    >
      <div className="flex items-center gap-2">
        <Users
          className={`w-3.5 h-3.5 flex-shrink-0 ${settlement.isIsolated ? "text-purple-600 dark:text-purple-400" : "text-stone-500"}`}
        />
        <p className="text-stone-900 dark:text-stone-100 text-xs font-bold truncate">{settlement.name}</p>
        {settlement.isIsolated && (
          <span className="ml-auto shrink-0 text-[10px] px-1.5 py-0.5 bg-purple-100 border border-purple-300 text-purple-800 font-bold rounded">
            ⚠ ISOLATED
          </span>
        )}
      </div>
      <div className="mt-1.5 text-[11px] text-stone-500 space-y-0.5">
        <p>Population: <span className="text-stone-700 dark:text-stone-300 font-medium">{settlement.population.toLocaleString()}</span></p>
        {settlement.nearestFacility && (
          <p>
            Nearest Hospital:{" "}
            <span className="text-stone-700 dark:text-stone-300 font-medium">
              {settlement.nearestFacility.name} ({settlement.nearestFacility.distanceKm} km)
            </span>
          </p>
        )}
      </div>
    </div>
  );
}

function StatMini({
  label,
  value,
  color,
  bg,
}: {
  label: string;
  value: number;
  color: string;
  bg: string;
}): React.ReactElement {
  return (
    <div className={`${bg} border border-stone-200 dark:border-stone-800 rounded-xl p-2.5 text-center`}>
      <p className={`text-2xl font-black ${color}`}>{value}</p>
      <p className="text-stone-600 dark:text-stone-400 text-[10px] font-bold uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  );
}
