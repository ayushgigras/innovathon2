"use client";

import dynamic from "next/dynamic";
import React from "react";
import { RefreshCw } from "lucide-react";
import type { ConvoyDispatch } from "@/lib/api/rahat-grid-service";

interface LiveConvoyMapProps {
  convoy: ConvoyDispatch;
  className?: string;
}

const LiveConvoyMapInner = dynamic(
  () => import("./LiveConvoyMapInner"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[360px] sm:h-[440px] rounded-2xl bg-stone-950 border border-stone-800 flex flex-col items-center justify-center text-center p-6 space-y-2 text-stone-400">
        <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin" />
        <p className="text-xs font-semibold text-stone-200">Loading Live GIS Mountain Convoy Map...</p>
        <span className="text-[10px] text-stone-500">Connecting to satellite radar telemetry</span>
      </div>
    ),
  }
);

export function LiveConvoyMap(props: LiveConvoyMapProps): React.ReactElement {
  return <LiveConvoyMapInner {...props} />;
}
