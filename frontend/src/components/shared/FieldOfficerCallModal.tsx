"use client";

import React, { useState, useEffect } from "react";
import {
  PhoneCall,
  PhoneOff,
  Radio,
  CheckCircle2,
  MapPin,
  ShieldAlert,
  Camera,
  Truck,
  AlertTriangle,
  X,
  Volume2,
} from "lucide-react";
import type { FieldOfficerContact } from "@/lib/api/field-officers";
import type { Incident } from "@/types";

interface FieldOfficerCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  officer: FieldOfficerContact;
  incident: Incident;
  onCallLogged: (callNote: string, actionType: string) => void;
}

export function FieldOfficerCallModal({
  isOpen,
  onClose,
  officer,
  incident,
  onCallLogged,
}: FieldOfficerCallModalProps): React.ReactElement | null {
  const [callState, setCallState] = useState<"ringing" | "connected" | "ended">("ringing");
  const [callDuration, setCallDuration] = useState<number>(0);
  const [selectedOrder, setSelectedOrder] = useState<string>("photo_verification");
  const [callNotes, setCallNotes] = useState<string>("");

  useEffect(() => {
    if (!isOpen) {
      setCallState("ringing");
      setCallDuration(0);
      setCallNotes("");
      return;
    }

    // Auto connect after 1.2s to simulate real call pickup
    const timer = setTimeout(() => {
      setCallState("connected");
    }, 1200);

    return () => clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isOpen && callState === "connected") {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isOpen, callState]);

  if (!isOpen) return null;

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleCompleteCall = () => {
    const defaultNote =
      selectedOrder === "photo_verification"
        ? `Instructed ${officer.officerName} to conduct immediate physical photo recon. Unit en-route (ETA 5 mins).`
        : selectedOrder === "road_block"
        ? `Ordered ${officer.officerName} to place warning cones and initiate traffic diversion before closure.`
        : `Requested heavy machinery deployment via ${officer.unit} for debris clearance.`;

    const finalNote = callNotes.trim() ? callNotes : defaultNote;
    onCallLogged(finalNote, selectedOrder);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl space-y-4">
        {/* Call Banner Header */}
        <div
          className={`p-5 text-white transition-colors flex items-center justify-between ${
            callState === "ringing"
              ? "bg-amber-600/90"
              : callState === "connected"
              ? "bg-emerald-700/90"
              : "bg-stone-800"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-2xl animate-pulse">
              <PhoneCall className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-black/30 px-2 py-0.5 rounded-full uppercase font-mono font-bold tracking-wider">
                  {callState === "ringing" ? "Calling Patrol Unit..." : "Call In Progress"}
                </span>
                {callState === "connected" && (
                  <span className="text-xs font-mono font-bold">{formatTimer(callDuration)}</span>
                )}
              </div>
              <h3 className="text-lg font-black tracking-tight">{officer.officerName}</h3>
              <p className="text-xs text-white/80">{officer.unit}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Officer Location & Comms Metadata */}
        <div className="px-5 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-2 bg-stone-950/80 p-3 rounded-2xl border border-stone-800">
            <div>
              <p className="text-[10px] text-stone-500 uppercase font-semibold">Sector &amp; Base</p>
              <p className="text-stone-200 font-bold flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-red-400" />
                {officer.district} Sector ({officer.distanceKm} km away)
              </p>
              <p className="text-[10px] text-stone-400 truncate">{officer.locationBase}</p>
            </div>

            <div>
              <p className="text-[10px] text-stone-500 uppercase font-semibold">VHF Radio / Direct Dial</p>
              <p className="text-stone-200 font-bold flex items-center gap-1 mt-0.5">
                <Radio className="w-3.5 h-3.5 text-blue-400" />
                {officer.radioFrequency}
              </p>
              <a
                href={`tel:${officer.phone}`}
                className="text-[11px] text-emerald-400 hover:underline font-mono font-semibold"
              >
                {officer.phone}
              </a>
            </div>
          </div>

          {/* Incident Context */}
          <div className="p-3 bg-stone-950/50 border border-stone-800 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-[10px] text-stone-400">
              <span className="font-mono text-emerald-400 font-bold">Regarding {incident.id}</span>
              <span className="capitalize text-amber-400 font-semibold">{incident.severity} Severity</span>
            </div>
            <p className="text-stone-200 font-bold text-xs line-clamp-1">{incident.title}</p>
            <p className="text-[11px] text-stone-400 line-clamp-2">{incident.description}</p>
          </div>

          {/* Tactical Orders Dispatch */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-stone-300 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              Tactical Radio / Verbal Orders:
            </label>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedOrder("photo_verification")}
                className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  selectedOrder === "photo_verification"
                    ? "bg-emerald-950/60 border-emerald-500 text-emerald-300"
                    : "bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700"
                }`}
              >
                <Camera className="w-4 h-4 mb-1 text-emerald-400" />
                <span className="text-[11px] font-bold">Ground Photo</span>
                <span className="text-[9px] text-stone-500">Dispatch for verification</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedOrder("road_block")}
                className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  selectedOrder === "road_block"
                    ? "bg-amber-950/60 border-amber-500 text-amber-300"
                    : "bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700"
                }`}
              >
                <ShieldAlert className="w-4 h-4 mb-1 text-amber-400" />
                <span className="text-[11px] font-bold">Diversion</span>
                <span className="text-[9px] text-stone-500">Cones &amp; traffic diversion</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedOrder("heavy_machinery")}
                className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  selectedOrder === "heavy_machinery"
                    ? "bg-blue-950/60 border-blue-500 text-blue-300"
                    : "bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700"
                }`}
              >
                <Truck className="w-4 h-4 mb-1 text-blue-400" />
                <span className="text-[11px] font-bold">Clearance</span>
                <span className="text-[9px] text-stone-500">Request heavy JCB</span>
              </button>
            </div>
          </div>

          {/* Commander Call Log Notes */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-stone-400">
              Verbal Dispatch Notes (Recorded in Audit Trail):
            </label>
            <textarea
              rows={2}
              value={callNotes}
              onChange={(e) => setCallNotes(e.target.value)}
              placeholder="e.g. Officer confirmed visual contact with debris. Team securing traffic perimeter."
              className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-stone-950 border-t border-stone-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <PhoneOff className="w-3.5 h-3.5 text-red-400" />
            End Call
          </button>

          <button
            type="button"
            onClick={handleCompleteCall}
            className="flex-1 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            Log Call &amp; Dispatch Field Unit
          </button>
        </div>
      </div>
    </div>
  );
}
