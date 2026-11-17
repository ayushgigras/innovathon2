"use client";

import React from "react";
import { Sparkles, Layers, CloudRain, MapPin, Eye, CheckCircle2 } from "lucide-react";

export default function AdminIntelligencePage(): React.ReactElement {
  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-stone-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <h1 className="text-lg font-bold text-stone-100">AAPDA Lens Multi-Source Intelligence Engine</h1>
        </div>
        <p className="text-xs text-stone-400">
          Synthesizes citizen reports, Open-Meteo precipitation, Sentinel radar coherence, and MargRakshak road geometry.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-3">
          <h2 className="text-sm font-bold text-stone-100 flex items-center gap-2">
            <CloudRain className="w-4 h-4 text-emerald-400" />
            Signal 1: Environmental Precipitation &amp; Soil Saturation
          </h2>
          <p className="text-xs text-stone-300">
            Open-Meteo hourly rate measured 38.4 mm/h at 33.25°N, with 0-3cm soil moisture index reaching 0.42 m³/m³ (saturation near plastic threshold).
          </p>
          <div className="p-2 bg-stone-950 rounded-lg text-xs text-amber-400 font-semibold">
            Status: Active Trigger (Precipitation threshold exceeded)
          </div>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-3">
          <h2 className="text-sm font-bold text-stone-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-400" />
            Signal 2: Earth Observation Satellite Passes
          </h2>
          <p className="text-xs text-stone-300">
            Copernicus Sentinel-2 pass acquired 4 hours ago validated clear atmospheric conditions (18% cloud cover) with optical surface scarring detected at Panthyal gorge.
          </p>
          <div className="p-2 bg-stone-950 rounded-lg text-xs text-purple-400 font-semibold">
            Status: Corroborated Optical Anomaly
          </div>
        </div>
      </div>
    </div>
  );
}
