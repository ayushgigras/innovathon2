"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import {
  getOfficerUpdates,
  getUnreadUpdatesCount,
} from "@/lib/api/officer-updates-service";

interface CitizenNotificationBellProps {
  className?: string;
}

export function CitizenNotificationBell({
  className = "",
}: CitizenNotificationBellProps): React.ReactElement {
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    const sync = () => {
      const all = getOfficerUpdates();
      const unread = all.filter((u) => !u.read).length;
      setUnreadCount(unread);
    };

    sync();

    // Listen to our custom notification events and storage
    window.addEventListener("aapda_notification_received", sync);
    window.addEventListener("aapda_field_updates_updated", sync);
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener("aapda_notification_received", sync);
      window.removeEventListener("aapda_field_updates_updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return (
    <Link
      href="/dashboard/notifications"
      aria-label="Disaster notifications and officer field updates"
      title={
        unreadCount > 0
          ? `${unreadCount} new officer disaster update${unreadCount > 1 ? "s" : ""} — click to open notifications page`
          : "Officer Disaster Updates & Notifications — click to open page"
      }
      className={`relative inline-flex items-center justify-center p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 hover:border-amber-500/50 transition-all shadow-md group ${className}`}
    >
      <Bell className="w-4 h-4 group-hover:scale-110 transition-transform text-amber-400" />

      {/* ── Red Dot Badge for New Officer Disaster Update ───────────────── */}
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-4 w-4 bg-red-600 text-white text-[9px] font-black items-center justify-center shadow-lg border border-slate-950">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        </span>
      )}
    </Link>
  );
}
