import React from "react";
import { cn } from "@/lib/utils";
import type { IncidentStatus } from "@/types";

interface StatusBadgeProps {
  status: IncidentStatus;
  className?: string;
}

const STATUS_STYLES: Record<IncidentStatus, string> = {
  reported: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  under_review: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  verified: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  closed: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  duplicate: "bg-orange-500/15 text-orange-400 border-orange-500/30",
};

const STATUS_LABELS: Record<IncidentStatus, string> = {
  reported: "Reported",
  under_review: "Under Review",
  verified: "Verified",
  closed: "Closed",
  duplicate: "Duplicate",
};

export function StatusBadge({ status, className }: StatusBadgeProps): React.ReactElement {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded border text-xs font-medium",
        STATUS_STYLES[status],
        className
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
