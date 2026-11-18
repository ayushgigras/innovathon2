// RahatGrid Relief Allocation & Heavy Machinery Dispatch Engine

export interface MachineryVehicle {
  id: string;
  name: string;
  type: "jcb" | "truck_4x4" | "ambulance" | "crane" | "patrol";
  plateNumber: string;
  operatorName: string;
  baseDepot: string;
  status: "available" | "dispatched" | "maintenance";
  capacity: string;
  fuelLevel: number;
}

export interface InventorySupply {
  id: string;
  name: string;
  category: "food" | "water" | "medicine" | "shelter" | "force";
  unit: string;
  available: number;
  reserved: number;
  baseDepot: string;
  iconName: string;
}

export interface LiveGPSProgress {
  currentLat: number;
  currentLng: number;
  originName: string;
  originCoords: { lat: number; lng: number };
  destinationName: string;
  destinationCoords: { lat: number; lng: number };
  speedKmh: number;
  progressPercent: number; // 0 to 100
  etaMinutes: number;
  distanceKmRemaining: number;
  lastPingTime: string;
  radioTelemetry: string;
}

export interface ReliefSOSRequest {
  id: string;
  settlementName: string;
  district: string;
  targetCoords: { lat: number; lng: number };
  requestedBy: string;
  officerRank: string;
  officerUnit: string;
  priority: "critical" | "high" | "moderate";
  status: "pending" | "approved" | "dispatched" | "delivered";
  situationDescription: string;
  requestedSupplies: {
    foodKits: number;
    waterCans: number;
    medicalKits: number;
    thermalBlankets: number;
    requireJcb: boolean;
    requireForce: boolean;
    requireAmbulance: boolean;
  };
  createdAt: string;
}

export interface ConvoyDispatch {
  id: string;
  requestId: string;
  destinationName: string;
  district: string;
  status: "in_transit" | "at_scene" | "delivered";
  assignedVehicles: MachineryVehicle[];
  assignedForce: string;
  dispatchedSupplies: { name: string; quantity: number }[];
  gps: LiveGPSProgress;
  dispatchedAt: string;
  deliveredAt?: string;
}

// ── Default Fleets & Inventory ───────────────────────────────────────────────

export const DEFAULT_MACHINERY_FLEET: MachineryVehicle[] = [
  {
    id: "JCB-01",
    name: "JCB 3DX Heavy Excavator & Loader",
    type: "jcb",
    plateNumber: "JK-19-JCB-4011",
    operatorName: "Vikram Singh (Senior Excavator Specialist)",
    baseDepot: "Chanderkote BRO Forward Base",
    status: "available",
    capacity: "1.8m³ Heavy Bucket · Boulder displacement & rock excavation",
    fuelLevel: 94,
  },
  {
    id: "JCB-02",
    name: "JCB 432ZX Wheel Rock Loader",
    type: "jcb",
    plateNumber: "JK-19-JCB-8820",
    operatorName: "Farooq Dar (Heavy Plant Operator)",
    baseDepot: "Banihal Tunnel Maintenance Yard",
    status: "dispatched",
    capacity: "2.5m³ High-capacity aggregate scoop",
    fuelLevel: 78,
  },
  {
    id: "TRK-04",
    name: "Tata 4x4 All-Terrain Mountain Supply Truck",
    type: "truck_4x4",
    plateNumber: "JK-02-AT-9031",
    operatorName: "Tariq Butt (Convoy Driver Lead)",
    baseDepot: "Ramban Civil Supplies Warehouse",
    status: "available",
    capacity: "4.5 Metric Ton cargo payload · High ground clearance",
    fuelLevel: 88,
  },
  {
    id: "AMB-02",
    name: "Mahindra 4WD Mountain Ambulance (ALS)",
    type: "ambulance",
    plateNumber: "JK-19-AM-1080",
    operatorName: "Paramedic S. Roy & Driver Kuldeep",
    baseDepot: "District Hospital Batote",
    status: "available",
    capacity: "2 Stretcher trauma bay · Portable ventilator & oxygen",
    fuelLevel: 96,
  },
  {
    id: "CRN-01",
    name: "Hydraulic Heavy Boom Crane 25-Ton",
    type: "crane",
    plateNumber: "JK-14-CR-5502",
    operatorName: "Chief Engineer Gurmeet Singh",
    baseDepot: "Udhampur BRO Mechanical Depot",
    status: "available",
    capacity: "25-Ton vertical boom hoist · Vehicle extrication",
    fuelLevel: 82,
  },
  {
    id: "PAT-03",
    name: "SDRF Tactical Rescue Carrier (Force Patrol)",
    type: "patrol",
    plateNumber: "JK-02-SR-2201",
    operatorName: "Inspector R. Verma (SDRF Mountain Unit)",
    baseDepot: "Ramban SDRF Command Post",
    status: "available",
    capacity: "8 Tactical rescue commandos + hydraulic cutter & ropes",
    fuelLevel: 90,
  },
];

export const DEFAULT_SUPPLIES_INVENTORY: InventorySupply[] = [
  {
    id: "INV-001",
    name: "Family Dry Ration Kits",
    category: "food",
    unit: "Kit (7-day supply)",
    available: 1200,
    reserved: 150,
    baseDepot: "Ramban Central Supply Hub",
    iconName: "Apple",
  },
  {
    id: "INV-002",
    name: "Drinking Water (20L Cans)",
    category: "water",
    unit: "Canister",
    available: 850,
    reserved: 80,
    baseDepot: "Chanderkote Water Treatment Post",
    iconName: "Droplet",
  },
  {
    id: "INV-003",
    name: "Emergency Trauma & Medical Kits",
    category: "medicine",
    unit: "Medical Kit",
    available: 340,
    reserved: 35,
    baseDepot: "Batote Regional Health Warehouse",
    iconName: "Cross",
  },
  {
    id: "INV-004",
    name: "Thermal Mountain Blankets",
    category: "shelter",
    unit: "Piece",
    available: 1450,
    reserved: 200,
    baseDepot: "Ramban Civil Supplies Warehouse",
    iconName: "Shield",
  },
  {
    id: "INV-005",
    name: "SDRF Tactical Mountain Force",
    category: "force",
    unit: "Rescue Squad (8 officers)",
    available: 4,
    reserved: 1,
    baseDepot: "Ramban SDRF Garrison",
    iconName: "Users",
  },
];

export const INITIAL_SOS_REQUEST: ReliefSOSRequest = {
  id: "REQ-SOS-PANTHYAL",
  settlementName: "NH-44 Panthyal Landslide Zone (Km 144.2)",
  district: "Ramban",
  targetCoords: { lat: 33.244, lng: 75.258 },
  requestedBy: "Officer S. Manhas",
  officerRank: "Sub-Inspector / Disaster Response Lead",
  officerUnit: "Highway Patrol Unit 4 (Panthyal Approach)",
  priority: "critical",
  status: "pending",
  situationDescription:
    "URGENT FIELD OFFICER SOS: 80+ passengers and 24 vehicles stranded between landslide cones. 2 elderly citizens require immediate hypothermia medical care. Both lanes obstructed by 4-ton limestone boulders. Immediate dispatch of 1x JCB 3DX for boulder clearance, 1x 4x4 Relief Truck with food/water, and SDRF Force Unit required.",
  requestedSupplies: {
    foodKits: 120,
    waterCans: 80,
    medicalKits: 20,
    thermalBlankets: 150,
    requireJcb: true,
    requireForce: true,
    requireAmbulance: true,
  },
  createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
};

// ── GPS Route Waypoints (Chanderkote Depot to Panthyal Scene) ─────────────────

export const CONVOY_ROUTE_WAYPOINTS = [
  { lat: 33.210, lng: 75.240, progress: 0, desc: "Departing Chanderkote Supply Depot Gate" },
  { lat: 33.219, lng: 75.248, progress: 25, desc: "Negotiating Rajgarh Ridge Mountain Spine" },
  { lat: 33.228, lng: 75.253, progress: 50, desc: "Traversing Khari Bypass Corridors (Speed 35 km/h)" },
  { lat: 33.236, lng: 75.256, progress: 75, desc: "Descending toward Ramsu Approach Junction" },
  { lat: 33.244, lng: 75.258, progress: 100, desc: "Arrived at Panthyal Scene - Handover to Officer S. Manhas" },
];

export function getStoredFleet(): MachineryVehicle[] {
  if (typeof window === "undefined") return DEFAULT_MACHINERY_FLEET;
  try {
    const stored = localStorage.getItem("rahat_machinery_fleet");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn(e);
  }
  return DEFAULT_MACHINERY_FLEET;
}

export function saveFleet(fleet: MachineryVehicle[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("rahat_machinery_fleet", JSON.stringify(fleet));
    window.dispatchEvent(new CustomEvent("rahat_fleet_updated", { detail: fleet }));
  } catch (e) {
    console.warn(e);
  }
}

export function getStoredInventory(): InventorySupply[] {
  if (typeof window === "undefined") return DEFAULT_SUPPLIES_INVENTORY;
  try {
    const stored = localStorage.getItem("rahat_supplies_inventory");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn(e);
  }
  return DEFAULT_SUPPLIES_INVENTORY;
}

export function saveInventory(inv: InventorySupply[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("rahat_supplies_inventory", JSON.stringify(inv));
    window.dispatchEvent(new CustomEvent("rahat_inventory_updated", { detail: inv }));
  } catch (e) {
    console.warn(e);
  }
}

export function getStoredRequests(): ReliefSOSRequest[] {
  if (typeof window === "undefined") return [INITIAL_SOS_REQUEST];
  try {
    const stored = localStorage.getItem("rahat_sos_requests");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn(e);
  }
  return [INITIAL_SOS_REQUEST];
}

export function saveRequests(reqs: ReliefSOSRequest[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("rahat_sos_requests", JSON.stringify(reqs));
    window.dispatchEvent(new CustomEvent("rahat_requests_updated", { detail: reqs }));
  } catch (e) {
    console.warn(e);
  }
}

export function getStoredDispatches(): ConvoyDispatch[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem("rahat_active_dispatches");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn(e);
  }
  return [];
}

export function saveDispatches(dispatches: ConvoyDispatch[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("rahat_active_dispatches", JSON.stringify(dispatches));
    window.dispatchEvent(new CustomEvent("rahat_dispatches_updated", { detail: dispatches }));
    window.dispatchEvent(new CustomEvent("storage"));
  } catch (e) {
    console.warn(e);
  }
}
