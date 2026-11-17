"use client";

import React from "react";
import { Layers, CheckCircle2, AlertTriangle, Eye, RefreshCw } from "lucide-react";

export default function AdminSatellitePage(): React.ReactElement {
  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-stone-800">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-purple-400" />
          <h1 className="text-lg font-bold text-stone-100">ESA Copernicus Satellite Intelligence &amp; Passes</h1>
        </div>
        <p className="text-xs text-stone-400">
          Live Open OData feed for Sentinel-2 optical MSI and Sentinel-1 SAR radar ground deformation overpasses.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 space-y-2">
          <span className="text-xs font-semibold text-stone-400">Optical Imagery Pass</span>
          <p className="text-base font-bold text-stone-100">Sentinel-2B (MSI)</p>
          <p className="text-xs text-purple-400">Acquired ~4.2 hrs ago</p>
          <div className="text-[11px] text-stone-500 pt-2 border-t border-stone-800">
            Cloud Cover: <strong>18% (Gorge Clear)</strong> | 10m Resolution
          </div>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 space-y-2">
          <span className="text-xs font-semibold text-stone-400">Cloud-Piercing Radar</span>
          <p className="text-base font-bold text-stone-100">Sentinel-1A (C-SAR)</p>
          <p className="text-xs text-emerald-400">Acquired ~14 hrs ago</p>
          <div className="text-[11px] text-stone-500 pt-2 border-t border-stone-800">
            Interferometric Coherence: <strong>0.72 (Stable Bedrock)</strong>
          </div>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 space-y-2">
          <span className="text-xs font-semibold text-stone-400">Surface Change Detection</span>
          <p className="text-base font-bold text-red-400">Displacement Anomaly</p>
          <p className="text-xs text-stone-300">Panthyal Ridge Scarring</p>
          <div className="text-[11px] text-stone-500 pt-2 border-t border-stone-800">
            Normalized Difference Vegetation Index (NDVI) Shift: <strong>-0.34</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
