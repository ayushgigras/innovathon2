"use client";

import React, { useEffect, useState } from "react";
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
  Truck,
  Navigation,
  Compass,
  Layers,
  MapPin,
  Radio,
  Clock,
  ShieldAlert,
  Crosshair,
} from "lucide-react";
import type { ConvoyDispatch } from "@/lib/api/rahat-grid-service";
import { CONVOY_ROUTE_WAYPOINTS } from "@/lib/api/rahat-grid-service";

interface LiveConvoyMapInnerProps {
  convoy: ConvoyDispatch;
  className?: string;
}

// Controller to auto-center on the moving vehicle or keep the full route in view
function MapFollowController({
  position,
  autoFollow,
}: {
  position: [number, number];
  autoFollow: boolean;
}): null {
  const map = useMap();

  useEffect(() => {
    if (autoFollow) {
      map.panTo(position, { animate: true, duration: 1.2 });
    }
  }, [map, position, autoFollow]);

  return null;
}

export default function LiveConvoyMapInner({
  convoy,
  className = "",
}: LiveConvoyMapInnerProps): React.ReactElement {
  const [mapMode, setMapMode] = useState<"satellite" | "topo">("satellite");
  const [autoFollow, setAutoFollow] = useState<boolean>(true);

  const currentPos: [number, number] = [convoy.gps.currentLat, convoy.gps.currentLng];
  const originPos: [number, number] = [convoy.gps.originCoords.lat, convoy.gps.originCoords.lng];
  const destPos: [number, number] = [convoy.gps.destinationCoords.lat, convoy.gps.destinationCoords.lng];

  // Full corridor route geometry (Chanderkote Depot -> Panthyal Scene via Rajgarh Bypass)
  const fullRoutePath: [number, number][] = [
    [33.210, 75.240],
    [33.214, 75.243],
    [33.219, 75.248],
    [33.223, 75.251],
    [33.228, 75.253],
    [33.232, 75.255],
    [33.236, 75.256],
    [33.240, 75.257],
    [33.244, 75.258],
  ];

  // Traveled breadcrumb path up to current position
  const p = convoy.gps.progressPercent;
  const traveledIndex = Math.min(
    fullRoutePath.length,
    Math.max(1, Math.floor((p / 100) * fullRoutePath.length))
  );
  const traveledPath: [number, number][] = [
    ...fullRoutePath.slice(0, traveledIndex),
    currentPos,
  ];

  // Blocked NH-44 section near Panthyal
  const blockedSectionPath: [number, number][] = [
    [33.235, 75.242],
    [33.239, 75.249],
    [33.244, 75.258],
  ];

  const tileUrl =
    mapMode === "satellite"
      ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  const attribution =
    mapMode === "satellite"
      ? '&copy; <a href="https://www.esri.com/">Esri</a>'
      : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

  return (
    <div className={`relative w-full h-[360px] sm:h-[440px] rounded-2xl overflow-hidden border border-blue-500/30 shadow-2xl bg-stone-950 ${className}`}>
      <MapContainer
        center={[33.227, 75.249]}
        zoom={13}
        scrollWheelZoom={false}
        className="w-full h-full z-0"
      >
        <MapFollowController position={currentPos} autoFollow={autoFollow} />

        <TileLayer url={tileUrl} attribution={attribution} />

        {/* 1. Planned Convoy Corridor (Cyan / Emerald dashed glow) */}
        <Polyline
          positions={fullRoutePath}
          pathOptions={{
            color: "#059669",
            weight: 6,
            opacity: 0.85,
            dashArray: "6, 8",
          }}
        />

        {/* 2. Traveled Breadcrumb Trail (Bright Amber/Gold) */}
        <Polyline
          positions={traveledPath}
          pathOptions={{
            color: "#f59e0b",
            weight: 7,
            opacity: 0.95,
          }}
        />

        {/* 3. Blocked Road Segment (Red Dashed Line) */}
        <Polyline
          positions={blockedSectionPath}
          pathOptions={{
            color: "#ef4444",
            weight: 6,
            opacity: 0.9,
            dashArray: "4, 6",
          }}
        />

        {/* Origin Pin: Chanderkote BRO Heavy Depot */}
        <CircleMarker
          center={originPos}
          radius={8}
          pathOptions={{
            color: "#ffffff",
            fillColor: "#3b82f6",
            fillOpacity: 1,
            weight: 2,
          }}
        >
          <Tooltip permanent direction="top" className="bg-stone-900 text-stone-200 text-[10px] font-bold border-stone-700">
            🏭 Chanderkote Depot
          </Tooltip>
          <Popup>
            <div className="text-xs p-1 space-y-1 text-stone-800">
              <strong className="block text-blue-700">Chanderkote BRO Forward Logistics Base</strong>
              <p className="text-[11px]">Relief supplies stockpile &amp; heavy plant equipment fleet.</p>
            </div>
          </Popup>
        </CircleMarker>

        {/* Destination Pin: Panthyal Landslide Scene */}
        <CircleMarker
          center={destPos}
          radius={9}
          pathOptions={{
            color: "#ffffff",
            fillColor: "#dc2626",
            fillOpacity: 1,
            weight: 2.5,
          }}
        >
          <Tooltip permanent direction="bottom" className="bg-red-950 text-red-200 text-[10px] font-bold border-red-700">
            🚨 Panthyal Landslide Scene
          </Tooltip>
          <Popup>
            <div className="text-xs p-1 space-y-1 text-stone-800">
              <strong className="block text-red-700">NH-44 Panthyal Landslide Scene (Km 144)</strong>
              <p className="text-[11px]">80+ citizens stranded. Officer S. Manhas commanding incident perimeter.</p>
            </div>
          </Popup>
        </CircleMarker>

        {/* ── 4. THE LIVE MOVING CONVOY POINT (GPS SATELLITE MARKER) ───────── */}
        {/* Outer Radar Ripple Wave Marker */}
        <CircleMarker
          center={currentPos}
          radius={22}
          pathOptions={{
            color: "#10b981",
            fillColor: "#10b981",
            fillOpacity: 0.25,
            weight: 1.5,
          }}
        />

        {/* Core Moving Vehicle Dot */}
        <CircleMarker
          center={currentPos}
          radius={11}
          pathOptions={{
            color: "#ffffff",
            fillColor: p >= 100 ? "#10b981" : "#3b82f6",
            fillOpacity: 1,
            weight: 3,
          }}
        >
          <Tooltip
            permanent
            direction="top"
            offset={[0, -12]}
            className="bg-stone-950/95 text-stone-100 text-[11px] font-bold border border-emerald-500 shadow-2xl rounded-xl p-1.5"
          >
            <div className="flex items-center gap-1.5">
              <span>🚜 🚚 🚑</span>
              <span className="text-emerald-400 font-mono">{convoy.id}</span>
              <span>· {convoy.gps.speedKmh} km/h</span>
            </div>
          </Tooltip>
          <Popup>
            <div className="p-2 space-y-2 text-xs text-stone-800">
              <div className="font-bold text-blue-700 flex items-center justify-between">
                <span>Relief Convoy {convoy.id}</span>
                <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-mono">
                  {p}% complete
                </span>
              </div>
              <p className="text-[11px] text-stone-600">
                Live GPS: {convoy.gps.currentLat.toFixed(4)}° N, {convoy.gps.currentLng.toFixed(4)}° E
              </p>
              <div className="text-[11px]">
                <strong>Assigned Vehicles:</strong>{" "}
                {convoy.assignedVehicles.map((v) => v.name).join(", ")}
              </div>
              <div className="text-[11px]">
                <strong>Cargo:</strong>{" "}
                {convoy.dispatchedSupplies.map((s) => `${s.quantity}x ${s.name}`).join(", ")}
              </div>
            </div>
          </Popup>
        </CircleMarker>
      </MapContainer>

      {/* ── OVERLAID HUD: TOP TELEMETRY CONTROLS ───────────────────────────── */}
      <div className="absolute top-3 left-3 z-[1000] flex flex-wrap items-center gap-2">
        <div className="bg-stone-900/90 backdrop-blur-md border border-stone-800/90 rounded-xl px-3 py-1.5 text-xs text-stone-200 flex items-center gap-2 shadow-xl">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-bold text-stone-100">Live Convoy GPS:</span>
          <span className="font-mono text-emerald-400 font-bold">
            [{convoy.gps.currentLat.toFixed(3)}, {convoy.gps.currentLng.toFixed(3)}]
          </span>
          <span className="text-stone-500">|</span>
          <span className="text-amber-400 font-mono font-bold">{convoy.gps.speedKmh} km/h</span>
          <span className="text-stone-500">|</span>
          <span className="text-blue-300 font-mono">{convoy.gps.distanceKmRemaining} km left</span>
        </div>
      </div>

      <div className="absolute top-3 right-3 z-[1000] flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setAutoFollow(!autoFollow)}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 backdrop-blur-md shadow-xl transition-all border ${
            autoFollow
              ? "bg-emerald-600/90 text-white border-emerald-400"
              : "bg-stone-900/90 text-stone-400 border-stone-800 hover:text-white"
          }`}
          title="Auto-follow vehicle center"
        >
          <Crosshair className={`w-3.5 h-3.5 ${autoFollow ? "animate-spin" : ""}`} />
          <span>{autoFollow ? "Following" : "Free Pan"}</span>
        </button>

        <button
          type="button"
          onClick={() => setMapMode(mapMode === "satellite" ? "topo" : "satellite")}
          className="px-2.5 py-1.5 bg-stone-900/90 hover:bg-stone-800 text-stone-300 border border-stone-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 backdrop-blur-md shadow-xl transition-all"
        >
          <Layers className="w-3.5 h-3.5 text-blue-400" />
          <span>{mapMode === "satellite" ? "Satellite" : "Topo"}</span>
        </button>
      </div>

      {/* ── OVERLAID HUD: BOTTOM LIVE RADIO TAPE ───────────────────────────── */}
      <div className="absolute bottom-3 left-3 right-3 z-[1000] bg-stone-950/90 backdrop-blur-md border border-stone-800 rounded-xl p-2.5 flex items-center justify-between gap-3 text-xs shadow-2xl">
        <div className="flex items-center gap-2 overflow-hidden">
          <Radio className="w-3.5 h-3.5 text-blue-400 shrink-0 animate-pulse" />
          <span className="text-stone-300 font-mono text-[11px] truncate">
            {convoy.gps.radioTelemetry}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
          <span className="text-stone-400">ETA:</span>
          <span className="font-bold text-amber-400">
            {convoy.gps.etaMinutes === 0 ? "ARRIVED" : `${convoy.gps.etaMinutes} mins`}
          </span>
        </div>
      </div>
    </div>
  );
}
