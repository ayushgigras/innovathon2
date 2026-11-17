"use client";

import React from "react";
import dynamic from "next/dynamic";
import { CloudRain, RefreshCw } from "lucide-react";

const WeatherExplorer = dynamic(
  () => import("@/components/weather/WeatherExplorer").then((mod) => mod.WeatherExplorer),
  {
    ssr: false,
    loading: () => (
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 text-center text-xs text-stone-400">
        <RefreshCw className="w-5 h-5 text-emerald-400 mx-auto animate-spin mb-2" />
        Loading Live Open-Meteo Weather Explorer...
      </div>
    ),
  }
);

export default function AdminWeatherPage(): React.ReactElement {
  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-stone-800">
        <div className="flex items-center gap-2">
          <CloudRain className="w-5 h-5 text-emerald-400" />
          <h1 className="text-lg font-bold text-stone-100">Weather &amp; Soil Moisture Telemetry Explorer</h1>
        </div>
        <p className="text-xs text-stone-400">
          Real-time Open-Meteo atmospheric forecasts, precipitation rates, and 0-3cm topsoil saturation indices.
        </p>
      </div>

      <WeatherExplorer />
    </div>
  );
}
