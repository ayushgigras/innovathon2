"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Package,
  Truck,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Radio,
  MapPin,
  Clock,
  Navigation,
  ArrowRight,
  Flame,
  Droplets,
  HeartPulse,
  Users,
  Compass,
  Play,
  Pause,
  RotateCcw,
  PlusCircle,
  Building2,
  FileCheck,
} from "lucide-react";
import {
  MachineryVehicle,
  InventorySupply,
  ReliefSOSRequest,
  ConvoyDispatch,
  getStoredFleet,
  saveFleet,
  getStoredInventory,
  saveInventory,
  getStoredRequests,
  saveRequests,
  getStoredDispatches,
  saveDispatches,
  CONVOY_ROUTE_WAYPOINTS,
  DEFAULT_MACHINERY_FLEET,
  DEFAULT_SUPPLIES_INVENTORY,
  INITIAL_SOS_REQUEST,
} from "@/lib/api/rahat-grid-service";
import { LiveConvoyMap } from "@/components/relief/LiveConvoyMap";

export function RahatGridReliefConsole(): React.ReactElement {
  const [fleet, setFleet] = useState<MachineryVehicle[]>([]);
  const [inventory, setInventory] = useState<InventorySupply[]>([]);
  const [requests, setRequests] = useState<ReliefSOSRequest[]>([]);
  const [dispatches, setDispatches] = useState<ConvoyDispatch[]>([]);

  // Dispatch Builder Modal State
  const [selectedRequest, setSelectedRequest] = useState<ReliefSOSRequest | null>(null);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [selectedJcbId, setSelectedJcbId] = useState<string>("JCB-01");
  const [selectedTruckId, setSelectedTruckId] = useState<string>("TRK-04");
  const [selectedAmbulanceId, setSelectedAmbulanceId] = useState<string>("AMB-02");
  const [includeForce, setIncludeForce] = useState<boolean>(true);
  const [foodQuantity, setFoodQuantity] = useState<number>(120);
  const [waterQuantity, setWaterQuantity] = useState<number>(80);
  const [medicalQuantity, setMedicalQuantity] = useState<number>(20);
  const [blanketQuantity, setBlanketQuantity] = useState<number>(150);

  // Notification Toast
  const [toast, setToast] = useState<string | null>(null);

  // Initialize and load from storage
  useEffect(() => {
    setFleet(getStoredFleet());
    setInventory(getStoredInventory());
    setRequests(getStoredRequests());
    setDispatches(getStoredDispatches());

    const handleSync = () => {
      setFleet(getStoredFleet());
      setInventory(getStoredInventory());
      setRequests(getStoredRequests());
      setDispatches(getStoredDispatches());
    };

    window.addEventListener("rahat_fleet_updated", handleSync);
    window.addEventListener("rahat_inventory_updated", handleSync);
    window.addEventListener("rahat_requests_updated", handleSync);
    window.addEventListener("rahat_dispatches_updated", handleSync);
    window.addEventListener("storage", handleSync);

    return () => {
      window.removeEventListener("rahat_fleet_updated", handleSync);
      window.removeEventListener("rahat_inventory_updated", handleSync);
      window.removeEventListener("rahat_requests_updated", handleSync);
      window.removeEventListener("rahat_dispatches_updated", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  // Live GPS Movement Simulation for Dispatched Convoys
  useEffect(() => {
    const activeDispatches = dispatches.filter((d) => d.status === "in_transit");
    if (activeDispatches.length === 0) return;

    const interval = setInterval(() => {
      setDispatches((prevDispatches) => {
        let changed = false;

        const updated = prevDispatches.map((disp) => {
          if (disp.status !== "in_transit") return disp;

          const currentP = disp.gps.progressPercent;
          if (currentP >= 100) {
            changed = true;
            return {
              ...disp,
              status: "at_scene" as const,
              gps: {
                ...disp.gps,
                progressPercent: 100,
                speedKmh: 0,
                distanceKmRemaining: 0,
                etaMinutes: 0,
                radioTelemetry: "AT SCENE: Convoy arrived at Panthyal. Handing over supplies to Officer S. Manhas. JCB commencing boulder displacement.",
              },
            };
          }

          changed = true;
          const nextP = Math.min(100, currentP + 5);

          // Interpolate GPS coords between origin (Chanderkote) and destination (Panthyal)
          const origin = disp.gps.originCoords;
          const dest = disp.gps.destinationCoords;
          const fraction = nextP / 100;
          const lat = origin.lat + (dest.lat - origin.lat) * fraction;
          const lng = origin.lng + (dest.lng - origin.lng) * fraction;

          const distRemaining = Number((14.8 * (1 - fraction)).toFixed(1));
          const eta = Math.ceil(22 * (1 - fraction));

          const radioMessage =
            nextP < 25
              ? "Convoy Lead: 'Departed Chanderkote Depot. TRK-04 lead, JCB-01 following in convoy.' "
              : nextP < 50
              ? "Convoy Lead: 'Entering Rajgarh Ridge mountain detour. Bailey bridge cleared for 4x4 trucks.' "
              : nextP < 75
              ? "Convoy Lead: 'Khari North bypass clear. Speed 35 km/h. Ambulance AMB-02 reporting stable.' "
              : nextP < 100
              ? "Officer S. Manhas (Radio): 'Visual contact with convoy headlights descending Panthyal curve!' "
              : "AT SCENE: Convoy arrived at Panthyal. Handover initiated to Officer S. Manhas.";

          return {
            ...disp,
            gps: {
              ...disp.gps,
              currentLat: Number(lat.toFixed(4)),
              currentLng: Number(lng.toFixed(4)),
              progressPercent: nextP,
              distanceKmRemaining: distRemaining,
              etaMinutes: eta,
              speedKmh: nextP >= 100 ? 0 : 38,
              lastPingTime: new Date().toLocaleTimeString(),
              radioTelemetry: radioMessage,
            },
          };
        });

        if (changed) {
          saveDispatches(updated);
        }
        return updated;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [dispatches]);

  // Open Dispatch Modal for a Specific SOS Request
  const handleOpenDispatchModal = (req: ReliefSOSRequest) => {
    setSelectedRequest(req);
    setFoodQuantity(req.requestedSupplies.foodKits);
    setWaterQuantity(req.requestedSupplies.waterCans);
    setMedicalQuantity(req.requestedSupplies.medicalKits);
    setBlanketQuantity(req.requestedSupplies.thermalBlankets);
    setIsDispatchModalOpen(true);
  };

  // Execute Dispatch Convoy
  const handleExecuteDispatch = () => {
    if (!selectedRequest) return;

    // 1. Mark vehicles as dispatched
    const chosenVehicleIds = [selectedJcbId, selectedTruckId, selectedAmbulanceId].filter(Boolean);
    const assignedVehicleObjects = fleet.filter((v) => chosenVehicleIds.includes(v.id));

    const updatedFleet = fleet.map((v) =>
      chosenVehicleIds.includes(v.id) ? { ...v, status: "dispatched" as const } : v
    );
    setFleet(updatedFleet);
    saveFleet(updatedFleet);

    // 2. Deduct inventory supplies
    const updatedInventory = inventory.map((inv) => {
      if (inv.category === "food") {
        return {
          ...inv,
          available: Math.max(0, inv.available - foodQuantity),
          reserved: inv.reserved + foodQuantity,
        };
      }
      if (inv.category === "water") {
        return {
          ...inv,
          available: Math.max(0, inv.available - waterQuantity),
          reserved: inv.reserved + waterQuantity,
        };
      }
      if (inv.category === "medicine") {
        return {
          ...inv,
          available: Math.max(0, inv.available - medicalQuantity),
          reserved: inv.reserved + medicalQuantity,
        };
      }
      if (inv.category === "shelter") {
        return {
          ...inv,
          available: Math.max(0, inv.available - blanketQuantity),
          reserved: inv.reserved + blanketQuantity,
        };
      }
      return inv;
    });
    setInventory(updatedInventory);
    saveInventory(updatedInventory);

    // 3. Create the new Convoy Dispatch with Live GPS Tracking
    const newDispatchId = `CNV-${Date.now().toString(36).substring(2, 7).toUpperCase()}`;
    const newDispatch: ConvoyDispatch = {
      id: newDispatchId,
      requestId: selectedRequest.id,
      destinationName: selectedRequest.settlementName,
      district: selectedRequest.district,
      status: "in_transit",
      assignedVehicles: assignedVehicleObjects,
      assignedForce: includeForce ? "SDRF Mountain Rescue Unit 1 (8 Officers)" : "None",
      dispatchedSupplies: [
        { name: "Family Ration Kits", quantity: foodQuantity },
        { name: "Drinking Water (20L Cans)", quantity: waterQuantity },
        { name: "Emergency Medical Kits", quantity: medicalQuantity },
        { name: "Thermal Blankets", quantity: blanketQuantity },
      ],
      gps: {
        currentLat: 33.21,
        currentLng: 75.24,
        originName: "Chanderkote Supply & BRO Heavy Depot",
        originCoords: { lat: 33.21, lng: 75.24 },
        destinationName: selectedRequest.settlementName,
        destinationCoords: selectedRequest.targetCoords,
        speedKmh: 42,
        progressPercent: 5,
        etaMinutes: 22,
        distanceKmRemaining: 14.8,
        lastPingTime: new Date().toLocaleTimeString(),
        radioTelemetry: "Convoy Lead: 'Engines started at Chanderkote. Convoy rolling out onto mountain detour corridor.' ",
      },
      dispatchedAt: new Date().toISOString(),
    };

    const updatedDispatches = [newDispatch, ...dispatches];
    setDispatches(updatedDispatches);
    saveDispatches(updatedDispatches);

    // 4. Update request status to dispatched
    const updatedRequests = requests.map((r) =>
      r.id === selectedRequest.id ? { ...r, status: "dispatched" as const } : r
    );
    setRequests(updatedRequests);
    saveRequests(updatedRequests);

    setIsDispatchModalOpen(false);
    setToast(
      `🚀 Emergency Convoy ${newDispatchId} DISPATCHED to ${selectedRequest.settlementName}! JCB, 4x4 Truck, Medical & Food en route.`
    );
    setTimeout(() => setToast(null), 6000);
  };

  // Confirm Final Physical Handover at Scene
  const handleConfirmHandover = (dispatchId: string) => {
    const updated = dispatches.map((d) =>
      d.id === dispatchId
        ? {
            ...d,
            status: "delivered" as const,
            deliveredAt: new Date().toISOString(),
            gps: {
              ...d.gps,
              progressPercent: 100,
              speedKmh: 0,
              radioTelemetry: "PHYSICAL HANDOVER COMPLETE: Officer S. Manhas signed relief manifest. All supplies received.",
            },
          }
        : d
    );
    setDispatches(updated);
    saveDispatches(updated);

    // Return vehicles to available
    const disp = dispatches.find((d) => d.id === dispatchId);
    if (disp) {
      const vIds = disp.assignedVehicles.map((v) => v.id);
      const updatedFleet = fleet.map((v) => (vIds.includes(v.id) ? { ...v, status: "available" as const } : v));
      setFleet(updatedFleet);
      saveFleet(updatedFleet);
    }

    setToast(`✅ Physical Handover Confirmed for ${dispatchId}. Supplies verified on-ground.`);
    setTimeout(() => setToast(null), 4000);
  };

  // Reset to Clean Demo State
  const handleResetReliefData = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("rahat_machinery_fleet");
      localStorage.removeItem("rahat_supplies_inventory");
      localStorage.removeItem("rahat_sos_requests");
      localStorage.removeItem("rahat_active_dispatches");
      setFleet(DEFAULT_MACHINERY_FLEET);
      setInventory(DEFAULT_SUPPLIES_INVENTORY);
      setRequests([INITIAL_SOS_REQUEST]);
      setDispatches([]);
      setToast("Relief simulation state reset to factory defaults.");
      setTimeout(() => setToast(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="p-3 bg-emerald-950/90 border border-emerald-500 rounded-2xl text-emerald-300 text-xs flex items-center justify-between shadow-2xl animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{toast}</span>
          </div>
          <button type="button" onClick={() => setToast(null)} className="text-stone-400 hover:text-white">
            ×
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-stone-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/30">
              <Package className="w-5 h-5" />
            </span>
            <h1 className="text-lg font-bold text-stone-100">
              RahatGrid Relief Allocation &amp; Machinery Fleet Control
            </h1>
            <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/40 px-2 py-0.5 rounded-full font-bold">
              LIVE DISPATCH CONSOLE
            </span>
          </div>
          <p className="text-xs text-stone-400 mt-1">
            Human-in-the-loop disaster relief provisioning: verify field officer requests, load supplies &amp; JCB machinery, and track moving GPS convoys in real time.
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetReliefData}
          className="text-[11px] px-3 py-1.5 bg-stone-850 hover:bg-stone-800 text-stone-300 rounded-xl flex items-center gap-1.5 border border-stone-700 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
          Reset Relief Simulation State
        </button>
      </div>

      {/* ── 1. ACTIVE FIELD OFFICER RELIEF SOS REQUESTS ─────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-red-500 animate-pulse" />
            <h2 className="text-sm font-bold text-stone-100">
              Field Officer Urgent Relief SOS Requests ({requests.length})
            </h2>
          </div>
          <span className="text-[11px] text-stone-400">
            Awaiting authorized Commander fleet allocation &amp; dispatch
          </span>
        </div>

        <div className="space-y-3">
          {requests.map((req) => (
            <div
              key={req.id}
              className={`p-4 rounded-2xl border transition-all ${
                req.status === "pending"
                  ? "bg-red-950/20 border-red-500/40 shadow-lg"
                  : req.status === "dispatched"
                  ? "bg-blue-950/20 border-blue-500/30"
                  : "bg-stone-900 border-stone-800"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[11px] text-stone-400">{req.id}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-600 text-white uppercase tracking-wider animate-pulse">
                      {req.priority} SOS
                    </span>
                    <span className="text-xs font-bold text-stone-100">
                      Destination: {req.settlementName} ({req.district} Sector)
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        req.status === "pending"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                          : "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                      }`}
                    >
                      {req.status.toUpperCase()}
                    </span>
                  </div>

                  <p className="text-xs text-stone-300 leading-relaxed bg-stone-950/60 p-2.5 rounded-xl border border-stone-800">
                    "{req.situationDescription}"
                  </p>

                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-stone-400">
                    <span>
                      Officer: <strong>{req.requestedBy}</strong> ({req.officerRank})
                    </span>
                    <span>•</span>
                    <span>Unit: {req.officerUnit}</span>
                    <span>•</span>
                    <span className="text-stone-500">
                      Coords: [{req.targetCoords.lat.toFixed(3)}, {req.targetCoords.lng.toFixed(3)}]
                    </span>
                  </div>

                  {/* Requested Payload Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                    <span className="text-stone-400 font-semibold">Required:</span>
                    <span className="bg-amber-950/60 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-lg font-mono">
                      🥪 {req.requestedSupplies.foodKits} Food Kits
                    </span>
                    <span className="bg-blue-950/60 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-lg font-mono">
                      💧 {req.requestedSupplies.waterCans} Water Cans
                    </span>
                    <span className="bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-lg font-mono">
                      🏥 {req.requestedSupplies.medicalKits} Medical Kits
                    </span>
                    {req.requestedSupplies.requireJcb && (
                      <span className="bg-purple-950/60 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-lg font-bold">
                        🚜 1x JCB Heavy Earthmover
                      </span>
                    )}
                    {req.requestedSupplies.requireForce && (
                      <span className="bg-stone-800 text-stone-200 border border-stone-700 px-2 py-0.5 rounded-lg font-bold">
                        👮 SDRF Mountain Force
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  {req.status === "pending" ? (
                    <button
                      type="button"
                      onClick={() => handleOpenDispatchModal(req)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-950 transition-all hover:scale-[1.02]"
                    >
                      <Truck className="w-4 h-4" />
                      Assemble &amp; Dispatch Convoy
                    </button>
                  ) : (
                    <span className="text-xs text-blue-400 font-semibold flex items-center gap-1 bg-blue-950/50 px-3 py-1.5 rounded-xl border border-blue-500/30">
                      <Truck className="w-3.5 h-3.5 animate-pulse" />
                      Convoy Dispatched &amp; Moving
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 2. LIVE GPS MOVING CONVOY TELEMETRY TRACKER ───────────────────── */}
      {dispatches.length > 0 && (
        <div className="bg-stone-900 border border-blue-500/40 rounded-3xl p-5 space-y-4 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Navigation className="w-5 h-5 text-emerald-400 animate-spin-slow" />
              <h2 className="text-sm font-bold text-stone-100">
                Live GPS Relief Convoy Telemetry (Satellite Link Active)
              </h2>
            </div>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              LIVE TELEMETRY STREAM
            </span>
          </div>

          <div className="space-y-4">
            {dispatches.map((disp) => {
              const p = disp.gps.progressPercent;
              const isMoving = disp.status === "in_transit";

              return (
                <div
                  key={disp.id}
                  className="bg-stone-950 border border-stone-800 rounded-2xl p-4 space-y-4 shadow-inner"
                >
                  {/* Convoy Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs font-bold text-blue-400">{disp.id}</span>
                      <span className="text-xs font-bold text-stone-100">
                        Destination: {disp.destinationName}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          disp.status === "at_scene"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                            : disp.status === "delivered"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                            : "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                        }`}
                      >
                        {disp.status === "at_scene"
                          ? "AT SCENE / CLEARING ROAD"
                          : disp.status.replace("_", " ").toUpperCase()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {disp.status === "at_scene" && (
                        <button
                          type="button"
                          onClick={() => handleConfirmHandover(disp.id)}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all hover:scale-[1.02]"
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                          Confirm Physical Handover to Field Officer
                        </button>
                      )}
                      <Link
                        href="/dashboard/roads"
                        className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Compass className="w-3.5 h-3.5 text-emerald-400" />
                        View Live on GIS Map →
                      </Link>
                    </div>
                  </div>

                  {/* ── REAL-TIME INTERACTIVE SATELLITE MAP WITH MOVING CONVOY POINT ───── */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-stone-400 font-mono">
                      <span>Origin: {disp.gps.originName}</span>
                      <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        {p}% Corridor Journey Completed
                      </span>
                      <span>Target: {disp.destinationName}</span>
                    </div>

                    {/* Live Moving Leaflet Map */}
                    <LiveConvoyMap convoy={disp} />
                  </div>

                  {/* Radio Telemetry Ticker */}
                  <div className="p-2.5 bg-blue-950/30 border border-blue-500/30 rounded-xl text-xs flex items-center gap-2">
                    <Radio className="w-3.5 h-3.5 text-blue-400 shrink-0 animate-pulse" />
                    <span className="text-stone-300 font-mono text-[11px] leading-relaxed">
                      {disp.gps.radioTelemetry}
                    </span>
                  </div>

                  {/* Dispatched Payload & Vehicles Manifest */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-stone-900 text-xs text-stone-400">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-stone-300">Fleet in Formation:</span>
                      {disp.assignedVehicles.map((v) => (
                        <span
                          key={v.id}
                          className="bg-stone-900 border border-stone-800 text-stone-200 px-2 py-0.5 rounded-lg text-[11px] font-bold"
                        >
                          {v.type === "jcb" ? "🚜" : v.type === "ambulance" ? "🚑" : "🚚"} {v.name}
                        </span>
                      ))}
                      <span className="bg-stone-900 border border-stone-800 text-stone-300 px-2 py-0.5 rounded-lg text-[11px]">
                        👮 {disp.assignedForce}
                      </span>
                    </div>

                    <div className="text-[11px] text-stone-500">
                      Cargo: {disp.dispatchedSupplies.map((s) => `${s.quantity}x ${s.name}`).join(", ")}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 3. HEAVY MACHINERY & VEHICLE FLEET INVENTORY ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Machinery Fleet */}
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-amber-400" />
              <h2 className="text-sm font-bold text-stone-100">
                Heavy Machinery &amp; Vehicle Fleet ({fleet.length} Units)
              </h2>
            </div>
            <span className="text-[10px] text-stone-400">BRO &amp; Disaster Response Fleet</span>
          </div>

          <div className="space-y-2.5">
            {fleet.map((veh) => {
              const isFree = veh.status === "available";
              return (
                <div
                  key={veh.id}
                  className={`p-3 rounded-2xl border transition-all ${
                    isFree
                      ? "bg-stone-950/80 border-stone-800 hover:border-emerald-500/40"
                      : "bg-stone-950/40 border-stone-850 opacity-70"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{veh.type === "jcb" ? "🚜" : veh.type === "ambulance" ? "🚑" : veh.type === "crane" ? "🏗️" : "🚚"}</span>
                        <h3 className="font-bold text-stone-200 text-xs">{veh.name}</h3>
                        <span className="font-mono text-[10px] text-stone-500 bg-stone-900 px-1.5 py-0.2 rounded">
                          {veh.plateNumber}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-400">
                        Operator: <strong className="text-stone-300">{veh.operatorName}</strong> ({veh.baseDepot})
                      </p>
                      <p className="text-[10px] text-stone-500 italic">{veh.capacity}</p>
                    </div>

                    <div className="text-right space-y-1">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                          isFree
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-red-500/20 text-red-400 border border-red-500/30"
                        }`}
                      >
                        {isFree ? "🟢 FREE / AVAILABLE" : "🔴 DISPATCHED / BUSY"}
                      </span>
                      <div className="text-[10px] text-stone-400">
                        Fuel: <strong className="text-stone-200">{veh.fuelLevel}%</strong>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Emergency Supplies & Headroom Inventory */}
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-400" />
              <h2 className="text-sm font-bold text-stone-100">
                RahatGrid Emergency Supplies Stockpile
              </h2>
            </div>
            <span className="text-[10px] text-stone-400">Real-Time Headroom</span>
          </div>

          <div className="space-y-2.5">
            {inventory.map((inv) => (
              <div
                key={inv.id}
                className="p-3 bg-stone-950/80 border border-stone-800 rounded-2xl flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-center text-stone-300 text-sm">
                    {inv.category === "food" ? "🥪" : inv.category === "water" ? "💧" : inv.category === "medicine" ? "🏥" : inv.category === "shelter" ? "⛺" : "👮"}
                  </div>
                  <div>
                    <h4 className="font-bold text-stone-200 text-xs">{inv.name}</h4>
                    <p className="text-[11px] text-stone-500">{inv.baseDepot}</p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono font-bold text-sm text-stone-100">
                    {inv.available} <span className="text-[11px] font-normal text-stone-400">{inv.unit}</span>
                  </div>
                  <span className="text-[10px] text-amber-400">
                    {inv.reserved} reserved in-transit
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 4. ASSEMBLE & DISPATCH CONVOY MODAL ────────────────────────────── */}
      {isDispatchModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-stone-900 border border-blue-500/40 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl space-y-0">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-blue-950 via-stone-900 to-stone-900 border-b border-stone-800 flex items-start justify-between text-white">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    <Truck className="w-4 h-4" />
                  </span>
                  <h2 className="text-base font-bold text-stone-100">
                    Assemble Emergency Relief &amp; Machinery Convoy
                  </h2>
                </div>
                <p className="text-xs text-stone-400">
                  Target Destination: <strong className="text-stone-200">{selectedRequest.settlementName}</strong> (Requested by {selectedRequest.requestedBy})
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsDispatchModalOpen(false)}
                className="text-stone-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs text-stone-300">
              {/* Vehicle & Machine Selection */}
              <div className="space-y-2">
                <h3 className="font-bold text-stone-100 text-xs uppercase tracking-wider text-amber-400">
                  1. Assign Machinery &amp; Vehicle Units (From Free Fleet)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* JCB Select */}
                  <div className="p-3 bg-stone-950 rounded-xl border border-stone-800 space-y-1.5">
                    <label className="text-[10px] text-stone-400 font-bold block">🚜 Heavy Earthmover</label>
                    <select
                      value={selectedJcbId}
                      onChange={(e) => setSelectedJcbId(e.target.value)}
                      className="w-full bg-stone-900 border border-stone-700 rounded-lg p-1.5 text-xs text-stone-200"
                    >
                      <option value="JCB-01">JCB-01 3DX (FREE / Chanderkote)</option>
                      <option value="JCB-02" disabled>JCB-02 (BUSY / In Use)</option>
                      <option value="">None</option>
                    </select>
                    <p className="text-[10px] text-stone-500">Debris &amp; boulder shifting</p>
                  </div>

                  {/* Supply Truck Select */}
                  <div className="p-3 bg-stone-950 rounded-xl border border-stone-800 space-y-1.5">
                    <label className="text-[10px] text-stone-400 font-bold block">🚚 Relief Cargo 4x4</label>
                    <select
                      value={selectedTruckId}
                      onChange={(e) => setSelectedTruckId(e.target.value)}
                      className="w-full bg-stone-900 border border-stone-700 rounded-lg p-1.5 text-xs text-stone-200"
                    >
                      <option value="TRK-04">TRK-04 4x4 (FREE / Ramban Depot)</option>
                      <option value="">None</option>
                    </select>
                    <p className="text-[10px] text-stone-500">Payload: 4.5 Tons rations</p>
                  </div>

                  {/* Ambulance Select */}
                  <div className="p-3 bg-stone-950 rounded-xl border border-stone-800 space-y-1.5">
                    <label className="text-[10px] text-stone-400 font-bold block">🚑 Mountain Ambulance</label>
                    <select
                      value={selectedAmbulanceId}
                      onChange={(e) => setSelectedAmbulanceId(e.target.value)}
                      className="w-full bg-stone-900 border border-stone-700 rounded-lg p-1.5 text-xs text-stone-200"
                    >
                      <option value="AMB-02">AMB-02 4WD (FREE / Batote)</option>
                      <option value="">None</option>
                    </select>
                    <p className="text-[10px] text-stone-500">ALS trauma response</p>
                  </div>
                </div>
              </div>

              {/* Supplies Quantities */}
              <div className="space-y-2">
                <h3 className="font-bold text-stone-100 text-xs uppercase tracking-wider text-blue-400">
                  2. Load Emergency Relief Supplies (From Inventory)
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-stone-950 rounded-xl border border-stone-800 space-y-1">
                    <span className="text-[10px] text-stone-400">🥪 Food Kits</span>
                    <input
                      type="number"
                      value={foodQuantity}
                      onChange={(e) => setFoodQuantity(Number(e.target.value))}
                      className="w-full bg-stone-900 border border-stone-700 rounded-lg p-1.5 text-xs text-stone-100 font-mono"
                    />
                    <span className="text-[10px] text-stone-500">Stock: 1200</span>
                  </div>

                  <div className="p-3 bg-stone-950 rounded-xl border border-stone-800 space-y-1">
                    <span className="text-[10px] text-stone-400">💧 Water Cans (20L)</span>
                    <input
                      type="number"
                      value={waterQuantity}
                      onChange={(e) => setWaterQuantity(Number(e.target.value))}
                      className="w-full bg-stone-900 border border-stone-700 rounded-lg p-1.5 text-xs text-stone-100 font-mono"
                    />
                    <span className="text-[10px] text-stone-500">Stock: 850</span>
                  </div>

                  <div className="p-3 bg-stone-950 rounded-xl border border-stone-800 space-y-1">
                    <span className="text-[10px] text-stone-400">🏥 Medical Kits</span>
                    <input
                      type="number"
                      value={medicalQuantity}
                      onChange={(e) => setMedicalQuantity(Number(e.target.value))}
                      className="w-full bg-stone-900 border border-stone-700 rounded-lg p-1.5 text-xs text-stone-100 font-mono"
                    />
                    <span className="text-[10px] text-stone-500">Stock: 340</span>
                  </div>

                  <div className="p-3 bg-stone-950 rounded-xl border border-stone-800 space-y-1">
                    <span className="text-[10px] text-stone-400">⛺ Thermal Blankets</span>
                    <input
                      type="number"
                      value={blanketQuantity}
                      onChange={(e) => setBlanketQuantity(Number(e.target.value))}
                      className="w-full bg-stone-900 border border-stone-700 rounded-lg p-1.5 text-xs text-stone-100 font-mono"
                    />
                    <span className="text-[10px] text-stone-500">Stock: 1450</span>
                  </div>
                </div>
              </div>

              {/* Force Attachment */}
              <div className="p-3.5 bg-stone-950 rounded-xl border border-stone-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <div>
                    <h4 className="font-bold text-stone-200 text-xs">
                      Attach SDRF Mountain Rescue Tactical Force
                    </h4>
                    <p className="text-[11px] text-stone-400">
                      8-officer squad for crowd safety, rope rigging, and medical extrication.
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={includeForce}
                  onChange={(e) => setIncludeForce(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* MargRakshak Mountain Corridor Passability Check */}
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>MargRakshak Mountain Corridor Verification: PASSABLE</span>
                </div>
                <p className="text-[11px] text-emerald-200/80">
                  NH-44 Panthyal blocked to regular vehicles, but Chanderkote - Rajgarh Ridge bypass corridor is cleared for 4x4 relief convoy transit (Speed limit 35 km/h).
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-stone-950 border-t border-stone-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsDispatchModalOpen(false)}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleExecuteDispatch}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-950 transition-all hover:scale-[1.02]"
              >
                <Truck className="w-4 h-4" />
                🚀 Authorize &amp; Dispatch Emergency Convoy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
