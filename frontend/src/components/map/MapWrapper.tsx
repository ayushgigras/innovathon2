"use client";

import React, { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  CircleMarker,
  Popup,
  useMap,
} from "react-leaflet";
import type { RoadSegment, Settlement } from "@/types";

interface MapWrapperProps {
  roads: RoadSegment[];
  settlements: Settlement[];
  onSelectRoad: (road: RoadSegment) => void;
}

function FitBounds(): React.ReactElement {
  const map = useMap();
  useEffect(() => {
    map.setView([33.4, 75.2], 8);
  }, [map]);
  return <></>;
}

const ROAD_COLORS: Record<string, string> = {
  closed: "#c24536",
  partially_open: "#c2781a",
  open: "#2d6a4f",
  unknown: "#736c5f",
};

export function MapWrapper({ roads, settlements, onSelectRoad }: MapWrapperProps): React.ReactElement {
  const [mapMode, setMapMode] = React.useState<"street" | "satellite">("street");

  return (
    <div className="relative w-full h-full min-h-96">
      {/* Layer Switcher Controls */}
      <div className="absolute top-3 right-3 z-[1000] flex bg-white/95 dark:bg-stone-900/95 backdrop-blur-sm rounded-lg shadow-md border border-stone-200 dark:border-stone-700 p-1 text-xs font-medium">
        <button
          type="button"
          onClick={() => setMapMode("street")}
          className={`px-3 py-1.5 rounded-md transition-all ${
            mapMode === "street"
              ? "bg-[#2d6a4f] text-white shadow-sm font-semibold"
              : "text-stone-600 dark:text-stone-300 hover:text-stone-900"
          }`}
        >
          🗺️ Street Map
        </button>
        <button
          type="button"
          onClick={() => setMapMode("satellite")}
          className={`px-3 py-1.5 rounded-md transition-all ${
            mapMode === "satellite"
              ? "bg-[#2d6a4f] text-white shadow-sm font-semibold"
              : "text-stone-600 dark:text-stone-300 hover:text-stone-900"
          }`}
        >
          🛰️ Live Satellite
        </button>
      </div>

      <MapContainer
        center={[33.4, 75.2]}
        zoom={8}
        className="w-full h-full min-h-96 rounded-lg"
        style={{ background: mapMode === "satellite" ? "#1a2421" : "#e8e3d7" }}
      >
        <FitBounds />
        {mapMode === "street" ? (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        ) : (
          <TileLayer
            attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxZoom={18}
          />
        )}

      {/* Road segments */}
      {roads.map((road) => {
        const positions: [number, number][] = road.coordinates.map((c) => [c.lat, c.lng]);
        return (
          <Polyline
            key={road.id}
            positions={positions}
            pathOptions={{
              color: ROAD_COLORS[road.status] ?? "#64748b",
              weight: 5,
              opacity: 0.85,
            }}
            eventHandlers={{
              click: () => onSelectRoad(road),
            }}
          >
            <Popup>
              <div className="text-sm">
                <strong>{road.name}</strong>
                <br />
                {road.closureReason ?? "Status unknown"}
              </div>
            </Popup>
          </Polyline>
        );
      })}

      {/* Settlement markers */}
      {settlements.map((settlement) => (
        <CircleMarker
          key={settlement.id}
          center={[settlement.location.lat, settlement.location.lng]}
          radius={settlement.isIsolated ? 10 : 7}
          pathOptions={{
            color: settlement.isIsolated ? "#a855f7" : "#64748b",
            fillColor: settlement.isIsolated ? "#a855f7" : "#64748b",
            fillOpacity: 0.7,
            weight: 2,
          }}
        >
          <Popup>
            <div className="text-sm">
              <strong>{settlement.name}</strong>
              <br />
              Population: {settlement.population}
              <br />
              {settlement.isIsolated ? (
                <span style={{ color: "#a855f7", fontWeight: "bold" }}>⚠ ISOLATED</span>
              ) : (
                <span style={{ color: "#10b981" }}>✓ Connected</span>
              )}
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  </div>
);
}
