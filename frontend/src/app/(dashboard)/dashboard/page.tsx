import React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  MapPin,
  Package,
  Users,
  Eye,
  Map,
  ArrowRight,
  ShieldAlert,
  Truck,
} from "lucide-react";
import { DemoBadge } from "@/components/shared/DemoBadge";
import { computeDemoStats, MOCK_INCIDENTS, MOCK_ROADS, MOCK_RELIEF_REQUESTS } from "@/lib/api/mock-adapter";

export default function DashboardPage(): React.ReactElement {
  const stats = computeDemoStats();
  const recentIncidents = MOCK_INCIDENTS.slice(0, 3);
  const closedRoads = MOCK_ROADS.filter((r) => r.status === "closed" || r.status === "partially_open");

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">AAPDA Grid — Overview</h1>
          <p className="text-slate-400 text-sm mt-1">
            AI-assisted disaster intelligence for Jammu &amp; Kashmir
          </p>
        </div>
        <DemoBadge variant="banner" className="shrink-0 max-w-xs" />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Active Incidents"
          value={stats.totalIncidents}
          sub={`${stats.criticalIncidents} critical`}
          icon={AlertTriangle}
          iconColor="text-red-400"
          cardColor="border-red-500/20"
          href="/dashboard/incidents"
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
          title="Isolated Settlements"
          value={stats.isolatedSettlements}
          sub="cut off"
          icon={Users}
          iconColor="text-purple-400"
          cardColor="border-purple-500/20"
          href="/dashboard/roads/settlements"
        />
        <SummaryCard
          title="Pending Relief"
          value={stats.pendingReliefRequests}
          sub="requests"
          icon={Package}
          iconColor="text-emerald-400"
          cardColor="border-emerald-500/20"
          href="/dashboard/relief"
        />
      </div>

      {/* Module Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ModuleCard
          name="AAPDA Lens"
          description="Incident deduplication, evidence review, uncertainty scores and human verification queue."
          icon={Eye}
          href="/dashboard/incidents"
          stats={[
            { label: "Reported", value: stats.incidentsByStatus.reported ?? 0 },
            { label: "Under Review", value: stats.incidentsByStatus.under_review ?? 0 },
            { label: "Verified", value: stats.incidentsByStatus.verified ?? 0 },
          ]}
        />
        <ModuleCard
          name="MargRakshak"
          description="Mountain-road closure map, alternate routes and disconnected settlement access tracking."
          icon={Map}
          href="/dashboard/roads"
          stats={[
            { label: "Closed Roads", value: stats.roadsClosed },
            { label: "Partial", value: stats.roadsPartiallyOpen },
            { label: "Settlements Cut Off", value: stats.isolatedSettlements },
          ]}
        />
        <ModuleCard
          name="RahatGrid"
          description="Relief request prioritisation, inventory status, AI allocation recommendations and delivery tracking."
          icon={Package}
          href="/dashboard/relief"
          stats={[
            { label: "Pending Requests", value: stats.pendingReliefRequests },
            { label: "Total Requests", value: MOCK_RELIEF_REQUESTS.length },
            { label: "In Transit", value: 1 },
          ]}
        />
      </div>

      {/* Recent Incidents */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-slate-200 font-semibold text-sm flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            Recent Incidents
          </h2>
          <Link
            href="/dashboard/incidents"
            className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
          >
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="space-y-2">
          {recentIncidents.map((inc) => (
            <Link
              key={inc.id}
              href={`/dashboard/incidents`}
              className="flex items-center gap-4 p-3 bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors"
            >
              <SeverityDot severity={inc.severity} />
              <div className="flex-1 min-w-0">
                <p className="text-slate-200 text-sm font-medium truncate">{inc.title}</p>
                <p className="text-slate-500 text-xs">{inc.district} · {formatRelative(inc.reportedAt)}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded border ${statusColor(inc.status)}`}>
                {inc.status.replace("_", " ")}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Road Alerts */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-slate-200 font-semibold text-sm flex items-center gap-2">
            <MapPin className="w-4 h-4 text-orange-400" />
            Road Alerts
          </h2>
          <Link
            href="/dashboard/roads"
            className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
          >
            View map <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="space-y-2">
          {closedRoads.map((road) => (
            <div
              key={road.id}
              className="flex items-center gap-4 p-3 bg-slate-900 border border-slate-800 rounded-lg"
            >
              <Truck className={`w-4 h-4 flex-shrink-0 ${road.status === "closed" ? "text-red-400" : "text-orange-400"}`} />
              <div className="flex-1 min-w-0">
                <p className="text-slate-200 text-sm font-medium truncate">{road.name}</p>
                <p className="text-slate-500 text-xs">{road.closureReason} · {road.district}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded border ${road.status === "closed" ? "bg-red-500/10 text-red-400 border-red-500/30" : "bg-orange-500/10 text-orange-400 border-orange-500/30"}`}>
                {road.status === "closed" ? "Closed" : "Partial"}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ─── Helper Sub-components ────────────────────────────────────────────────────

interface SummaryCardProps {
  title: string;
  value: number;
  sub: string;
  icon: React.ElementType;
  iconColor: string;
  cardColor: string;
  href: string;
}

function SummaryCard({ title, value, sub, icon: Icon, iconColor, cardColor, href }: SummaryCardProps): React.ReactElement {
  return (
    <Link
      href={href}
      className={`flex flex-col gap-3 p-4 bg-slate-900 border ${cardColor} rounded-xl hover:bg-slate-800/80 transition-colors group`}
    >
      <div className="flex items-center justify-between">
        <span className="text-slate-400 text-xs font-medium uppercase tracking-wide">{title}</span>
        <Icon className={`w-4 h-4 ${iconColor}`} aria-hidden="true" />
      </div>
      <div>
        <p className="text-3xl font-bold text-slate-100">{value}</p>
        <p className="text-slate-500 text-xs mt-0.5">{sub}</p>
      </div>
      <DemoBadge />
    </Link>
  );
}

interface ModuleCardProps {
  name: string;
  description: string;
  icon: React.ElementType;
  href: string;
  stats: { label: string; value: number }[];
}

function ModuleCard({ name, description, icon: Icon, href, stats }: ModuleCardProps): React.ReactElement {
  return (
    <Link
      href={href}
      className="flex flex-col gap-4 p-5 bg-slate-900 border border-slate-800 rounded-xl hover:border-emerald-500/30 hover:bg-slate-800/60 transition-all group"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-emerald-500/10 rounded-lg">
          <Icon className="w-5 h-5 text-emerald-400" aria-hidden="true" />
        </div>
        <h3 className="text-slate-100 font-semibold">{name}</h3>
      </div>
      <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
      <div className="grid grid-cols-3 gap-2 mt-auto">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <p className="text-xl font-bold text-slate-100">{s.value}</p>
            <p className="text-slate-500 text-[10px] leading-tight">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1 text-emerald-400 text-xs font-medium group-hover:gap-2 transition-all">
        Open module <ArrowRight className="w-3 h-3" />
      </div>
    </Link>
  );
}

function SeverityDot({ severity }: { severity: string }): React.ReactElement {
  const colors: Record<string, string> = {
    critical: "bg-red-500",
    high: "bg-orange-500",
    medium: "bg-yellow-500",
    low: "bg-blue-500",
  };
  return <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${colors[severity] ?? "bg-slate-500"}`} />;
}

function statusColor(status: string): string {
  const map: Record<string, string> = {
    reported: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    under_review: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    verified: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    closed: "bg-slate-500/10 text-slate-400 border-slate-500/30",
    duplicate: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  };
  return map[status] ?? "bg-slate-500/10 text-slate-400 border-slate-500/30";
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
