import React from "react";
import { cn } from "@/lib/utils";
import type { SeverityLevel } from "@/types";

interface SeverityBadgeProps {
  severity: SeverityLevel;
  className?: string;
}

const SEVERITY_STYLES: Record<SeverityLevel, string> = {
  critical: "bg-red-500/15 text-red-400 border-red-500/30",
  high: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  medium: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  low: "bg-blue-500/15 text-blue-400 border-blue-500/30",
};

export function SeverityBadge({ severity, className }: SeverityBadgeProps): React.ReactElement {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded border text-xs font-semibold uppercase tracking-wide",
        SEVERITY_STYLES[severity],
        className
      )}
    >
      {severity}
    </span>
  );
}
