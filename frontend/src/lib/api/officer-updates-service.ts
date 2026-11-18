export interface OfficerDisasterUpdate {
  id: string;
  title: string;
  message: string;
  officerName: string;
  district: string;
  operationType: "Machinery Clearance" | "Food & Water Relief" | "Medical Aid" | "Road Reopening" | "General Advisory";
  timestamp: string;
  read: boolean;
}

const STORAGE_KEY = "aapda_field_updates";

export const INITIAL_OFFICER_UPDATES: OfficerDisasterUpdate[] = [
  {
    id: "UPD-001",
    title: "JCB 3DX & BRO Excavators Commenced Rock Clearing at Panthyal",
    message: "Two heavy earthmovers from Chanderkote BRO base are actively clearing 50-meter boulder debris at Km 144.2. SDRF team on ground. Expected single-lane movement for light vehicles in 45 minutes.",
    officerName: "Officer S. Manhas (Disaster Response Lead)",
    district: "Ramban",
    operationType: "Machinery Clearance",
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    read: false,
  },
  {
    id: "UPD-002",
    title: "Emergency Food & Drinking Water Dispatched to 40 Stranded Vehicles",
    message: "District administration relief team has distributed 120 dry ration kits and bottled water to families stranded between Ramban and Ramsu. First aid station established at Seri.",
    officerName: "Inspector K. Rathore (Relief Logistics)",
    district: "Ramban",
    operationType: "Food & Water Relief",
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    read: false,
  },
  {
    id: "UPD-003",
    title: "University of Jammu & Tawi Bridge Corridor Clear & Monitored",
    message: "Jammu sector inspection completed by quick reaction patrol. Road connectivity along Tawi River and NH-44 Nagrota bypass is completely safe and normal.",
    officerName: "Command Post Jammu (Traffic Control)",
    district: "Jammu",
    operationType: "General Advisory",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    read: true,
  },
];

export function getOfficerUpdates(): OfficerDisasterUpdate[] {
  if (typeof window === "undefined") return INITIAL_OFFICER_UPDATES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_OFFICER_UPDATES));
      return INITIAL_OFFICER_UPDATES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return INITIAL_OFFICER_UPDATES;
  } catch (err) {
    console.error("Failed to read officer updates:", err);
    return INITIAL_OFFICER_UPDATES;
  }
}

export function sendOfficerUpdate(data: {
  title: string;
  message: string;
  officerName: string;
  district: string;
  operationType: OfficerDisasterUpdate["operationType"];
}): OfficerDisasterUpdate {
  const current = getOfficerUpdates();
  const newUpdate: OfficerDisasterUpdate = {
    id: `UPD-${Date.now().toString().slice(-6)}`,
    title: data.title.trim(),
    message: data.message.trim(),
    officerName: data.officerName.trim() || "Field Incident Officer",
    district: data.district || "Ramban",
    operationType: data.operationType || "Machinery Clearance",
    timestamp: new Date().toISOString(),
    read: false, // New updates are unread to trigger the red dot on the bell!
  };

  const updated = [newUpdate, ...current];
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("aapda_notification_received", { detail: newUpdate }));
    window.dispatchEvent(new CustomEvent("aapda_field_updates_updated", { detail: updated }));
    window.dispatchEvent(new Event("storage"));
  }

  return newUpdate;
}

export function markAllUpdatesRead(): void {
  if (typeof window === "undefined") return;
  const current = getOfficerUpdates();
  const updated = current.map((u) => ({ ...u, read: true }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent("aapda_field_updates_updated", { detail: updated }));
  window.dispatchEvent(new Event("storage"));
}

export function markUpdateRead(id: string): void {
  if (typeof window === "undefined") return;
  const current = getOfficerUpdates();
  const updated = current.map((u) => (u.id === id ? { ...u, read: true } : u));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent("aapda_field_updates_updated", { detail: updated }));
  window.dispatchEvent(new Event("storage"));
}

export function deleteOfficerUpdate(id: string): void {
  if (typeof window === "undefined") return;
  const current = getOfficerUpdates();
  const updated = current.filter((u) => u.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent("aapda_field_updates_updated", { detail: updated }));
  window.dispatchEvent(new Event("storage"));
}

export function getUnreadUpdatesCount(): number {
  const updates = getOfficerUpdates();
  return updates.filter((u) => !u.read).length;
}
