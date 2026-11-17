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
  closed: "#ef4444",
  partially_open: "#f97316",
  open: "#10b981",
  unknown: "#64748b",
};

export function MapWrapper({ roads, settlements, onSelectRoad }: MapWrapperProps): React.ReactElement {
  return (
    <MapContainer
      center={[33.4, 75.2]}
      zoom={8}
      className="w-full h-full min-h-96"
      style={{ background: "#0f172a" }}
    >
      <FitBounds />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

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
  );
}
