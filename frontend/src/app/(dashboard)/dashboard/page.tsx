import React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  MapPin,
  Users,
  Map,
  ArrowRight,
  ShieldAlert,
  Search,
  CheckCircle2,
  Radio,
} from "lucide-react";
import { computeDemoStats, MOCK_INCIDENTS, MOCK_ROADS, MOCK_ALERTS } from "@/lib/api/mock-adapter";

export default function DashboardPage(): React.ReactElement {
  const stats = computeDemoStats();
  const recentIncidents = MOCK_INCIDENTS.slice(0, 4);
  const activeAlert = MOCK_ALERTS[0];

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">AAPDA Grid — Citizen Portal</h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time disaster intelligence, mountain road closures &amp; citizen reporting for Jammu &amp; Kashmir
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/roads"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-md"
          >
            <Map className="w-3.5 h-3.5" />
            Open Live GIS Map
          </Link>
          <Link
            href="/dashboard/incidents/report"
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-md"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Report Incident
          </Link>
        </div>
      </div>

      {/* Official Alert Banner if active */}
      {activeAlert && (
        <div className="p-4 bg-red-950/40 border border-red-600/50 rounded-2xl space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold uppercase text-red-400">
            <span className="flex items-center gap-1.5">
              <Radio className="w-4 h-4 animate-pulse" />
              Official Emergency Broadcast
            </span>
            <span className="bg-red-600 text-white px-2 py-0.2 rounded text-[10px]">VERIFIED DDMA</span>
          </div>
          <h3 className="font-bold text-sm text-stone-100">{activeAlert.title}</h3>
          <p className="text-xs text-red-200">{activeAlert.message}</p>
          <div className="pt-1 flex items-center justify-between text-[11px] text-red-300/80">
            <span>District: <strong>{activeAlert.district}</strong></span>
            <Link href="/dashboard/roads" className="underline font-semibold hover:text-white">
              View Diversion Route on Map →
            </Link>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Active Hazards"
          value={stats.totalIncidents}
          sub={`${stats.criticalIncidents} critical`}
          icon={AlertTriangle}
          iconColor="text-red-400"
          cardColor="border-red-500/20"
          href="/dashboard/roads"
        />
        <SummaryCard
          title="Road Closures"
          value={stats.roadsClosed}
          sub={`${stats.roadsPartiallyOpen} partial`}
          icon={Map}
          iconColor="text-orange-400"
          cardColor="border-orange-500/20"
          href="/dashboard/roads"
        />
        <SummaryCard
          title="Cut-Off Villages"
          value={stats.isolatedSettlements}
          sub="awaiting clearance"
          icon={Users}
          iconColor="text-purple-400"
          cardColor="border-purple-500/20"
          href="/dashboard/roads/settlements"
        />
        <SummaryCard
          title="Citizen Tracking"
          value="Track"
          sub="check report ID"
          icon={Search}
          iconColor="text-emerald-400"
          cardColor="border-emerald-500/20"
          href="/track"
        />
      </div>

      {/* Citizen Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CitizenFeatureCard
          title="Live Mountain Road Map"
          description="Interactive satellite & street view showing road-following closures, landslides, and calculated Mughal Road bypass routes."
          icon={Map}
          actionLabel="Explore Mountain Corridors"
          href="/dashboard/roads"
        />
        <CitizenFeatureCard
          title="Citizen Incident Reporting"
          description="Submit eyewitness reports for landslides, floods, or blocked roads. Instant Report ID generated to track DDMA review."
          icon={AlertTriangle}
          actionLabel="File a Disaster Report"
          href="/dashboard/incidents/report"
        />
        <CitizenFeatureCard
          title="Track Report Status"
          description="Check official review progression from submission to field verification and emergency road response."
          icon={Search}
          actionLabel="Track Your Report ID"
          href="/track"
        />
      </div>

      {/* Recent Public Incidents */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-slate-100 font-bold text-sm flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            Reported Disasters in Jammu &amp; Kashmir
          </h2>
          <Link
            href="/dashboard/roads"
            className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
          >
            View on Live Map <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="space-y-2">
          {recentIncidents.map((inc) => (
            <Link
              key={inc.id}
              href="/dashboard/roads"
              className="flex items-center justify-between gap-4 p-3 bg-slate-950/60 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full ${inc.severity === "critical" ? "bg-red-500" : "bg-amber-500"}`} />
                <div>
                  <p className="text-slate-200 text-xs font-bold">{inc.title}</p>
                  <p className="text-slate-500 text-[11px]">{inc.district} Sector · {new Date(inc.reportedAt).toLocaleTimeString()}</p>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                inc.status === "verified" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
              }`}>
                {inc.status.replace("_", " ")}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  sub,
  icon: Icon,
  iconColor,
  cardColor,
  href,
}: {
  title: string;
  value: number | string;
  sub: string;
  icon: React.ElementType;
  iconColor: string;
  cardColor: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className={`block p-4 rounded-2xl bg-slate-900 border ${cardColor} hover:border-slate-700 transition-all shadow-md group`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400 font-semibold">{title}</span>
        <Icon className={`w-4 h-4 ${iconColor} group-hover:scale-110 transition-transform`} />
      </div>
      <p className="text-2xl font-black text-slate-100 mt-2">{value}</p>
      <p className="text-[11px] text-slate-500 mt-0.5">{sub}</p>
    </Link>
  );
}

function CitizenFeatureCard({
  title,
  description,
  icon: Icon,
  actionLabel,
  href,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  actionLabel: string;
  href: string;
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-3 shadow-md">
      <div className="space-y-2">
        <div className="p-2.5 bg-slate-800 w-fit rounded-xl text-emerald-400">
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="font-bold text-sm text-slate-100">{title}</h3>
        <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
      </div>

      <Link
        href={href}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 pt-1"
      >
        <span>{actionLabel}</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
