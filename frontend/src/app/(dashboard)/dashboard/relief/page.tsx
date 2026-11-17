"use client";

import React, { useState } from "react";
import {
  Package,
  CheckCircle2,
  XCircle,
  Archive,
  Truck,
  AlertTriangle,
} from "lucide-react";
import { DemoBadge } from "@/components/shared/DemoBadge";
import { SeverityBadge } from "@/components/shared/SeverityBadge";
import { HumanConfirmModal } from "@/components/shared/HumanConfirmModal";
import {
  MOCK_RELIEF_REQUESTS,
  MOCK_RELIEF_ITEMS,
  MOCK_DELIVERIES,
} from "@/lib/api/mock-adapter";
import type { ReliefRequest, ReliefItem, Delivery } from "@/types";

type ReliefTab = "requests" | "inventory" | "allocations" | "deliveries";

export default function ReliefPage(): React.ReactElement {
  const [tab, setTab] = useState<ReliefTab>("requests");
  const [requests, setRequests] = useState<ReliefRequest[]>(MOCK_RELIEF_REQUESTS);
  const [modal, setModal] = useState<{
    open: boolean;
    action: "approve" | "reject";
    request: ReliefRequest | null;
  }>({ open: false, action: "approve", request: null });

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const allocationRequests = requests.filter(
    (r) => r.status === "pending" && r.aiAllocationSuggestion
  );

  const handleConfirm = (): void => {
    if (!modal.request) return;
    const newStatus = modal.action === "approve" ? "approved" : "rejected";
    setRequests((prev) =>
      prev.map((r) => r.id === modal.request!.id ? { ...r, status: newStatus } : r)
    );
    setModal({ open: false, action: "approve", request: null });
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Package className="w-6 h-6 text-emerald-400" />
          <div>
            <h1 className="text-2xl font-bold text-slate-100">RahatGrid</h1>
            <p className="text-slate-400 text-sm">Relief coordination, inventory &amp; allocation</p>
          </div>
        </div>
        <DemoBadge variant="banner" />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SmallStat label="Pending Requests" value={pendingRequests.length} color="text-orange-400" />
        <SmallStat label="Total Requests" value={requests.length} color="text-slate-300" />
        <SmallStat label="With AI Suggestion" value={allocationRequests.length} color="text-purple-400" />
        <SmallStat label="In Transit" value={MOCK_DELIVERIES.filter((d) => d.status === "in_transit").length} color="text-blue-400" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl w-fit flex-wrap">
        {(["requests", "inventory", "allocations", "deliveries"] as ReliefTab[]).map((t) => {
          const labels: Record<ReliefTab, string> = {
            requests: `Requests (${requests.length})`,
            inventory: `Inventory (${MOCK_RELIEF_ITEMS.length})`,
            allocations: `Allocations (${allocationRequests.length})`,
            deliveries: `Deliveries (${MOCK_DELIVERIES.length})`,
          };
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              {labels[t]}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {tab === "requests" && (
        <RequestsList
          requests={requests}
          onApprove={(r) => setModal({ open: true, action: "approve", request: r })}
          onReject={(r) => setModal({ open: true, action: "reject", request: r })}
        />
      )}
      {tab === "inventory" && <InventoryTable items={MOCK_RELIEF_ITEMS} />}
      {tab === "allocations" && (
        <AllocationsPanel
          requests={allocationRequests}
          onApprove={(r) => setModal({ open: true, action: "approve", request: r })}
        />
      )}
      {tab === "deliveries" && <DeliveriesTable deliveries={MOCK_DELIVERIES} />}

      {/* Human Confirm Modal */}
      <HumanConfirmModal
        isOpen={modal.open}
        onClose={() => setModal({ open: false, action: "approve", request: null })}
        onConfirm={handleConfirm}
        title={modal.action === "approve" ? "Approve Relief Request" : "Reject Relief Request"}
        aiReasoning={
          modal.request?.aiAllocationSuggestion
            ? `AI feasibility score: ${Math.round(modal.request.aiAllocationSuggestion.feasibilityScore * 100)}%. Suggested items: ${modal.request.aiAllocationSuggestion.suggestedItems.map((i) => i.rationale).join(" | ")}`
            : `Priority: ${modal.request?.priority ?? "unknown"}. No AI allocation suggestion available. Human judgment required.`
        }
        confirmLabel={modal.action === "approve" ? "Approve Allocation" : "Reject Request"}
        variant={modal.action === "approve" ? "allocate" : "reject"}
      />
    </div>
  );
}

// ─── Requests List ────────────────────────────────────────────────────────────

function RequestsList({
  requests,
  onApprove,
  onReject,
}: {
  requests: ReliefRequest[];
  onApprove: (r: ReliefRequest) => void;
  onReject: (r: ReliefRequest) => void;
}): React.ReactElement {
  return (
    <div className="space-y-3">
      {requests.map((req) => (
        <div
          key={req.id}
          className={`bg-slate-900 border rounded-xl p-4 space-y-3 ${
            req.priority === "critical" ? "border-red-500/30" : "border-slate-800"
          }`}
        >
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-slate-400 font-mono text-xs">{req.id}</span>
                <SeverityBadge severity={req.priority} />
                <ReliefStatusBadge status={req.status} />
              </div>
              <p className="text-slate-100 font-semibold mt-1">{req.settlementName}</p>
              <p className="text-slate-400 text-xs">{req.district} · Requested by {req.requestedBy} · {formatRelative(req.createdAt)}</p>
            </div>
            {req.status === "pending" && (
              <div className="flex gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => onApprove(req)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-medium transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                </button>
                <button
                  type="button"
                  onClick={() => onReject(req)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-xs font-medium transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" /> Reject
                </button>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="flex flex-wrap gap-2">
            {req.items.map((item) => (
              <span
                key={item.itemId}
                className="text-xs px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-300"
              >
                {item.name} × {item.quantityRequested}
                {item.quantityApproved !== undefined && ` (approved: ${item.quantityApproved})`}
              </span>
            ))}
          </div>

          {/* AI Suggestion */}
          {req.aiAllocationSuggestion && (
            <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-3 space-y-1.5">
              <p className="text-purple-400 text-xs font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                AI Recommendation — Requires Human Review
                <DemoBadge />
              </p>
              <p className="text-xs text-slate-400">
                Feasibility score: <span className="text-purple-300 font-medium">{Math.round(req.aiAllocationSuggestion.feasibilityScore * 100)}%</span>
              </p>
              {req.aiAllocationSuggestion.suggestedItems.map((si) => (
                <p key={si.itemId} className="text-xs text-slate-400">• {si.rationale}</p>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Inventory Table ──────────────────────────────────────────────────────────

function InventoryTable({ items }: { items: ReliefItem[] }): React.ReactElement {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 p-4 border-b border-slate-800">
        <Archive className="w-4 h-4 text-slate-400" />
        <h2 className="text-slate-200 font-semibold text-sm">Inventory Stock</h2>
        <DemoBadge />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm" aria-label="Inventory">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="px-4 py-3 text-left text-slate-400 font-medium text-xs uppercase tracking-wide">Item</th>
              <th className="px-4 py-3 text-left text-slate-400 font-medium text-xs uppercase tracking-wide">Category</th>
              <th className="px-4 py-3 text-left text-slate-400 font-medium text-xs uppercase tracking-wide">Available</th>
              <th className="px-4 py-3 text-left text-slate-400 font-medium text-xs uppercase tracking-wide">Reserved</th>
              <th className="px-4 py-3 text-left text-slate-400 font-medium text-xs uppercase tracking-wide">Free</th>
              <th className="px-4 py-3 text-left text-slate-400 font-medium text-xs uppercase tracking-wide">Warehouse</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {items.map((item) => {
              const free = item.quantityAvailable - item.quantityReserved;
              const pct = Math.round((item.quantityReserved / item.quantityAvailable) * 100);
              return (
                <tr key={item.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-slate-200 font-medium">{item.name}</p>
                    <p className="text-slate-500 text-xs">{item.unit}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="capitalize text-slate-300 text-xs">{item.category}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-200 font-mono">{item.quantityAvailable.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div>
                      <span className="text-orange-400 font-mono">{item.quantityReserved}</span>
                      <div className="w-20 h-1 bg-slate-700 rounded-full mt-1 overflow-hidden">
                        <div
                          className="h-full bg-orange-400 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-mono font-semibold ${free < 100 ? "text-red-400" : "text-emerald-400"}`}>
                      {free.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 font-mono text-xs">{item.warehouseId}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Allocations Panel ────────────────────────────────────────────────────────

function AllocationsPanel({
  requests,
  onApprove,
}: {
  requests: ReliefRequest[];
  onApprove: (r: ReliefRequest) => void;
}): React.ReactElement {
  if (requests.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p>No pending AI allocation recommendations.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
        <p className="text-amber-400 text-xs">
          <strong>AI Recommendation — Requires Human Review.</strong> The AI system suggests these allocations based on population, supply history and road accessibility. No allocation is dispatched without an authorised DDMA officer&apos;s explicit approval.
        </p>
      </div>
      {requests.map((req) => (
        <AllocationCard key={req.id} request={req} onApprove={onApprove} />
      ))}
    </div>
  );
}

function AllocationCard({
  request,
  onApprove,
}: {
  request: ReliefRequest;
  onApprove: (r: ReliefRequest) => void;
}): React.ReactElement {
  const suggestion = request.aiAllocationSuggestion!;
  return (
    <div className="bg-slate-900 border border-purple-500/20 rounded-xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-slate-100 font-semibold">{request.settlementName}</h3>
          <p className="text-slate-400 text-xs">{request.district} · {request.id}</p>
        </div>
        <SeverityBadge severity={request.priority} />
      </div>

      {/* AI suggestion */}
      <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-purple-400 text-xs font-semibold uppercase tracking-wide">
            AI Allocation Recommendation
          </p>
          <div className="flex items-center gap-2">
            <span className="text-purple-300 text-sm font-bold">
              {Math.round(suggestion.feasibilityScore * 100)}%
            </span>
            <span className="text-purple-400 text-xs">feasibility</span>
            <DemoBadge />
          </div>
        </div>
        <div className="space-y-2">
          {suggestion.suggestedItems.map((si) => (
            <div key={si.itemId} className="text-xs text-slate-400">
              <span className="text-slate-200 font-medium">× {si.quantity}</span> — {si.rationale}
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onApprove(request)}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors"
      >
        <CheckCircle2 className="w-4 h-4" />
        Review &amp; Approve Allocation
      </button>
    </div>
  );
}

// ─── Deliveries Table ─────────────────────────────────────────────────────────

function DeliveriesTable({ deliveries }: { deliveries: Delivery[] }): React.ReactElement {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 p-4 border-b border-slate-800">
        <Truck className="w-4 h-4 text-blue-400" />
        <h2 className="text-slate-200 font-semibold text-sm">Delivery Tracking</h2>
        <DemoBadge />
      </div>
      {deliveries.length === 0 ? (
        <div className="p-10 text-center text-slate-500">No active deliveries.</div>
      ) : (
        <div className="divide-y divide-slate-800">
          {deliveries.map((del) => (
            <div key={del.id} className="p-4 space-y-2">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <span className="text-slate-400 font-mono text-xs">{del.id}</span>
                  <p className="text-slate-100 font-semibold">{del.settlementName}</p>
                  <p className="text-slate-400 text-xs">{del.district}</p>
                </div>
                <DeliveryStatusBadge status={del.status} />
              </div>
              <div className="text-xs text-slate-400 space-y-0.5">
                {del.driverName && <p>Driver: <span className="text-slate-300">{del.driverName}</span></p>}
                {del.vehicleId && <p>Vehicle: <span className="text-slate-300 font-mono">{del.vehicleId}</span></p>}
                <p>Scheduled: <span className="text-slate-300">{formatRelative(del.scheduledAt)} ago</span></p>
              </div>
              <div className="flex flex-wrap gap-2">
                {del.items.map((item) => (
                  <span key={item.name} className="text-xs px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300">
                    {item.name} × {item.quantity}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SmallStat({ label, value, color }: { label: string; value: number; color: string }): React.ReactElement {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-slate-500 text-xs mt-0.5">{label}</p>
    </div>
  );
}

function ReliefStatusBadge({ status }: { status: string }): React.ReactElement {
  const map: Record<string, string> = {
    pending: "bg-orange-500/10 text-orange-400 border-orange-500/30",
    approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    in_transit: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    delivered: "bg-slate-500/10 text-slate-400 border-slate-500/30",
    rejected: "bg-red-500/10 text-red-400 border-red-500/30",
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded border text-xs font-medium capitalize ${map[status] ?? "bg-slate-500/10 text-slate-400 border-slate-500/30"}`}>
      {status.replace("_", " ")}
    </span>
  );
}

function DeliveryStatusBadge({ status }: { status: string }): React.ReactElement {
  const map: Record<string, string> = {
    scheduled: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    in_transit: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    delivered: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    failed: "bg-red-500/10 text-red-400 border-red-500/30",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-semibold uppercase tracking-wide ${map[status] ?? "bg-slate-500/10 text-slate-400 border-slate-500/30"}`}>
      {status === "in_transit" && <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" />}
      {status.replace("_", " ")}
    </span>
  );
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}
