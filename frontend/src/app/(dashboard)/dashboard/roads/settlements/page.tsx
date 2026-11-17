import React from "react";
import { Users, AlertTriangle, CheckCircle2, MapPin, Building2 } from "lucide-react";
import { DemoBadge } from "@/components/shared/DemoBadge";
import { MOCK_SETTLEMENTS, MOCK_ROADS } from "@/lib/api/mock-adapter";

export default function SettlementsPage(): React.ReactElement {
  const isolated = MOCK_SETTLEMENTS.filter((s) => s.isIsolated);
  const connected = MOCK_SETTLEMENTS.filter((s) => !s.isIsolated);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-purple-400" />
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Disconnected Settlements</h1>
            <p className="text-slate-400 text-sm">Settlement access &amp; isolation status</p>
          </div>
        </div>
        <DemoBadge variant="banner" />
      </div>

      {/* Alert summary */}
      {isolated.length > 0 && (
        <div className="flex items-center gap-3 p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-purple-400 flex-shrink-0" />
          <div>
            <p className="text-purple-300 font-semibold text-sm">
              {isolated.length} settlement{isolated.length > 1 ? "s" : ""} currently isolated
            </p>
            <p className="text-purple-400/70 text-xs mt-0.5">
              Road teams and relief coordinators must confirm access before dispatching.
            </p>
          </div>
        </div>
      )}

      {/* Isolated */}
      <section>
        <h2 className="text-slate-200 font-semibold text-sm uppercase tracking-wide mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-purple-400" />
          Isolated ({isolated.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {isolated.map((s) => (
            <SettlementDetailCard key={s.id} settlement={s} />
          ))}
        </div>
      </section>

      {/* Connected */}
      <section>
        <h2 className="text-slate-200 font-semibold text-sm uppercase tracking-wide mb-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          Connected ({connected.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {connected.map((s) => (
            <SettlementDetailCard key={s.id} settlement={s} />
          ))}
        </div>
      </section>
    </div>
  );
}

function SettlementDetailCard({ settlement }: { settlement: (typeof MOCK_SETTLEMENTS)[0] }): React.ReactElement {
  const accessRoads = settlement.accessRoads
    .map((rid) => MOCK_ROADS.find((r) => r.id === rid))
    .filter(Boolean);

  return (
    <div
      className={`p-4 rounded-xl border space-y-3 ${
        settlement.isIsolated
          ? "bg-purple-500/5 border-purple-500/25"
          : "bg-slate-900 border-slate-800"
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-slate-100 font-semibold">{settlement.name}</h3>
          <p className="text-slate-400 text-xs">{settlement.district}</p>
        </div>
        {settlement.isIsolated ? (
          <span className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs rounded font-semibold">
            ISOLATED
          </span>
        ) : (
          <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded font-semibold">
            CONNECTED
          </span>
        )}
      </div>

      <div className="text-xs space-y-1.5 text-slate-400">
        <div className="flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-slate-500" />
          <span>Population: <span className="text-slate-200 font-medium">{settlement.population.toLocaleString()}</span></span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-slate-500" />
          <span>{settlement.location.lat.toFixed(3)}, {settlement.location.lng.toFixed(3)}</span>
        </div>
        {settlement.nearestFacility && (
          <div className="flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-slate-500" />
            <span>{settlement.nearestFacility.name} — {settlement.nearestFacility.distanceKm}km</span>
          </div>
        )}
        {settlement.isIsolated && settlement.isolatedSince && (
          <p className="text-purple-400">Isolated since: {new Date(settlement.isolatedSince).toLocaleTimeString()}</p>
        )}
      </div>

      {/* Access roads */}
      <div>
        <p className="text-xs text-slate-500 mb-1.5">Access roads:</p>
        {accessRoads.length === 0 ? (
          <p className="text-xs text-red-400">No road data</p>
        ) : (
          <div className="space-y-1">
            {accessRoads.map((road) => road && (
              <div
                key={road.id}
                className={`flex items-center gap-2 text-xs px-2 py-1 rounded border ${
                  road.status === "closed"
                    ? "bg-red-500/10 border-red-500/20 text-red-400"
                    : road.status === "partially_open"
                    ? "bg-orange-500/10 border-orange-500/20 text-orange-400"
                    : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  road.status === "closed" ? "bg-red-400" : road.status === "partially_open" ? "bg-orange-400" : "bg-emerald-400"
                }`} />
                {road.name}
                <span className="ml-auto font-medium">
                  {road.status === "closed" ? "CLOSED" : road.status === "partially_open" ? "PARTIAL" : "OPEN"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      <DemoBadge />
    </div>
  );
}
