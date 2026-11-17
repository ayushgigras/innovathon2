"use client";

import React, { useState } from "react";
import { Truck, CheckCircle2, MapPin, Clock } from "lucide-react";
import { MOCK_DELIVERIES } from "@/lib/api/mock-adapter";

export default function AdminDispatchPage(): React.ReactElement {
  const [deliveries, setDeliveries] = useState(MOCK_DELIVERIES);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleUpdateStatus = (id: string, newStatus: "in_transit" | "delivered") => {
    setDeliveries(
      deliveries.map((d) => (d.id === id ? { ...d, status: newStatus } : d))
    );
    setFeedback(`Delivery ${id} marked as ${newStatus.toUpperCase()}.`);
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

      <div className="pb-2 border-b border-stone-800">
        <div className="flex items-center gap-2">
          <Truck className="w-5 h-5 text-emerald-400" />
          <h1 className="text-lg font-bold text-stone-100">Relief Dispatch &amp; Delivery Tracking</h1>
        </div>
        <p className="text-xs text-stone-400">
          Track field transport vehicles, convoy routes, driver manifests, and physical handover confirmations.
        </p>
      </div>

      <div className="space-y-3">
        {deliveries.map((del) => (
          <div
            key={del.id}
            className="bg-stone-900 border border-stone-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-stone-400">{del.id}</span>
                <span className="font-bold text-stone-100 text-xs">Destination: {del.settlementName}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                    del.status === "delivered"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-blue-500/20 text-blue-400"
                  }`}
                >
                  {del.status.replace("_", " ")}
                </span>
              </div>
              <div className="text-xs text-stone-400">
                Driver: <strong>{del.driverName || "Assigned Driver"}</strong> ({del.vehicleId || "Vehicle VH-07"})
              </div>
              <div className="text-[11px] text-stone-500">
                Cargo Manifest: {del.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {del.status !== "delivered" && (
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(del.id, "delivered")}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-md"
                >
                  Confirm Physical Handover
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
