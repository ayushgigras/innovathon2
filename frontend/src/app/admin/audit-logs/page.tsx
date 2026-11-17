"use client";

import React from "react";
import { ShieldCheck, Clock, FileText } from "lucide-react";

interface AuditEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  performedBy: string;
  details: string;
  timestamp: string;
}

const MOCK_AUDIT_LOGS: AuditEntry[] = [
  {
    id: "AUD-001",
    action: "ROAD_STATUS_OVERRIDE",
    entityType: "road_segment",
    entityId: "RD-001",
    performedBy: "Commander R. Sharma (DDMA Ramban)",
    details: "Changed status from OPEN to CLOSED due to physical debris confirmation at Panthyal.",
    timestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
  },
  {
    id: "AUD-002",
    action: "PUBLIC_NOTICE_BROADCAST",
    entityType: "public_notice",
    entityId: "PUB-001",
    performedBy: "Commander R. Sharma (DDMA Ramban)",
    details: "Dispatched Emergency Road Closure Notice to Web Banner & Telegram Bot channel.",
    timestamp: new Date(Date.now() - 34 * 60 * 1000).toISOString(),
  },
  {
    id: "AUD-003",
    action: "RELIEF_ALLOCATION_AUTHORIZED",
    entityType: "relief_request",
    entityId: "RR-001",
    performedBy: "Commander R. Sharma (DDMA Ramban)",
    details: "Approved 120 family food packs for Khari with route verification via Chanderkote.",
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
  },
  {
    id: "AUD-004",
    action: "CALL_TRANSCRIPT_INGESTED",
    entityType: "incident_report",
    entityId: "RPT-CALL-98A1",
    performedBy: "EOC Helpline Dispatcher",
    details: "Ingested verbal emergency transcript from +91-9419123456.",
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
];

export default function AdminAuditLogsPage(): React.ReactElement {
  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-stone-800">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <h1 className="text-lg font-bold text-stone-100">DDMA EOC Official Audit Logs</h1>
        </div>
        <p className="text-xs text-stone-400">
          Immutable cryptographic log of all administrator status overrides, public broadcasts, and relief authorizations.
        </p>
      </div>

      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-300 border-collapse">
            <thead>
              <tr className="border-b border-stone-800 text-stone-400 uppercase text-[10px]">
                <th className="py-2.5 px-3">Log ID</th>
                <th className="py-2.5 px-3">Action Type</th>
                <th className="py-2.5 px-3">Entity Reference</th>
                <th className="py-2.5 px-3">Authorized Officer</th>
                <th className="py-2.5 px-3">Details / Audit Note</th>
                <th className="py-2.5 px-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/60">
              {MOCK_AUDIT_LOGS.map((log) => (
                <tr key={log.id} className="hover:bg-stone-800/30">
                  <td className="py-3 px-3 font-mono text-[11px] text-stone-400">{log.id}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-800 text-emerald-400 border border-stone-700">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px] text-stone-300">
                    {log.entityType}: {log.entityId}
                  </td>
                  <td className="py-3 px-3 font-semibold text-stone-100">{log.performedBy}</td>
                  <td className="py-3 px-3 text-stone-400 text-xs max-w-sm">{log.details}</td>
                  <td className="py-3 px-3 text-stone-500 text-[11px] whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
