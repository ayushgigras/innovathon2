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
import {
  Search,
  AlertTriangle,
  Send,
  X,
  Radio,
} from "lucide-react";
import type { RoadSegment, Settlement, Incident, CriticalFacility, RouteOption } from "@/types";
import { addCitizenReport, MOCK_ALERTS } from "@/lib/api/mock-adapter";

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
  onReportCreated?: (incident: Incident) => void;
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

// Preset Indian mountain search targets
const PRESET_SEARCH_LOCATIONS = [
  { name: "Ramban (NH-44 Sector)", lat: 33.244, lng: 75.258, zoom: 13, tag: "Critical Landslide Zone" },
  { name: "Banihal (North Portal)", lat: 33.500, lng: 75.200, zoom: 13, tag: "Jawahar Tunnel Corridor" },
  { name: "Panthyal (Shooting Stones)", lat: 33.244, lng: 75.258, zoom: 14, tag: "Active Obstruction" },
  { name: "Khari (Isolated Village)", lat: 33.280, lng: 75.285, zoom: 13, tag: "Cut-Off Settlement" },
  { name: "Shopian (Mughal Road Bypass)", lat: 33.720, lng: 74.830, zoom: 12, tag: "Alternate Route" },
  { name: "Doda & Chenab River", lat: 33.148, lng: 75.546, zoom: 12, tag: "Flood Watch Zone" },
  { name: "Kishtwar", lat: 33.310, lng: 75.760, zoom: 12, tag: "Upper Chenab Valley" },
  { name: "Srinagar (Valley HQ)", lat: 34.080, lng: 74.790, zoom: 12, tag: "State EOC Hub" },
  { name: "Jammu (Winter Logistics)", lat: 32.720, lng: 74.850, zoom: 12, tag: "Relief Depot Center" },
];

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
  onReportCreated,
}: MapWrapperProps): React.ReactElement {
  // Map Basemap & Scope
  const [mapMode, setMapMode] = useState<"street" | "satellite">("satellite");
  const [activeRegion, setActiveRegion] = useState<string>("ramban");

  // Search State
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [searchTarget, setSearchTarget] = useState<{ center: [number, number]; zoom: number } | null>(null);

  // Quick Report Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [reportTitle, setReportTitle] = useState<string>("");
  const [reportCategory, setReportCategory] = useState<string>("landslide");
  const [reportSeverity, setReportSeverity] = useState<"critical" | "high" | "medium" | "low">("critical");
  const [reportDescription, setReportDescription] = useState<string>("");
  const [reportSuccessMessage, setReportSuccessMessage] = useState<string | null>(null);

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
    if (searchTarget) return searchTarget.center;
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
  }, [searchTarget, selectedRoad, selectedIncident, activeRegion]);

  const mapZoom: number = React.useMemo(() => {
    if (searchTarget) return searchTarget.zoom;
    if (selectedRoad || selectedIncident) return 12;
    if (activeRegion === "all") return 8;
    if (activeRegion === "doda") return 10;
    return 11;
  }, [searchTarget, selectedRoad, selectedIncident, activeRegion]);

  const normalRoads = roads.filter((r) => r.status === "open");
  const affectedRoads = roads.filter((r) => r.status !== "open");

  // Handle Search Location Select
  const handleSelectLocation = (loc: typeof PRESET_SEARCH_LOCATIONS[0]) => {
    setSearchTarget({ center: [loc.lat, loc.lng], zoom: loc.zoom });
    setSearchQuery(loc.name);
    setIsSearchOpen(false);
  };

  // Handle Free-text Search
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.toLowerCase().trim();
    if (!query) return;

    // Check presets
    const match = PRESET_SEARCH_LOCATIONS.find((l) => l.name.toLowerCase().includes(query));
    if (match) {
      handleSelectLocation(match);
      return;
    }

    // Check settlements
    const settlementMatch = settlements.find((s) => s.name.toLowerCase().includes(query));
    if (settlementMatch) {
      setSearchTarget({
        center: [settlementMatch.location.lat, settlementMatch.location.lng],
        zoom: 13,
      });
      setIsSearchOpen(false);
      return;
    }

    // Check roads
    const roadMatch = roads.find((r) => r.name.toLowerCase().includes(query));
    if (roadMatch && roadMatch.coordinates.length > 0) {
      const mid = roadMatch.coordinates[Math.floor(roadMatch.coordinates.length / 2)];
      setSearchTarget({ center: [mid.lat, mid.lng], zoom: 12 });
      onSelectRoad(roadMatch);
      setIsSearchOpen(false);
      return;
    }
  };

  // Handle Citizen Report Submission
  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTitle.trim()) return;

    const newInc = addCitizenReport({
      title: reportTitle,
      description: reportDescription || "Reported via interactive Leaflet GIS view.",
      severity: reportSeverity,
      district: activeRegion === "shopian" ? "Shopian" : activeRegion === "doda" ? "Doda" : "Ramban",
      location: {
        lat: mapCenter[0] + (Math.random() - 0.5) * 0.01,
        lng: mapCenter[1] + (Math.random() - 0.5) * 0.01,
      },
      reportedBy: "citizen_demo",
    });

    if (onReportCreated) {
      onReportCreated(newInc);
    }
    if (onSelectIncident) {
      onSelectIncident(newInc);
    }

    setReportSuccessMessage(`Report ${newInc.id} logged! Plotted on map as UNVERIFIED (awaiting DDMA review).`);
    setTimeout(() => {
      setReportSuccessMessage(null);
      setIsReportModalOpen(false);
      setReportTitle("");
      setReportDescription("");
    }, 2500);
  };

  const activeAlert = MOCK_ALERTS[0];

  return (
    <div className="relative w-full h-full min-h-[500px] overflow-hidden rounded-xl border border-stone-300 dark:border-stone-800 shadow-inner">
      {/* ── Top-Left: Search Bar & Report Button ────────────────────────────── */}
      <div className="absolute top-3 left-12 z-[1000] flex items-center gap-2 max-w-sm sm:max-w-md">
        <div className="relative">
          <form onSubmit={handleSearchSubmit} className="flex items-center">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-stone-500 absolute left-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setIsSearchOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                placeholder="Search Indian city, road, village..."
                className="pl-8 pr-7 py-1.5 w-48 sm:w-64 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md text-stone-800 dark:text-stone-200 border border-stone-300 dark:border-stone-700 rounded-lg text-xs font-medium shadow-md focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSearchTarget(null);
                  }}
                  className="absolute right-2 text-stone-400 hover:text-stone-600 text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </form>

          {/* Search Dropdown Results */}
          {isSearchOpen && (
            <div className="absolute top-10 left-0 w-72 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border border-stone-300 dark:border-stone-700 rounded-xl p-2 shadow-2xl space-y-1 text-xs max-h-64 overflow-y-auto">
              <div className="px-2 py-1 text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
                Popular Mountain Locations
              </div>
              {PRESET_SEARCH_LOCATIONS.filter((l) =>
                l.name.toLowerCase().includes(searchQuery.toLowerCase())
              ).map((loc) => (
                <button
                  key={loc.name}
                  type="button"
                  onClick={() => handleSelectLocation(loc)}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center justify-between text-stone-800 dark:text-stone-200 transition-colors"
                >
                  <div className="font-medium">{loc.name}</div>
                  <span className="text-[10px] text-stone-500 bg-stone-200/60 dark:bg-stone-800 px-1.5 py-0.5 rounded">
                    {loc.tag}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Report Incident Button */}
        <button
          type="button"
          onClick={() => setIsReportModalOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow-md flex items-center gap-1.5 transition-colors shrink-0"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Report Incident</span>
          <span className="sm:hidden">Report</span>
        </button>
      </div>

      {/* ── Top-Right Controls: Basemap & Region ──────────────────────────── */}
      <div className="absolute top-3 right-3 z-[1000] flex flex-col sm:flex-row items-end sm:center gap-2">
        {/* Region Selector */}
        <select
          value={activeRegion}
          onChange={(e) => {
            setActiveRegion(e.target.value);
            setSearchTarget(null);
          }}
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
            🛰️ Live Satellite
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

      {/* ── Active Broadcast Emergency Banner (Clickable) ────────────────── */}
      {activeAlert && (
        <div className="absolute bottom-16 sm:bottom-3 right-3 z-[990] max-w-sm bg-red-950/90 text-white backdrop-blur-md border border-red-600/70 rounded-xl p-2.5 shadow-xl text-xs space-y-1">
          <div className="flex items-center justify-between text-red-300 font-bold uppercase tracking-wider text-[10px]">
            <span className="flex items-center gap-1">
              <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" />
              Official Emergency Broadcast
            </span>
            <span className="bg-red-700 text-white px-1.5 py-0.2 rounded text-[9px]">LIVE</span>
          </div>
          <p className="font-semibold text-white line-clamp-1">{activeAlert.title}</p>
          <p className="text-red-200 text-[11px] line-clamp-2">{activeAlert.message}</p>
          <div className="text-[10px] text-red-300/80 pt-0.5 border-t border-red-800 flex items-center justify-between">
            <span>Dispatched via Web &amp; Telegram Bot</span>
            <span>1,420 Subscribed</span>
          </div>
        </div>
      )}

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

      {/* ── Quick Report Modal ─────────────────────────────────────────────── */}
      {isReportModalOpen && (
        <div className="absolute inset-0 z-[2000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-2xl p-5 shadow-2xl max-w-md w-full space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">
                  Citizen Disaster Report
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 text-lg"
              >
                ×
              </button>
            </div>

            {reportSuccessMessage ? (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500 rounded-xl text-center space-y-2">
                <div className="text-emerald-600 font-bold text-sm">✓ Report Submitted!</div>
                <p className="text-xs text-stone-600 dark:text-stone-300">{reportSuccessMessage}</p>
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">
                    Incident Title / Hazard
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Landslide on NH-44 near Peera"
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">
                      Hazard Category
                    </label>
                    <select
                      value={reportCategory}
                      onChange={(e) => setReportCategory(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100"
                    >
                      <option value="landslide">Landslide / Rockfall</option>
                      <option value="flood">Flash Flood / River Overflow</option>
                      <option value="cloudburst">Cloudburst</option>
                      <option value="road_block">Road Obstruction</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">
                      Urgency
                    </label>
                    <select
                      value={reportSeverity}
                      onChange={(e) => setReportSeverity(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100"
                    >
                      <option value="critical">Critical (Life Danger / Full Block)</option>
                      <option value="high">High (Severe Disruption)</option>
                      <option value="medium">Medium (Moderate Hazard)</option>
                      <option value="low">Low (Advisory)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">
                    Details / Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Describe obstruction, stranded vehicles, approximate width..."
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="p-2 bg-stone-100 dark:bg-stone-800/60 rounded-lg text-[11px] text-stone-500">
                  📍 Coordinates will be automatically tagged to current view: [{mapCenter[0].toFixed(3)}, {mapCenter[1].toFixed(3)}]
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsReportModalOpen(false)}
                    className="px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold flex items-center gap-1.5 shadow-md"
                  >
                    <Send className="w-3 h-3" />
                    Submit Report to DDMA
                  </button>
                </div>
              </form>
            )}
          </div>
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
          incidents.map((incident) => {
            const isReported = incident.status === "reported";
            return (
              <CircleMarker
                key={incident.id}
                center={[incident.location.lat, incident.location.lng]}
                radius={isReported ? 11 : 9}
                pathOptions={{
                  color: isReported ? "#e11d48" : "#dc2626",
                  fillColor: isReported ? "#fb7185" : "#ef4444",
                  fillOpacity: 0.95,
                  weight: isReported ? 3 : 2,
                }}
                eventHandlers={{
                  click: () => onSelectIncident?.(incident),
                }}
              >
                <Tooltip sticky direction="top">
                  <strong>💥 {incident.title}</strong> ({incident.severity})
                  {isReported && <span className="block text-red-700 font-bold text-[10px]">NEW: CITIZEN REPORTED</span>}
                </Tooltip>
                <Popup>
                  <div className="text-xs space-y-1.5 p-1">
                    <p className="font-bold text-sm text-red-600">{incident.title}</p>
                    <p className="text-stone-600 text-xs">{incident.description}</p>
                    <p><span className="font-semibold">District:</span> {incident.district}</p>
                    <p>
                      <span className="font-semibold">Status:</span>{" "}
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        isReported ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"
                      }`}>
                        {incident.status.toUpperCase()}
                      </span>
                    </p>
                    {incident.aiScore && (
                      <div className="bg-stone-100 dark:bg-stone-800 p-1 rounded text-[10px] text-stone-600 dark:text-stone-300">
                        AAPDA Lens AI Confidence: {(incident.aiScore.confidence * 100).toFixed(0)}%
                      </div>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

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