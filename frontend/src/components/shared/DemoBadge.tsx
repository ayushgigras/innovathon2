import React from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DemoBadgeProps {
  className?: string;
  variant?: "banner" | "inline";
}

export function DemoBadge({ className, variant = "inline" }: DemoBadgeProps): React.ReactElement {
  if (variant === "banner") {
    return (
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 text-xs font-medium",
          className
        )}
        role="status"
        aria-label="Demo simulated data"
      >
        <AlertTriangle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
        <span>DEMO / SIMULATED — All data is synthetic and for demonstration purposes only</span>
      </div>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/30 rounded text-amber-400 text-[10px] font-semibold uppercase tracking-wide",
        className
      )}
      title="Simulated demo data — not real"
    >
      <AlertTriangle className="w-2.5 h-2.5" aria-hidden="true" />
      DEMO
    </span>
  );
}
