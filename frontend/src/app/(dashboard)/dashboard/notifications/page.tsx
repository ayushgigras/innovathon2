"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  Radio,
  Clock,
  User,
  MapPin,
  CheckCircle2,
  ArrowLeft,
  Truck,
  Wrench,
  HeartPulse,
  Route,
  ShieldCheck,
  Filter,
  ExternalLink,
} from "lucide-react";
import {
  OfficerDisasterUpdate,
  getOfficerUpdates,
  markAllUpdatesRead,
  markUpdateRead,
} from "@/lib/api/officer-updates-service";

const DISTRICT_FILTERS = ["All Districts", "Ramban", "Jammu", "Udhampur", "Doda", "Shopian", "Srinagar"];

export default function CitizenNotificationsPage(): React.ReactElement {
  const [updates, setUpdates] = useState<OfficerDisasterUpdate[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState("All Districts");
  const [selectedType, setSelectedType] = useState<string>("All");

  useEffect(() => {
    // Load and mark as read when visiting page
    const all = getOfficerUpdates();
    setUpdates(all);
    markAllUpdatesRead();

    const sync = () => {
      setUpdates(getOfficerUpdates());
    };
    window.addEventListener("aapda_field_updates_updated", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("aapda_field_updates_updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const filteredUpdates = updates.filter((u) => {
    const matchDist =
      selectedDistrict === "All Districts" ||
      u.district.toLowerCase() === selectedDistrict.toLowerCase() ||
      u.district.toLowerCase() === "all j&k";

    const matchType =
      selectedType === "All" || u.operationType.toLowerCase() === selectedType.toLowerCase();

    return matchDist && matchType;
  });

  const getCategoryIcon = (type: string) => {
    switch (type) {
      case "Machinery Clearance":
        return <Wrench className="w-4 h-4 text-amber-400" />;
      case "Food & Water Relief":
        return <Truck className="w-4 h-4 text-emerald-400" />;
      case "Medical Aid":
        return <HeartPulse className="w-4 h-4 text-red-400" />;
      case "Road Reopening":
        return <Route className="w-4 h-4 text-blue-400" />;
      default:
        return <Radio className="w-4 h-4 text-red-400" />;
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      {/* ── Top Navigation & Back Link ───────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Public Overview
        </Link>

        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-emerald-300 font-mono">
            Live Field Operation Feed Active
          </span>
        </div>
      </div>

      {/* ── Hero Banner ──────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-900 to-red-950/40 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20 text-red-400 border border-red-500/30 text-xs font-bold uppercase tracking-wider">
              <Bell className="w-3.5 h-3.5" />
              Officer Field Disaster Notifications
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-stone-100">
              Ground Response Updates &amp; Actions
            </h1>
            <p className="text-sm text-stone-400 leading-relaxed">
              Real-time updates posted directly by District Disaster Management Authority (DDMA) incident commanders, field officers, and Border Roads Organisation (BRO) engineering units.
            </p>
          </div>

          <div className="hidden md:flex flex-col items-end text-right">
            <div className="text-2xl font-black text-stone-100">{updates.length}</div>
            <div className="text-xs text-stone-500 uppercase tracking-wider font-semibold">
              Disaster Bulletins
            </div>
          </div>
        </div>
      </div>

      {/* ── Filter Controls ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-3 rounded-2xl">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-red-400" /> Area:
          </span>
          {DISTRICT_FILTERS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setSelectedDistrict(d)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedDistrict === d
                  ? "bg-red-600 text-white shadow-sm"
                  : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => {
            markAllUpdatesRead();
            setUpdates(getOfficerUpdates());
          }}
          className="text-xs text-slate-400 hover:text-slate-200 underline font-medium"
        >
          Mark all as viewed
        </button>
      </div>

      {/* ── Notification Cards Feed ─────────────────────────────────────────── */}
      <div className="space-y-4">
        {filteredUpdates.length === 0 ? (
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
              <Bell className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-stone-200">
              No updates found for {selectedDistrict}
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              There are currently no active field operation messages posted for this specific district. Choose &quot;All Districts&quot; to review all regional operations.
            </p>
          </div>
        ) : (
          filteredUpdates.map((item) => (
            <div
              key={item.id}
              className="bg-stone-900/90 border border-stone-800 hover:border-red-500/40 rounded-2xl p-5 sm:p-6 transition-all duration-200 shadow-lg space-y-4 relative group"
            >
              {/* Header Badges */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-800/80 pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-600/20 border border-red-500/30 text-red-300 font-bold text-xs uppercase tracking-wider">
                    <MapPin className="w-3.5 h-3.5" />
                    {item.district} Sector
                  </span>

                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-800 border border-stone-700 text-stone-300 text-xs font-semibold">
                    {getCategoryIcon(item.operationType)}
                    {item.operationType}
                  </span>

                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                    VERIFIED OFFICER REPORT
                  </span>
                </div>

                <div className="flex items-center gap-1 text-xs text-stone-400 font-mono">
                  <Clock className="w-3.5 h-3.5 text-stone-500" />
                  <span>
                    {new Date(item.timestamp).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    at{" "}
                    {new Date(item.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>

              {/* Title & Body */}
              <div className="space-y-2">
                <h2 className="text-base sm:text-lg font-bold text-stone-100 group-hover:text-red-400 transition-colors">
                  {item.title}
                </h2>
                <p className="text-sm text-stone-300 leading-relaxed bg-stone-950/60 border border-stone-800/60 rounded-xl p-4">
                  {item.message}
                </p>
              </div>

              {/* Footer: Officer Byline & Quick Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
                <div className="flex items-center gap-2 text-stone-400">
                  <div className="w-6 h-6 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center text-stone-300">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <span>
                    Field Reporting Officer:{" "}
                    <strong className="text-stone-200">{item.officerName}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href="/dashboard/roads"
                    className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 border border-stone-700"
                  >
                    <span>Check Road Corridors</span>
                    <ExternalLink className="w-3 h-3 text-stone-400" />
                  </Link>

                  <Link
                    href="/dashboard/incidents/report"
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition-colors shadow"
                  >
                    Report Ground Incident
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
