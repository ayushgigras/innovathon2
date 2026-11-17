"use client";

import React, { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  CircleMarker,
  Popup,
  Tooltip,
  useMap,
} from "react-leaflet";
import type { RoadSegment, Settlement, Incident, CriticalFacility, RouteOption } from "@/types";

interface MapWrapperProps {
  roads: RoadSegment[];
  settlements: Settlement[];
  facilities?: CriticalFacility[];
  incidents?: Incident[];
  alternativeRoutes?: RouteOption[];
  selectedRoad?: RoadSegment | null;
  selectedIncident?: Incident | null;
  selectedRoute?: RouteOption | null;
  onSelectRoad: (road: RoadSegment) => void;
  onSelectIncident?: (incident: Incident) => void;
  onSelectRoute?: (route: RouteOption) => void;
  onRequestAlternativeRoute?: (road: RoadSegment) => void;
}

// Map pan and zoom controller
function MapViewController({
  center,
  zoom,
}: {
  center: [number, number];
  zoom: number;
}): React.ReactElement {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [map, center, zoom]);
  return <></>;
}

// Styling tokens
const ROAD_COLORS: Record<string, string> = {
  closed: "#ef4444",        // Bright Red for blocked
  partially_open: "#f97316", // Amber / Orange for partial
  open: "#94a3b8",          // Neutral slate/grey for normal open roads
  unknown: "#64748b",
};

export function MapWrapper({
  roads,
  settlements,
  facilities = [],
  incidents = [],
  alternativeRoutes = [],
  selectedRoad,
  selectedIncident,
  selectedRoute,
  onSelectRoad,
  onSelectIncident,
  onSelectRoute,
  onRequestAlternativeRoute,
}: MapWrapperProps): React.ReactElement {
  // Map Basemap & Scope
  const [mapMode, setMapMode] = useState<"street" | "satellite">("satellite");
  const [activeRegion, setActiveRegion] = useState<string>("ramban");

  // Layer Toggles
  const [showNormalRoads, setShowNormalRoads] = useState<boolean>(true);
  const [showAffectedRoads, setShowAffectedRoads] = useState<boolean>(true);
  const [showAlternativeRoutes, setShowAlternativeRoutes] = useState<boolean>(true);
  const [showIncidents, setShowIncidents] = useState<boolean>(true);
  const [showFacilities, setShowFacilities] = useState<boolean>(true);
  const [showSettlements, setShowSettlements] = useState<boolean>(true);
  const [isLayersOpen, setIsLayersOpen] = useState<boolean>(false);
  const [isLegendOpen, setIsLegendOpen] = useState<boolean>(true);

  // Compute map target center and zoom based on selection or active region
  const mapCenter: [number, number] = React.useMemo(() => {
    if (selectedRoad && selectedRoad.coordinates.length > 0) {
      const mid = selectedRoad.coordinates[Math.floor(selectedRoad.coordinates.length / 2)];
      return [mid.lat, mid.lng];
    }
    if (selectedIncident) {
      return [selectedIncident.location.lat, selectedIncident.location.lng];
    }
    if (activeRegion === "all") return [33.40, 75.20];
    if (activeRegion === "shopian") return [33.72, 74.83];
    if (activeRegion === "doda") return [33.15, 75.60];
    return [33.25, 75.25]; // ramban default
  }, [selectedRoad, selectedIncident, activeRegion]);

  const mapZoom: number = React.useMemo(() => {
    if (selectedRoad || selectedIncident) return 12;
    if (activeRegion === "all") return 8;
    if (activeRegion === "doda") return 10;
    return 11;
  }, [selectedRoad, selectedIncident, activeRegion]);

  const normalRoads = roads.filter((r) => r.status === "open");
  const affectedRoads = roads.filter((r) => r.status !== "open");

  return (
    <div className="relative w-full h-full min-h-[500px] overflow-hidden rounded-xl border border-stone-300 dark:border-stone-800 shadow-inner">
      {/* ── Top-Right Controls: Basemap & Region ──────────────────────────── */}
      <div className="absolute top-3 right-3 z-[1000] flex flex-col sm:flex-row items-end sm:items-center gap-2">
        {/* Region Selector */}
        <select
          value={activeRegion}
          onChange={(e) => setActiveRegion(e.target.value)}
          className="bg-white/95 dark:bg-stone-900/95 backdrop-blur-md text-stone-800 dark:text-stone-200 border border-stone-300 dark:border-stone-700 rounded-lg px-2.5 py-1.5 text-xs font-medium shadow-md focus:outline-none focus:ring-1 focus:ring-emerald-500"
          aria-label="Select Focus Region"
        >
          <option value="all">🗺️ All Jammu & Kashmir (Overview)</option>
          <option value="ramban">📍 Ramban Sector (NH-44 Landslide)</option>
          <option value="shopian">📍 Shopian Sector (Mughal Road)</option>
          <option value="doda">📍 Doda & Chenab Valley</option>
        </select>

        {/* Basemap Switcher */}
        <div className="flex bg-white/95 dark:bg-stone-900/95 backdrop-blur-md rounded-lg shadow-md border border-stone-300 dark:border-stone-700 p-0.5 text-xs font-medium">
          <button
            type="button"
            onClick={() => setMapMode("street")}
            className={`px-3 py-1.5 rounded-md transition-all ${
              mapMode === "street"
                ? "bg-[#2d6a4f] text-white shadow-sm font-semibold"
                : "text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white"
            }`}
          >
            🗺️ Street
          </button>
          <button
            type="button"
            onClick={() => setMapMode("satellite")}
            className={`px-3 py-1.5 rounded-md transition-all ${
              mapMode === "satellite"
                ? "bg-[#2d6a4f] text-white shadow-sm font-semibold"
                : "text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white"
            }`}
          >
            🛰️ Satellite
          </button>
        </div>

        {/* Layer Toggle Button */}
        <button
          type="button"
          onClick={() => setIsLayersOpen(!isLayersOpen)}
          className="bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-200 px-3 py-1.5 rounded-lg text-xs font-medium shadow-md hover:bg-stone-50 dark:hover:bg-stone-800"
        >
          🥞 Layers ({[showNormalRoads, showAffectedRoads, showAlternativeRoutes, showIncidents, showFacilities, showSettlements].filter(Boolean).length}/6)
        </button>
      </div>

      {/* ── Layer Toggles Dropdown Panel ───────────────────────────────────── */}
      {isLayersOpen && (
        <div className="absolute top-14 right-3 z-[1000] w-64 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border border-stone-300 dark:border-stone-700 rounded-xl p-3 shadow-xl space-y-2 text-xs">
          <div className="flex items-center justify-between pb-1 border-b border-stone-200 dark:border-stone-800">
            <span className="font-semibold text-stone-800 dark:text-stone-100">Map Layers</span>
            <button
              type="button"
              onClick={() => setIsLayersOpen(false)}
              className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-sm font-bold"
            >
              ×
            </button>
          </div>
          <label className="flex items-center gap-2 cursor-pointer text-stone-700 dark:text-stone-300">
            <input
              type="checkbox"
              checked={showNormalRoads}
              onChange={(e) => setShowNormalRoads(e.target.checked)}
              className="rounded text-[#2d6a4f] focus:ring-emerald-500"
            />
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block" />
            Layer A: Normal Open Roads ({normalRoads.length})
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-stone-700 dark:text-stone-300">
            <input
              type="checkbox"
              checked={showAffectedRoads}
              onChange={(e) => setShowAffectedRoads(e.target.checked)}
              className="rounded text-red-500 focus:ring-red-500"
            />
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
            Layer B: Affected Roads ({affectedRoads.length})
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-stone-700 dark:text-stone-300">
            <input
              type="checkbox"
              checked={showAlternativeRoutes}
              onChange={(e) => setShowAlternativeRoutes(e.target.checked)}
              className="rounded text-emerald-500 focus:ring-emerald-500"
            />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            Layer C: Alternative Routes ({alternativeRoutes.length})
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-stone-700 dark:text-stone-300">
            <input
              type="checkbox"
              checked={showIncidents}
              onChange={(e) => setShowIncidents(e.target.checked)}
              className="rounded text-red-500 focus:ring-red-500"
            />
            <span>💥 Incident Markers ({incidents.length})</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-stone-700 dark:text-stone-300">
            <input
              type="checkbox"
              checked={showFacilities}
              onChange={(e) => setShowFacilities(e.target.checked)}
              className="rounded text-blue-500 focus:ring-blue-500"
            />
            <span>🏥 Critical Facilities ({facilities.length})</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-stone-700 dark:text-stone-300">
            <input
              type="checkbox"
              checked={showSettlements}
              onChange={(e) => setShowSettlements(e.target.checked)}
              className="rounded text-purple-500 focus:ring-purple-500"
            />
            <span>🏘️ Settlements ({settlements.length})</span>
          </label>
        </div>
      )}

      {/* ── Bottom-Left GIS Map Legend ──────────────────────────────────────── */}
      <div className="absolute bottom-3 left-3 z-[1000]">
        {isLegendOpen ? (
          <div className="bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border border-stone-300 dark:border-stone-700 rounded-xl p-3 shadow-xl max-w-xs text-xs space-y-1.5">
            <div className="flex items-center justify-between pb-1 border-b border-stone-200 dark:border-stone-800">
              <span className="font-semibold text-stone-800 dark:text-stone-100 uppercase tracking-wider text-[10px]">
                GIS Map Legend
              </span>
              <button
                type="button"
                onClick={() => setIsLegendOpen(false)}
                className="text-stone-400 hover:text-stone-600 text-xs"
              >
                Hide
              </button>
            </div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-stone-700 dark:text-stone-300">
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-1 bg-red-500 rounded-full" />
                <span>Road Closed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-1 bg-orange-500 rounded-full" />
                <span>Partially Open</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-1 bg-slate-400 rounded-full" />
                <span>Normal Open Road</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-1 bg-emerald-500 rounded-full border-b border-dashed border-white" />
                <span>Alt Route (Green)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 ring-2 ring-purple-300 inline-block" />
                <span>Isolated Village</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-500 inline-block" />
                <span>Connected Town</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span>🏥</span>
                <span>Hospital</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span>📦</span>
                <span>Relief Depot</span>
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsLegendOpen(true)}
            className="bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 px-2.5 py-1 rounded-lg text-xs font-medium shadow-md"
          >
            🗺️ Show Legend
          </button>
        )}
      </div>

      {/* ── Leaflet Map Container ─────────────────────────────────────────── */}
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        className="w-full h-full min-h-[500px]"
        style={{ background: mapMode === "satellite" ? "#141c18" : "#f1ede6" }}
      >
        <MapViewController center={mapCenter} zoom={mapZoom} />

        {/* Basemap Tile Layer */}
        {mapMode === "street" ? (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        ) : (
          <TileLayer
            attribution='Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and GIS User Community'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxZoom={18}
          />
        )}

        {/* ── Layer A: Normal Open Mountain Corridors (Neutral Grey) ───────── */}
        {showNormalRoads &&
          normalRoads.map((road) => {
            const positions: [number, number][] = road.coordinates.map((c) => [c.lat, c.lng]);
            const isSelected = selectedRoad?.id === road.id;
            return (
              <Polyline
                key={road.id}
                positions={positions}
                pathOptions={{
                  color: isSelected ? "#38bdf8" : ROAD_COLORS.open,
                  weight: isSelected ? 5 : 3.5,
                  opacity: 0.75,
                }}
                eventHandlers={{
                  click: () => onSelectRoad(road),
                }}
              >
                <Tooltip sticky direction="top" className="text-xs">
                  <strong>{road.name}</strong> (Open)
                </Tooltip>
                <Popup>
                  <div className="text-xs space-y-1">
                    <p className="font-bold text-sm text-stone-900">{road.name}</p>
                    <p><span className="text-stone-500">District:</span> {road.district}</p>
                    <p className="text-emerald-700 font-semibold">✓ Normal Open Corridor</p>
                  </div>
                </Popup>
              </Polyline>
            );
          })}

        {/* ── Layer B: Disaster-Affected Roads (Closed / Partial) ─────────── */}
        {showAffectedRoads &&
          affectedRoads.map((road) => {
            const positions: [number, number][] = road.coordinates.map((c) => [c.lat, c.lng]);
            const isClosed = road.status === "closed";
            const isSelected = selectedRoad?.id === road.id;
            return (
              <Polyline
                key={road.id}
                positions={positions}
                pathOptions={{
                  color: isSelected ? "#f43f5e" : ROAD_COLORS[road.status] ?? "#ef4444",
                  weight: isSelected ? 7 : 5,
                  opacity: 0.95,
                  dashArray: road.status === "unknown" ? "6, 6" : undefined,
                }}
                eventHandlers={{
                  click: () => onSelectRoad(road),
                }}
              >
                <Tooltip sticky direction="top" className="text-xs">
                  <span className={isClosed ? "text-red-600 font-bold" : "text-orange-600 font-bold"}>
                    {isClosed ? "⛔ " : "⚠ "} {road.name} ({isClosed ? "CLOSED" : "PARTIAL"})
                  </span>
                </Tooltip>
                <Popup>
                  <div className="text-xs space-y-1.5 p-1 max-w-xs">
                    <p className="font-bold text-sm text-stone-900">{road.name}</p>
                    <div className="flex items-center gap-1.5">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        isClosed ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"
                      }`}>
                        {isClosed ? "Fully Closed" : "Partially Accessible"}
                      </span>
                      <span className="text-stone-500 text-[11px]">{road.district} District</span>
                    </div>
                    <p className="text-stone-700 text-xs">
                      <span className="font-semibold text-stone-900">Reason:</span> {road.closureReason}
                    </p>
                    {road.affectedSettlements.length > 0 && (
                      <p className="text-purple-700 text-[11px]">
                        <strong>Affected settlements:</strong> {road.affectedSettlements.join(", ")}
                      </p>
                    )}
                    {road.alternateRouteAvailable && onRequestAlternativeRoute && (
                      <button
                        type="button"
                        onClick={() => onRequestAlternativeRoute(road)}
                        className="w-full mt-2 bg-[#2d6a4f] hover:bg-[#1b4332] text-white py-1 px-2 rounded text-[11px] font-medium transition-colors"
                      >
                        🧭 Calculate Alternative Route
                      </button>
                    )}
                  </div>
                </Popup>
              </Polyline>
            );
          })}

        {/* ── Layer C: Calculated Alternative Routes (Road-Following) ─────── */}
        {showAlternativeRoutes &&
          alternativeRoutes.map((route) => {
            const positions: [number, number][] = route.geometry.map((c) => [c.lat, c.lng]);
            const isRecommended = route.status === "recommended";
            const isSelected = selectedRoute?.routeId === route.routeId;
            return (
              <Polyline
                key={route.routeId}
                positions={positions}
                pathOptions={{
                  color: isRecommended ? "#10b981" : "#3b82f6",
                  weight: isSelected ? 6 : 4.5,
                  opacity: 0.95,
                  dashArray: isRecommended ? "10, 6" : undefined,
                }}
                eventHandlers={{
                  click: () => onSelectRoute?.(route),
                }}
              >
                <Tooltip sticky direction="top" className="text-xs">
                  <span className={isRecommended ? "text-emerald-700 font-bold" : "text-blue-700 font-bold"}>
                    {isRecommended ? "🟢 " : "🔵 "} {route.name} ({route.distanceKm} km, {route.estimatedTimeMinutes}m)
                  </span>
                </Tooltip>
                <Popup>
                  <div className="text-xs space-y-1.5 p-1 max-w-xs">
                    <p className={`font-bold text-sm ${isRecommended ? "text-emerald-700" : "text-blue-700"}`}>
                      {route.name}
                    </p>
                    <div className="flex items-center gap-2 text-stone-600 text-xs font-medium">
                      <span>📏 {route.distanceKm} km</span>
                      <span>⏱️ ~{Math.floor(route.estimatedTimeMinutes / 60)}h {route.estimatedTimeMinutes % 60}m</span>
                    </div>
                    {route.reason && (
                      <p className="text-stone-700 text-xs bg-stone-100 dark:bg-stone-800 p-1.5 rounded">
                        {route.reason}
                      </p>
                    )}
                    {route.warnings && route.warnings.length > 0 && (
                      <div className="text-orange-700 text-[11px] space-y-0.5">
                        {route.warnings.map((w, idx) => (
                          <p key={idx}>⚠ {w}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </Popup>
              </Polyline>
            );
          })}

        {/* ── Layer D: Incident Markers ───────────────────────────────────── */}
        {showIncidents &&
          incidents.map((incident) => (
            <CircleMarker
              key={incident.id}
              center={[incident.location.lat, incident.location.lng]}
              radius={9}
              pathOptions={{
                color: "#dc2626",
                fillColor: "#ef4444",
                fillOpacity: 0.9,
                weight: 2,
              }}
              eventHandlers={{
                click: () => onSelectIncident?.(incident),
              }}
            >
              <Tooltip sticky direction="top">
                <strong>💥 {incident.title}</strong> ({incident.severity})
              </Tooltip>
              <Popup>
                <div className="text-xs space-y-1.5 p-1">
                  <p className="font-bold text-sm text-red-600">{incident.title}</p>
                  <p className="text-stone-600 text-xs">{incident.description}</p>
                  <p><span className="font-semibold">District:</span> {incident.district}</p>
                  <p><span className="font-semibold">Status:</span> {incident.status}</p>
                </div>
              </Popup>
            </CircleMarker>
          ))}

        {/* ── Layer E: Critical Facilities (Hospitals & Warehouses) ────────── */}
        {showFacilities &&
          facilities.map((fac) => {
            const isHospital = fac.type === "hospital";
            return (
              <CircleMarker
                key={fac.id}
                center={[fac.location.lat, fac.location.lng]}
                radius={8}
                pathOptions={{
                  color: isHospital ? "#dc2626" : "#4f46e5",
                  fillColor: isHospital ? "#fee2e2" : "#e0e7ff",
                  fillOpacity: 0.9,
                  weight: 2,
                }}
              >
                <Tooltip sticky direction="top">
                  <span>{isHospital ? "🏥 " : "📦 "} {fac.name}</span>
                </Tooltip>
                <Popup>
                  <div className="text-xs space-y-1">
                    <p className="font-bold text-sm text-stone-900">
                      {isHospital ? "🏥 " : "📦 "} {fac.name}
                    </p>
                    <p><span className="text-stone-500">Type:</span> {isHospital ? "Hospital / Medical Post" : "Relief Logistics Warehouse"}</p>
                    <p><span className="text-stone-500">District:</span> {fac.district}</p>
                    {fac.capacity && (
                      <p><span className="text-stone-500">Capacity:</span> {fac.capacity} {isHospital ? "beds" : "tonnes"}</p>
                    )}
                    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                      Operational
                    </span>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

        {/* ── Layer F: Settlements (Isolated vs Connected) ─────────────────── */}
        {showSettlements &&
          settlements.map((settlement) => (
            <CircleMarker
              key={settlement.id}
              center={[settlement.location.lat, settlement.location.lng]}
              radius={settlement.isIsolated ? 10 : 6}
              pathOptions={{
                color: settlement.isIsolated ? "#9333ea" : "#64748b",
                fillColor: settlement.isIsolated ? "#c084fc" : "#94a3b8",
                fillOpacity: settlement.isIsolated ? 0.9 : 0.6,
                weight: settlement.isIsolated ? 3 : 1.5,
              }}
            >
              <Tooltip sticky direction="top">
                <span>{settlement.isIsolated ? "⚠️ ISOLATED: " : "🏘️ "} {settlement.name}</span>
              </Tooltip>
              <Popup>
                <div className="text-xs space-y-1 p-0.5">
                  <p className="font-bold text-sm text-stone-900">{settlement.name}</p>
                  <p><span className="text-stone-500">Population:</span> {settlement.population.toLocaleString()}</p>
                  <p><span className="text-stone-500">District:</span> {settlement.district}</p>
                  {settlement.nearestFacility && (
                    <p>
                      <span className="text-stone-500">Nearest facility:</span>{" "}
                      {settlement.nearestFacility.name} ({settlement.nearestFacility.distanceKm} km)
                    </p>
                  )}
                  {settlement.isIsolated ? (
                    <div className="mt-1 bg-purple-100 text-purple-800 border border-purple-300 rounded px-2 py-1 font-bold text-[11px]">
                      ⚠️ ROAD ACCESS CUT OFF — ISOLATED
                    </div>
                  ) : (
                    <div className="mt-1 text-emerald-700 font-semibold text-[11px]">
                      ✓ Connected to Road Network
                    </div>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          ))}
      </MapContainer>
    </div>
  );
}
