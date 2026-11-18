"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Radio,
  Send,
  AlertTriangle,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Bell,
  Truck,
  Wrench,
  HeartPulse,
  Route,
  Sparkles,
  ExternalLink,
  ChevronRight,
  User,
  MapPin,
} from "lucide-react";
import {
  OfficerDisasterUpdate,
  getOfficerUpdates,
  sendOfficerUpdate,
  deleteOfficerUpdate,
} from "@/lib/api/officer-updates-service";

const DISTRICT_OPTIONS = [
  "Ramban",
  "Jammu",
  "Udhampur",
  "Doda",
  "Shopian",
  "Kishtwar",
  "Srinagar",
  "All J&K",
];

const PRESETS = [
  {
    label: "🚜 Panthyal JCB Clearing",
    title: "2x JCB Heavy Excavators & SDRF Clearing Boulder Fall at Km 144",
    message: "BRO mechanical unit and SDRF mountain team deployed. Heavy rock cutting in progress at Panthyal. Expected single-lane corridor opening within 40 minutes for stranded light vehicles.",
    officer: "Officer S. Manhas (Incident Commander, Ramban)",
    district: "Ramban",
    type: "Machinery Clearance" as const,
  },
  {
    label: "🍞 Emergency Food & Water",
    title: "DDMA Relief Unit Distributing 150 Ration Kits at Ramsu Post",
    message: "District administration mobile relief trucks have distributed 150 family dry food packs and 100 water canisters to passengers waiting near Ramsu approach.",
    officer: "Inspector K. Rathore (Relief Logistics)",
    district: "Ramban",
    type: "Food & Water Relief" as const,
  },
  {
    label: "🚑 Medical Aid Station",
    title: "Paramedic Triage Post Active at Chanderkote BRO Base",
    message: "Medical relief ambulance and first aid doctors on site. Providing oxygen support, thermal blankets, and checkups to stranded elderly passengers.",
    officer: "Dr. A. Sharma (Chief Medical Officer)",
    district: "Ramban",
    type: "Medical Aid" as const,
  },
  {
    label: "🛣️ Single-Lane Restored",
    title: "One-Lane Traffic Movement Restored for Stranded LMVs",
    message: "Controlled alternating convoy movement permitted through Panthyal. Drivers advised to maintain 20 km/h speed and follow traffic police hand signals.",
    officer: "Officer S. Manhas (Incident Commander, Ramban)",
    district: "Ramban",
    type: "Road Reopening" as const,
  },
];

export default function AdminCommunicationsPage(): React.ReactElement {
  const [updates, setUpdates] = useState<OfficerDisasterUpdate[]>([]);
  const [officerName, setOfficerName] = useState("Officer S. Manhas (Field Response Lead)");
  const [district, setDistrict] = useState("Ramban");
  const [operationType, setOperationType] = useState<OfficerDisasterUpdate["operationType"]>("Machinery Clearance");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sentSuccess, setSentSuccess] = useState(false);

  // Sync updates
  useEffect(() => {
    const sync = () => {
      setUpdates(getOfficerUpdates());
    };
    sync();
    window.addEventListener("aapda_field_updates_updated", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("aapda_field_updates_updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const handleApplyPreset = (preset: typeof PRESETS[0]) => {
    setTitle(preset.title);
    setMessage(preset.message);
    setOfficerName(preset.officer);
    setDistrict(preset.district);
    setOperationType(preset.type);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    sendOfficerUpdate({
      title,
      message,
      officerName,
      district,
      operationType,
    });

    setTitle("");
    setMessage("");
    setSentSuccess(true);
    setTimeout(() => setSentSuccess(false), 4000);
  };

  const handleDelete = (id: string) => {
    deleteOfficerUpdate(id);
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col">
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <header className="border-b border-stone-800 bg-stone-900/90 backdrop-blur px-6 py-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500 shadow-md">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs text-stone-400">
              <Link href="/admin/dashboard" className="hover:text-stone-200">
                Control Room
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-red-400 font-medium">Public Communications</span>
            </div>
            <h1 className="text-lg font-bold text-stone-100">
              Officer Disaster Updates &amp; Citizen Web Notifications
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 px-3 py-1.5 rounded-lg text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            Citizen Web Notification Push: ACTIVE
          </div>

          <Link
            href="/dashboard"
            target="_blank"
            className="px-3.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-stone-700 transition-colors shadow"
          >
            <Bell className="w-3.5 h-3.5 text-amber-400" />
            Inspect Citizen Portal &amp; Bell
            <ExternalLink className="w-3 h-3 text-stone-400" />
          </Link>
        </div>
      </header>

      {/* ── Success Toast ────────────────────────────────────────────────────── */}
      {sentSuccess && (
        <div className="bg-emerald-600 text-white px-6 py-3 font-semibold text-xs flex items-center justify-between shadow-lg animate-in slide-in-from-top">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>
              Update broadcasted successfully! The citizen portal top-right bell has been triggered with a red dot.
            </span>
          </div>
          <Link
            href="/dashboard"
            target="_blank"
            className="underline underline-offset-2 hover:text-emerald-100 font-bold"
          >
            Open Citizen Portal to See Notification →
          </Link>
        </div>
      )}

      {/* ── Main Layout: 2 Columns ──────────────────────────────────────────── */}
      <div className="flex-1 p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ── Left Column: Clean Officer Broadcast Composer ─────────────────── */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-stone-100">
                    Write Disaster Field Operation Update
                  </h2>
                  <p className="text-[11px] text-stone-400">
                    Inform citizens on what your response team and machinery are doing
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Action Presets */}
            <div className="mb-4">
              <div className="flex items-center gap-1 text-[11px] font-semibold text-stone-400 mb-2">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Quick Scenario Presets:</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {PRESETS.map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className="p-2 bg-stone-950/70 hover:bg-stone-800 border border-stone-800 hover:border-stone-700 rounded-xl text-left transition-all text-xs group"
                  >
                    <span className="font-bold text-stone-200 group-hover:text-red-400 block truncate">
                      {p.label}
                    </span>
                    <span className="text-[10px] text-stone-500 block truncate">
                      {p.title}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSend} className="space-y-4">
              {/* Officer Name & Post */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-1">
                    Officer Name / Unit
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={officerName}
                      onChange={(e) => setOfficerName(e.target.value)}
                      placeholder="e.g. Officer S. Manhas (Panthyal Lead)"
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-9 pr-3 py-2 text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-1">
                    Target Sector / District
                  </label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-3" />
                    <select
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-9 pr-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-red-500"
                    >
                      {DISTRICT_OPTIONS.map((d) => (
                        <option key={d} value={d}>
                          {d} Sector
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Operation Category Pills */}
              <div>
                <label className="block text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-1.5">
                  Action Category
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      "Machinery Clearance",
                      "Food & Water Relief",
                      "Medical Aid",
                      "Road Reopening",
                      "General Advisory",
                    ] as const
                  ).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setOperationType(cat)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        operationType === cat
                          ? "bg-red-600 text-white shadow-sm"
                          : "bg-stone-950 border border-stone-800 text-stone-400 hover:text-stone-200"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Update Title */}
              <div>
                <label className="block text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-1">
                  Update Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. JCB 3DX & BRO Excavators Commenced Rock Clearing at Panthyal"
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-red-500 font-medium"
                />
              </div>

              {/* Update Message */}
              <div>
                <label className="block text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-1">
                  Disaster Operation Details (What is being done on the ground?)
                </label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Detail machinery deployed, road opening ETA, food packets distributed, medical aid stations set up, safety instructions..."
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-red-500 leading-relaxed resize-none"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-950 transition-all hover:scale-[1.01]"
              >
                <Send className="w-4 h-4" />
                <span>Broadcast Officer Update to Citizen Web (Trigger Notification)</span>
              </button>
            </form>
          </div>
        </div>

        {/* ── Right Column: Live Broadcasted Updates Feed ────────────────────── */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-xl flex flex-col h-full">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-stone-100">
                    Live Broadcast History ({updates.length})
                  </h2>
                  <p className="text-[11px] text-stone-400">
                    Active notifications displayed on the Citizen Web Portal
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded">
                ● Synchronized Live
              </span>
            </div>

            {/* List of Updates */}
            <div className="space-y-3 overflow-y-auto max-h-[640px] pr-1">
              {updates.length === 0 ? (
                <div className="text-center py-12 text-stone-500 text-xs">
                  No officer disaster updates published yet. Use the composer on the left to write an update.
                </div>
              ) : (
                updates.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-stone-950/80 border border-stone-800 hover:border-stone-700 rounded-xl space-y-2 transition-all relative group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                        <span className="font-bold px-2 py-0.5 rounded bg-red-600/30 text-red-300 border border-red-500/30 uppercase tracking-wider">
                          {item.district}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-stone-800 text-stone-300 font-medium">
                          {item.operationType}
                        </span>
                        <span className="text-stone-500 flex items-center gap-1 ml-auto">
                          <Clock className="w-3 h-3" />
                          {new Date(item.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="text-stone-600 hover:text-red-400 p-1 rounded hover:bg-stone-800 transition-colors"
                        title="Delete this update"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <h3 className="font-bold text-xs text-stone-100 group-hover:text-amber-200 transition-colors">
                      {item.title}
                    </h3>

                    <p className="text-xs text-stone-400 leading-relaxed">
                      {item.message}
                    </p>

                    <div className="flex items-center justify-between pt-1 border-t border-stone-900 text-[11px] text-stone-500">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-stone-400" />
                        <span className="text-stone-300 font-medium">{item.officerName}</span>
                      </span>

                      <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Delivered to Citizen Web Bell
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
