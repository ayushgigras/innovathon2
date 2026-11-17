import React from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { EmergencyAlertBanner } from "@/components/shared/EmergencyAlertBanner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <EmergencyAlertBanner />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
