"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Radio,
  Send,
  AlertTriangle,
  Clock,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  FileText,
  Archive,
  RefreshCw,
  PlusCircle,
  Eye,
  ArrowRight,
} from "lucide-react";
import { MOCK_ALERTS, broadcastAlert } from "@/lib/api/mock-adapter";
import type { PublicAlert } from "@/types";

type NotificationCategory =
  | "emergency_alert"
  | "incident_update"
  | "road_closure"
  | "public_safety_advisory"
  | "relief_progress_update"
  | "estimated_resolution_update"
  | "resolution_notice";

interface PublicNotice {
  id: string;
  category: NotificationCategory;
  title: string;
  message: string;
  severity: "critical" | "warning" | "advisory";
  district: string;
  associatedIncidentId?: string;
  estimatedResolutionTime?: string;
  mapLink?: string;
  status: "published" | "draft" | "withdrawn" | "expired" | "archived";
  publishedAt?: string;
  expiresAt?: string;
  authorizedBy: string;
  telegramBroadcast: boolean;
  subscribersCount: number;
}

const INITIAL_NOTICES: PublicNotice[] = [
  {
    id: "PUB-001",
    category: "road_closure",
    title: "CRITICAL: NH-44 Landslide at Panthyal — Highway Blocked",
    message: "Debris and shooting stones have completely blocked NH-44 between Ramban and Banihal. Diversion active via Mughal Road (Shopian) for LMVs only. Avoid travelling along Chenab gorge slopes.",
    severity: "critical",
    district: "Ramban",
    associatedIncidentId: "INC-001",
    estimatedResolutionTime: "Today at 20:00 IST (subject to weather)",
    mapLink: "/dashboard/roads",
    status: "published",
    publishedAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    authorizedBy: "R. Sharma (Incident Commander, Ramban DDMA)",
    telegramBroadcast: true,
    subscribersCount: 1420,
  },
  {
    id: "PUB-002",
    category: "public_safety_advisory",
    title: "WEATHER ADVISORY: Cloudburst Watch for Chenab Basin",
    message: "Open-Meteo & IMD radar detect high precipitation rate (>45mm/hr) in upper catchment. Moderate flash-flood risk for low-lying settlements near Doda and Khari.",
    severity: "warning",
    district: "Doda",
    associatedIncidentId: "INC-002",
    status: "published",
    publishedAt: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    authorizedBy: "R. Sharma (Incident Commander, Ramban DDMA)",
    telegramBroadcast: true,
    subscribersCount: 1420,
  },
  {
    id: "PUB-003",
    category: "relief_progress_update",
    title: "RELIEF UPDATE: Food and Medical Packets Dispatched to Khari",
    message: "DDMA relief convoy carrying 120 family food packs and critical medicines has departed Chanderkote Depot for isolated hamlets.",
    severity: "advisory",
    district: "Ramban",
    status: "draft",
    authorizedBy: "R. Sharma (Incident Commander, Ramban DDMA)",
    telegramBroadcast: false,
    subscribersCount: 0,
  },
];

export default function AdminCommunicationsPage(): React.ReactElement {
  const [notices, setNotices] = useState<PublicNotice[]>(INITIAL_NOTICES);

  // Form State
  const [category, setCategory] = useState<NotificationCategory>("emergency_alert");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState<"critical" | "warning" | "advisory">("critical");
  const [district, setDistrict] = useState("Ramban");
  const [associatedIncidentId, setAssociatedIncidentId] = useState("INC-001");
  const [estimatedResolution, setEstimatedResolution] = useState("Estimated 4 hours");
  const [includeTelegram, setIncludeTelegram] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Filter
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const handlePublishNotice = (asDraft: boolean = false) => {
    if (!title.trim() || !message.trim()) return;

    const newNotice: PublicNotice = {
      id: `PUB-${Date.now().toString(36).toUpperCase()}`,
      category,
      title,
      message,
      severity,
      district,
      associatedIncidentId,
      estimatedResolutionTime: estimatedResolution,
      mapLink: "/dashboard/roads",
      status: asDraft ? "draft" : "published",
      publishedAt: asDraft ? undefined : new Date().toISOString(),
      authorizedBy: "R. Sharma (Incident Commander, Ramban DDMA)",
      telegramBroadcast: includeTelegram && !asDraft,
      subscribersCount: includeTelegram && !asDraft ? 1420 : 0,
    };

    setNotices([newNotice, ...notices]);

    if (!asDraft) {
      // Also broadcast to public banner
      broadcastAlert({
        title,
        message,
        severity,
        district,
        affectedRoad: "NH-44 Sector",
      });
      setFeedback(`Notice ${newNotice.id} published to Public Web Banner and pushed to 1,420 Telegram Bot subscribers!`);
    } else {
      setFeedback(`Draft notice ${newNotice.id} saved in communication queue.`);
    }

    setTitle("");
    setMessage("");
    setTimeout(() => setFeedback(null), 4500);
  };

  const handleUpdateNoticeStatus = (id: string, newStatus: PublicNotice["status"]) => {
    setNotices(
      notices.map((n) => (n.id === id ? { ...n, status: newStatus } : n))
    );
    setFeedback(`Notice ${id} status updated to ${newStatus.toUpperCase()}.`);
    setTimeout(() => setFeedback(null), 3000);
  };

  const filteredNotices = notices.filter(
    (n) => filterStatus === "all" || n.status === filterStatus
  );

  return (
    <div className="space-y-6">
      {/* Notification Toast */}
      {feedback && (
        <div className="p-3 bg-emerald-950/90 border border-emerald-500 rounded-xl text-emerald-300 text-xs flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{feedback}</span>
          </div>
          <button type="button" onClick={() => setFeedback(null)} className="text-stone-400 hover:text-stone-200">
            ×
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-stone-800">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-red-500 animate-pulse" />
            <h1 className="text-lg font-bold text-stone-100">Public Communication Centre</h1>
            <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold">
              STRICT AUTHORIZATION GATE
            </span>
          </div>
          <p className="text-xs text-stone-400">
            Manage public homepage emergency bulletins, road closure notices, and official Telegram alerts.
          </p>
        </div>

        <div className="p-2.5 bg-stone-900 border border-stone-800 rounded-xl text-xs text-stone-400 max-w-sm">
          <p className="text-red-400 font-semibold text-[11px] flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Strict Public Gate Rule Active:
          </p>
          <p className="text-[10px] text-stone-500">
            Unverified citizen reports and internal AI assessments NEVER appear on the public portal without explicit administrator authorization.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Authorize & Compose Notice */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-stone-100 flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-emerald-400" />
            Authorise &amp; Publish Official Notice
          </h2>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handlePublishNotice(false);
            }}
            className="space-y-3 text-xs"
          >
            <div>
              <label className="block text-stone-300 font-semibold mb-1">
                Notification Category (7 Authorised Types)
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as NotificationCategory)}
                className="w-full px-2.5 py-2 bg-stone-800 border border-stone-700 rounded-xl text-stone-100 text-xs"
              >
                <option value="emergency_alert">🚨 1. Emergency Alert</option>
                <option value="incident_update">ℹ️ 2. Incident Update</option>
                <option value="road_closure">⛔ 3. Road Closure Notice</option>
                <option value="public_safety_advisory">⚠️ 4. Public Safety Advisory</option>
                <option value="relief_progress_update">📦 5. Relief Progress Update</option>
                <option value="estimated_resolution_update">⏱️ 6. Estimated Resolution Update</option>
                <option value="resolution_notice">✅ 7. Resolution &amp; Reopening Notice</option>
              </select>
            </div>

            <div>
              <label className="block text-stone-300 font-semibold mb-1">Notice Headline</label>
              <input
                type="text"
                required
                placeholder="e.g. ROAD CLOSURE: NH-44 Panthyal Blocked"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-xl text-stone-100 text-xs focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-stone-300 font-semibold mb-1">Urgency Level</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as any)}
                  className="w-full px-2.5 py-2 bg-stone-800 border border-stone-700 rounded-xl text-stone-100 text-xs"
                >
                  <option value="critical">Critical (Evacuation / Block)</option>
                  <option value="warning">Warning (Severe Disruption)</option>
                  <option value="advisory">Advisory (General Caution)</option>
                </select>
              </div>

              <div>
                <label className="block text-stone-300 font-semibold mb-1">Target District</label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-2.5 py-2 bg-stone-800 border border-stone-700 rounded-xl text-stone-100 text-xs"
                >
                  <option value="Ramban">Ramban</option>
                  <option value="Doda">Doda</option>
                  <option value="Kishtwar">Kishtwar</option>
                  <option value="Shopian">Shopian</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-stone-300 font-semibold mb-1">Estimated Clearance / Resolution</label>
              <input
                type="text"
                placeholder="e.g. Expected restoration by 18:00 IST"
                value={estimatedResolution}
                onChange={(e) => setEstimatedResolution(e.target.value)}
                className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-xl text-stone-100 text-xs focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-stone-300 font-semibold mb-1">Official Message Body</label>
              <textarea
                rows={3}
                required
                placeholder="Write clear, verified guidance for travellers, settlements, and relief responders..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-xl text-stone-100 text-xs focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>

            <div className="flex items-center gap-2 p-2.5 bg-stone-950 border border-stone-800 rounded-xl">
              <input
                type="checkbox"
                id="telegramCheck"
                checked={includeTelegram}
                onChange={(e) => setIncludeTelegram(e.target.checked)}
                className="rounded text-red-600 focus:ring-red-500"
              />
              <label htmlFor="telegramCheck" className="text-stone-300 text-xs cursor-pointer">
                Simultaneously push to Telegram Bot (<strong>@AAPDA_JK_Disaster_Alerts</strong>)
              </label>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => handlePublishNotice(true)}
                className="flex-1 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl font-semibold transition-colors text-xs"
              >
                Save as Draft
              </button>

              <button
                type="submit"
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-lg transition-colors text-xs"
              >
                <Radio className="w-3.5 h-3.5" />
                Publish Publicly
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Public Notices Roster & Management */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-stone-100">Live &amp; Queued Public Notices</h2>
              <p className="text-xs text-stone-400">
                Authorized communications currently feeding the public ticker and Telegram.
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex bg-stone-900 border border-stone-800 rounded-lg p-0.5 text-xs font-semibold">
              {["all", "published", "draft", "withdrawn"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setFilterStatus(st)}
                  className={`px-2.5 py-1 rounded capitalize transition-all ${
                    filterStatus === st
                      ? "bg-red-600 text-white shadow-sm"
                      : "text-stone-400 hover:text-stone-200"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filteredNotices.map((n) => (
              <div
                key={n.id}
                className={`bg-stone-900 border rounded-2xl p-4 space-y-2.5 transition-colors ${
                  n.status === "published"
                    ? n.severity === "critical"
                      ? "border-red-600/50 bg-red-950/20"
                      : "border-stone-800"
                    : "border-stone-800/60 opacity-70"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-stone-400">{n.id}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        n.status === "published"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-stone-800 text-stone-400"
                      }`}
                    >
                      {n.status.toUpperCase()}
                    </span>
                    <span className="text-[10px] bg-stone-800 text-stone-300 px-2 py-0.5 rounded uppercase font-semibold">
                      {n.category.replace(/_/g, " ")}
                    </span>
                    <span className="text-[10px] text-stone-400 bg-stone-800/60 px-2 py-0.5 rounded">
                      {n.district}
                    </span>
                  </div>

                  <div className="text-[10px] text-stone-500">
                    {n.publishedAt ? `Published ${new Date(n.publishedAt).toLocaleTimeString()}` : "Not published yet"}
                  </div>
                </div>

                <h3 className="text-sm font-bold text-stone-100">{n.title}</h3>
                <p className="text-xs text-stone-300">{n.message}</p>

                {n.estimatedResolutionTime && (
                  <p className="text-[11px] text-amber-400">
                    ⏱️ Estimated Resolution: <strong>{n.estimatedResolutionTime}</strong>
                  </p>
                )}

                <div className="pt-2 border-t border-stone-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-400">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Signed by: <strong>{n.authorizedBy}</strong></span>
                  </div>

                  <div className="flex items-center gap-2">
                    {n.status === "published" ? (
                      <button
                        type="button"
                        onClick={() => handleUpdateNoticeStatus(n.id, "withdrawn")}
                        className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-amber-400 rounded text-xs transition-colors"
                      >
                        Withdraw Notice
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleUpdateNoticeStatus(n.id, "published")}
                        className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold transition-colors"
                      >
                        Publish Now
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleUpdateNoticeStatus(n.id, "archived")}
                      className="px-2 py-1 bg-stone-800 hover:bg-stone-700 text-stone-400 rounded text-xs transition-colors"
                    >
                      Archive
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
