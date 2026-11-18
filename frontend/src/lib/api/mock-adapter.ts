// Mock data for AAPDA Grid — all data is DEMO/SIMULATED
// This file is the single source of truth for frontend mock data

import type {
  Incident,
  RoadSegment,
  Settlement,
  CriticalFacility,
  RouteOption,
  ReliefRequest,
  ReliefItem,
  Delivery,
  DemoStats,
  PublicAlert,
} from "@/types";
import { getAlternateRouteForDistrict } from "./alternate-routes";

// ─── Incidents ────────────────────────────────────────────────────────────────
export const MOCK_INCIDENTS: Incident[] = [
  {
    id: "INC-001",
    title: "Landslide blocks NH-44 near Ramban",
    description:
      "Major landslide reported at NH-44, approximately 3km north of Ramban town. Multiple vehicles stranded. Debris approximately 50m wide.",
    severity: "critical",
    status: "verified",
    district: "Ramban",
    location: { lat: 33.244, lng: 75.258 },
    reportedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    reportedBy: "field_officer_01",
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    evidence: [
      {
        id: "EV-001-1",
        type: "image",
        url: "/demo/landslide-01.jpg",
        caption: "View from south approach",
        uploadedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        uploadedBy: "field_officer_01",
        aiAnalyzed: true,
        aiCaption: "Large debris field, estimated 200+ cubic meters. Road fully blocked.",
      },
    ],
    aiScore: {
      confidence: 0.91,
      duplicateProbability: 0.04,
      consistencyScore: 0.95,
      uncertaintyFlags: [],
      label: "AI Recommendation (unverified — human review required)",
    },
    tags: ["landslide", "road-block", "NH-44"],
    reportCount: 2,
    subReports: [
      {
        id: "RPT-SUB-101",
        reporterName: "citizen_truck_driver",
        reportedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        description: "Massive mud and boulders slid onto NH-44 at Panthyal. Both lanes blocked, cannot pass.",
        location: { lat: 33.244, lng: 75.258 },
      },
      {
        id: "RPT-SUB-102",
        reporterName: "local_shopkeeper_ramban",
        reportedAt: new Date(Date.now() - 100 * 60 * 1000).toISOString(),
        description: "Debris continuing to slide down slope near Ramban approach. 20+ vehicles stranded.",
        location: { lat: 33.244, lng: 75.258 },
      },
    ],
    isDemo: true,
  },
  {
    id: "INC-002",
    title: "Flash flood in Chenab basin — Doda sector",
    description:
      "Residents report rapid rise in Chenab river levels near Doda. Several low-lying areas inundated. Evacuation in progress.",
    severity: "high",
    status: "under_review",
    district: "Doda",
    location: { lat: 33.148, lng: 75.546 },
    reportedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    reportedBy: "citizen_app",
    updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    evidence: [],
    aiScore: {
      confidence: 0.74,
      duplicateProbability: 0.12,
      consistencyScore: 0.78,
      uncertaintyFlags: ["No photographic evidence", "Single source report"],
      label: "AI Recommendation (unverified — human review required)",
    },
    tags: ["flood", "chenab", "evacuation"],
    isDemo: true,
  },
  {
    id: "INC-003",
    title: "Road collapse on Mughal Road near Shopian",
    description:
      "Heavy rainfall caused road surface collapse on Mughal Road. 15m section missing. No injuries reported.",
    severity: "high",
    status: "verified",
    district: "Shopian",
    location: { lat: 33.713, lng: 74.84 },
    reportedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    reportedBy: "field_officer_02",
    updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    evidence: [
      {
        id: "EV-003-1",
        type: "image",
        url: "/demo/road-collapse-01.jpg",
        caption: "Road damage from north",
        uploadedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        uploadedBy: "field_officer_02",
        aiAnalyzed: true,
        aiCaption: "Subsidence clearly visible. Approximately 15m affected.",
      },
    ],
    aiScore: {
      confidence: 0.88,
      duplicateProbability: 0.02,
      consistencyScore: 0.9,
      uncertaintyFlags: [],
      label: "AI Recommendation (unverified — human review required)",
    },
    tags: ["road-collapse", "mughal-road"],
    isDemo: true,
  },
  {
    id: "INC-004",
    title: "Building collapse reported in Kishtwar town",
    description:
      "Partial collapse of a 2-storey residential structure in Kishtwar old town. 3 families evacuated. Search ongoing.",
    severity: "critical",
    status: "reported",
    district: "Kishtwar",
    location: { lat: 33.313, lng: 75.771 },
    reportedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    reportedBy: "citizen_app",
    updatedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    evidence: [],
    aiScore: {
      confidence: 0.55,
      duplicateProbability: 0.28,
      consistencyScore: 0.6,
      uncertaintyFlags: [
        "No coordinates provided",
        "Possible duplicate of INC-003",
        "Unverified source",
      ],
      label: "AI Recommendation (unverified — human review required)",
    },
    tags: ["building-collapse", "kishtwar"],
    isDemo: true,
  },
  {
    id: "INC-005",
    title: "Minor rockfall on Banihal-Ramban highway",
    description:
      "Small rockfall reported. Single lane passable. PWD notified.",
    severity: "medium",
    status: "verified",
    district: "Ramban",
    location: { lat: 33.5, lng: 75.21 },
    reportedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    reportedBy: "field_officer_01",
    updatedAt: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
    evidence: [],
    aiScore: {
      confidence: 0.82,
      duplicateProbability: 0.08,
      consistencyScore: 0.85,
      uncertaintyFlags: [],
      label: "AI Recommendation (unverified — human review required)",
    },
    tags: ["rockfall", "banihal"],
    isDemo: true,
  },
  {
    id: "INC-006",
    title: "Bridge damage near Bhaderwah",
    description:
      "Flood waters damaged one span of a single-lane bridge near Bhaderwah. Currently closed to heavy vehicles.",
    severity: "high",
    status: "under_review",
    district: "Doda",
    location: { lat: 32.978, lng: 75.726 },
    reportedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    reportedBy: "field_officer_03",
    updatedAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    evidence: [],
    aiScore: {
      confidence: 0.71,
      duplicateProbability: 0.05,
      consistencyScore: 0.73,
      uncertaintyFlags: ["Single source"],
      label: "AI Recommendation (unverified — human review required)",
    },
    tags: ["bridge", "bhaderwah", "flood"],
    isDemo: true,
  },
];

// ─── Road Segments (Normal & Affected) ────────────────────────────────────────
export const MOCK_ROADS: RoadSegment[] = [
  // ── Layer A: Normal Open Corridors (Neutral Grey) ─────────────────────────
  {
    id: "RD-OPEN-001",
    name: "NH-44 South: Udhampur to Nashri Tunnel",
    district: "Udhampur",
    status: "open",
    coordinates: [
      { lat: 32.92, lng: 75.14 },
      { lat: 32.96, lng: 75.18 },
      { lat: 33.02, lng: 75.22 },
      { lat: 33.08, lng: 75.25 },
      { lat: 33.14, lng: 75.27 },
    ],
    affectedSettlements: [],
    alternateRouteAvailable: false,
    isDemo: true,
  },
  {
    id: "RD-OPEN-002",
    name: "NH-44: Nashri to Chanderkote & Ramban South",
    district: "Ramban",
    status: "open",
    coordinates: [
      { lat: 33.14, lng: 75.27 },
      { lat: 33.17, lng: 75.28 },
      { lat: 33.20, lng: 75.25 },
      { lat: 33.22, lng: 75.24 },
      { lat: 33.235, lng: 75.242 },
    ],
    affectedSettlements: ["SET-002"],
    alternateRouteAvailable: false,
    isDemo: true,
  },
  {
    id: "RD-OPEN-003",
    name: "NH-44: Ramsu to Banihal Town & Navyug Tunnel",
    district: "Ramban",
    status: "open",
    coordinates: [
      { lat: 33.345, lng: 75.215 },
      { lat: 33.38, lng: 75.21 },
      { lat: 33.42, lng: 75.205 },
      { lat: 33.47, lng: 75.20 },
      { lat: 33.52, lng: 75.195 },
    ],
    affectedSettlements: ["SET-006", "SET-007"],
    alternateRouteAvailable: false,
    isDemo: true,
  },
  {
    id: "RD-OPEN-004",
    name: "NH-44 North: Navyug Tunnel to Qazigund",
    district: "Anantnag",
    status: "open",
    coordinates: [
      { lat: 33.52, lng: 75.195 },
      { lat: 33.55, lng: 75.185 },
      { lat: 33.59, lng: 75.16 },
      { lat: 33.64, lng: 75.13 },
    ],
    affectedSettlements: [],
    alternateRouteAvailable: false,
    isDemo: true,
  },
  {
    id: "RD-OPEN-005",
    name: "NH-244: Batote to Baglihar & Pul Doda",
    district: "Doda",
    status: "open",
    coordinates: [
      { lat: 33.21, lng: 75.26 },
      { lat: 33.20, lng: 75.32 },
      { lat: 33.18, lng: 75.38 },
      { lat: 33.15, lng: 75.45 },
      { lat: 33.148, lng: 75.546 },
    ],
    affectedSettlements: ["SET-002"],
    alternateRouteAvailable: false,
    isDemo: true,
  },
  {
    id: "RD-OPEN-006",
    name: "NH-244: Pul Doda to Kishtwar Sector",
    district: "Kishtwar",
    status: "open",
    coordinates: [
      { lat: 33.148, lng: 75.546 },
      { lat: 33.18, lng: 75.62 },
      { lat: 33.23, lng: 75.68 },
      { lat: 33.28, lng: 75.73 },
      { lat: 33.313, lng: 75.771 },
    ],
    affectedSettlements: [],
    alternateRouteAvailable: false,
    isDemo: true,
  },
  {
    id: "RD-OPEN-007",
    name: "Mughal Road: Bafliaz to Pir Ki Gali Pass",
    district: "Poonch",
    status: "open",
    coordinates: [
      { lat: 33.62, lng: 74.48 },
      { lat: 33.65, lng: 74.58 },
      { lat: 33.68, lng: 74.68 },
      { lat: 33.71, lng: 74.75 },
    ],
    affectedSettlements: [],
    alternateRouteAvailable: false,
    isDemo: true,
  },

  // ── Layer B: Disaster-Affected Segments (Color-Coded) ──────────────────────
  {
    id: "RD-001",
    name: "NH-44: Ramban to Panthyal Landslide Chokepoint",
    district: "Ramban",
    status: "closed",
    closureReason: "Active landslide & falling boulders (50m debris across highway)",
    affectedFrom: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    estimatedClearance: new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString(),
    coordinates: [
      { lat: 33.235, lng: 75.242 },
      { lat: 33.242, lng: 75.248 },
      { lat: 33.248, lng: 75.253 },
      { lat: 33.255, lng: 75.259 },
      { lat: 33.262, lng: 75.265 },
      { lat: 33.270, lng: 75.260 },
      { lat: 33.285, lng: 75.248 },
    ],
    affectedSettlements: ["SET-001"],
    alternateRouteAvailable: true,
    isDemo: true,
  },
  {
    id: "RD-002",
    name: "Mughal Road: Pir Ki Gali to Hirpura Sector",
    district: "Shopian",
    status: "closed",
    closureReason: "Roadbed collapse due to heavy cloudburst runoff",
    affectedFrom: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    estimatedClearance: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    coordinates: [
      { lat: 33.71, lng: 74.75 },
      { lat: 33.72, lng: 74.80 },
      { lat: 33.73, lng: 74.84 },
      { lat: 33.74, lng: 74.88 },
    ],
    affectedSettlements: ["SET-003"],
    alternateRouteAvailable: false,
    isDemo: true,
  },
  {
    id: "RD-003",
    name: "NH-44: Panthyal to Ramsu Transition",
    district: "Ramban",
    status: "partially_open",
    closureReason: "Intermittent rockfall — single lane pilot vehicle escort only",
    affectedFrom: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    estimatedClearance: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    coordinates: [
      { lat: 33.285, lng: 75.248 },
      { lat: 33.305, lng: 75.235 },
      { lat: 33.325, lng: 75.225 },
      { lat: 33.345, lng: 75.215 },
    ],
    affectedSettlements: [],
    alternateRouteAvailable: true,
    isDemo: true,
  },
  {
    id: "RD-004",
    name: "Bhaderwah Bridge Access Road",
    district: "Doda",
    status: "partially_open",
    closureReason: "River flood damaged pier foundation — light vehicles only",
    affectedFrom: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    estimatedClearance: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(),
    coordinates: [
      { lat: 32.96, lng: 75.69 },
      { lat: 32.975, lng: 75.72 },
      { lat: 32.985, lng: 75.74 },
    ],
    affectedSettlements: ["SET-004"],
    alternateRouteAvailable: false,
    isDemo: true,
  },
];

// ─── Layer C: Calculated Alternative Routes (MargRakshak Graph) ───────────────
export const MOCK_ALTERNATIVE_ROUTES: RouteOption[] = [
  {
    routeId: "ALT-PANTHYAL-01",
    name: "Recommended: Chanderkote - Rajgarh Ridge - Ramsu Bypass",
    distanceKm: 28.4,
    estimatedTimeMinutes: 75,
    status: "recommended",
    passable: true,
    segments: ["Chanderkote Link Road", "Rajgarh Mountain Spine", "Khari North Detour", "Ramsu Junction"],
    geometry: [
      { lat: 33.22, lng: 75.24 },
      { lat: 33.228, lng: 75.265 },
      { lat: 33.245, lng: 75.285 },
      { lat: 33.265, lng: 75.295 },
      { lat: 33.285, lng: 75.275 },
      { lat: 33.315, lng: 75.245 },
      { lat: 33.345, lng: 75.215 },
    ],
    warnings: ["Narrow mountain geometry; speed limit 25 km/h", "Cleared for 4x4 relief trucks only"],
    reason: "Bypasses the NH-44 Panthyal landslide completely; restores road access to isolated Khari Village.",
  },
  {
    routeId: "ALT-KISHTWAR-02",
    name: "Secondary Detour: Batote - Kishtwar - Sinthan Pass",
    distanceKm: 146.0,
    estimatedTimeMinutes: 285,
    status: "alternative",
    passable: true,
    segments: ["NH-244 Chenab Expressway", "Kishtwar Outer Ring", "Sinthan Top Pass (3750m)"],
    geometry: [
      { lat: 33.21, lng: 75.26 },
      { lat: 33.18, lng: 75.38 },
      { lat: 33.148, lng: 75.546 },
      { lat: 33.23, lng: 75.68 },
      { lat: 33.313, lng: 75.771 },
      { lat: 33.45, lng: 75.55 },
      { lat: 33.52, lng: 75.20 },
    ],
    warnings: ["High altitude pass (3,750m); icy patches near summit", "Long transit time (+4.7 hours)"],
    reason: "Heavy convoy alternate for heavy multi-axle supply trucks unable to negotiate narrow ridge roads.",
  },
];

// ─── Layer D: Critical Facilities (Hospitals, Warehouses, Depots) ─────────────
export const MOCK_FACILITIES: CriticalFacility[] = [
  {
    id: "FAC-001",
    name: "District Hospital Ramban",
    type: "hospital",
    district: "Ramban",
    location: { lat: 33.241, lng: 75.250 },
    operationalStatus: "operational",
    capacity: 150,
    isDemo: true,
  },
  {
    id: "FAC-002",
    name: "Sub-District Hospital Banihal",
    type: "hospital",
    district: "Ramban",
    location: { lat: 33.498, lng: 75.205 },
    operationalStatus: "operational",
    capacity: 80,
    isDemo: true,
  },
  {
    id: "FAC-003",
    name: "DDMA Central Relief Depot Batote",
    type: "warehouse",
    district: "Ramban",
    location: { lat: 33.210, lng: 75.260 },
    operationalStatus: "operational",
    capacity: 5000,
    isDemo: true,
  },
  {
    id: "FAC-004",
    name: "District Hospital Shopian",
    type: "hospital",
    district: "Shopian",
    location: { lat: 33.720, lng: 74.830 },
    operationalStatus: "operational",
    capacity: 120,
    isDemo: true,
  },
  {
    id: "FAC-005",
    name: "Community Health Centre Gandoh",
    type: "hospital",
    district: "Doda",
    location: { lat: 33.002, lng: 75.761 },
    operationalStatus: "operational",
    capacity: 45,
    isDemo: true,
  },
];

// ─── Settlements ──────────────────────────────────────────────────────────────
export const MOCK_SETTLEMENTS: Settlement[] = [
  {
    id: "SET-001",
    name: "Khari Village",
    district: "Ramban",
    population: 420,
    location: { lat: 33.27, lng: 75.29 },
    isIsolated: true,
    isolatedSince: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    accessRoads: ["RD-001"],
    nearestFacility: { name: "District Hospital Ramban", type: "hospital", distanceKm: 8.2 },
    isDemo: true,
  },
  {
    id: "SET-002",
    name: "Batote Town",
    district: "Ramban",
    population: 2100,
    location: { lat: 33.21, lng: 75.26 },
    isIsolated: false,
    accessRoads: ["RD-OPEN-002", "RD-OPEN-005"],
    nearestFacility: { name: "DDMA Central Relief Depot Batote", type: "warehouse", distanceKm: 1.5 },
    isDemo: true,
  },
  {
    id: "SET-003",
    name: "Hirpura Village",
    district: "Shopian",
    population: 180,
    location: { lat: 33.74, lng: 74.88 },
    isIsolated: true,
    isolatedSince: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    accessRoads: ["RD-002"],
    nearestFacility: { name: "District Hospital Shopian", type: "hospital", distanceKm: 15.3 },
    isDemo: true,
  },
  {
    id: "SET-004",
    name: "Palmarpur",
    district: "Doda",
    population: 350,
    location: { lat: 32.98, lng: 75.74 },
    isIsolated: true,
    isolatedSince: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    accessRoads: ["RD-004"],
    nearestFacility: { name: "Community Health Centre Gandoh", type: "hospital", distanceKm: 9.8 },
    isDemo: true,
  },
  {
    id: "SET-005",
    name: "Gandoh Town",
    district: "Doda",
    population: 920,
    location: { lat: 33.00, lng: 75.76 },
    isIsolated: false,
    accessRoads: ["RD-004"],
    nearestFacility: { name: "Community Health Centre Gandoh", type: "hospital", distanceKm: 2.1 },
    isDemo: true,
  },
  {
    id: "SET-006",
    name: "Ramsu Town",
    district: "Ramban",
    population: 1450,
    location: { lat: 33.34, lng: 75.22 },
    isIsolated: false,
    accessRoads: ["RD-003", "RD-OPEN-003"],
    nearestFacility: { name: "Sub-District Hospital Banihal", type: "hospital", distanceKm: 14.0 },
    isDemo: true,
  },
  {
    id: "SET-007",
    name: "Banihal Town",
    district: "Ramban",
    population: 3800,
    location: { lat: 33.48, lng: 75.20 },
    isIsolated: false,
    accessRoads: ["RD-OPEN-003", "RD-OPEN-004"],
    nearestFacility: { name: "Sub-District Hospital Banihal", type: "hospital", distanceKm: 0.8 },
    isDemo: true,
  },
];

// ─── Relief ───────────────────────────────────────────────────────────────────
export const MOCK_RELIEF_ITEMS: ReliefItem[] = [
  { id: "RI-001", name: "Food Packets (family kit)", category: "food", unit: "kit", quantityAvailable: 1200, quantityReserved: 340, warehouseId: "WH-01" },
  { id: "RI-002", name: "Drinking Water (20L)", category: "water", unit: "can", quantityAvailable: 800, quantityReserved: 150, warehouseId: "WH-01" },
  { id: "RI-003", name: "Emergency Shelter Kit", category: "shelter", unit: "kit", quantityAvailable: 200, quantityReserved: 45, warehouseId: "WH-02" },
  { id: "RI-004", name: "First Aid Kit", category: "medicine", unit: "kit", quantityAvailable: 350, quantityReserved: 80, warehouseId: "WH-01" },
  { id: "RI-005", name: "Blankets", category: "clothing", unit: "piece", quantityAvailable: 1500, quantityReserved: 200, warehouseId: "WH-02" },
];

export const MOCK_RELIEF_REQUESTS: ReliefRequest[] = [
  {
    id: "RR-001",
    settlementId: "SET-001",
    settlementName: "Khari Village",
    district: "Ramban",
    requestedBy: "field_officer_01",
    status: "pending",
    items: [
      { itemId: "RI-001", name: "Food Packets", quantityRequested: 100 },
      { itemId: "RI-002", name: "Drinking Water (20L)", quantityRequested: 50 },
      { itemId: "RI-004", name: "First Aid Kit", quantityRequested: 10 },
    ],
    priority: "critical",
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    aiAllocationSuggestion: {
      label: "AI Recommendation (unverified — human review required)",
      suggestedItems: [
        { itemId: "RI-001", quantity: 100, rationale: "Population 420, 3-day supply at 1 kit/4 persons/day" },
        { itemId: "RI-002", quantity: 50, rationale: "2L/person/day for 420 persons, 2-day supply" },
        { itemId: "RI-004", quantity: 10, rationale: "Standard ratio for 420 persons" },
      ],
      feasibilityScore: 0.72,
    },
    isDemo: true,
  },
  {
    id: "RR-002",
    settlementId: "SET-003",
    settlementName: "Hirpura",
    district: "Shopian",
    requestedBy: "ngo_partner_01",
    status: "pending",
    items: [
      { itemId: "RI-001", name: "Food Packets", quantityRequested: 45 },
      { itemId: "RI-003", name: "Emergency Shelter Kit", quantityRequested: 12 },
    ],
    priority: "high",
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    isDemo: true,
  },
  {
    id: "RR-003",
    settlementId: "SET-004",
    settlementName: "Palmarpur",
    district: "Doda",
    requestedBy: "ddma_officer_01",
    status: "approved",
    items: [
      { itemId: "RI-001", name: "Food Packets", quantityRequested: 90, quantityApproved: 90 },
      { itemId: "RI-005", name: "Blankets", quantityRequested: 70, quantityApproved: 70 },
    ],
    priority: "high",
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    isDemo: true,
  },
];

export const MOCK_DELIVERIES: Delivery[] = [
  {
    id: "DEL-001",
    requestId: "RR-003",
    settlementId: "SET-004",
    settlementName: "Palmarpur",
    district: "Doda",
    status: "in_transit",
    scheduledAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    vehicleId: "VH-07",
    driverName: "Mohammad Yusuf",
    items: [
      { name: "Food Packets", quantity: 90 },
      { name: "Blankets", quantity: 70 },
    ],
    isDemo: true,
  },
];

// ─── Computed Stats ───────────────────────────────────────────────────────────
export const MOCK_ALERTS: PublicAlert[] = [
  {
    id: "ALT-001",
    title: "CRITICAL: NH-44 Landslide at Panthyal — Highway Blocked",
    message: "Debris and shooting stones have completely blocked NH-44 between Ramban and Banihal. Diversion active via Mughal Road (Shopian) for LMVs only. Stay clear of Chenab gorge slopes.",
    severity: "critical",
    district: "Ramban",
    source: "J&K State Disaster Management Authority (DDMA)",
    issuedAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    affectedRoad: "NH-44 Panthyal Corridor",
    telegramBroadcastStatus: {
      channel: "@AAPDA_JK_Disaster_Alerts",
      subscribersCount: 1420,
      dispatchedAt: new Date(Date.now() - 34 * 60 * 1000).toISOString(),
    },
    isActive: true,
    isDemo: true,
  },
  {
    id: "ALT-002",
    title: "WEATHER ADVISORY: Cloudburst Watch for Chenab Basin",
    message: "Open-Meteo & IMD radar detect high precipitation rate (>45mm/hr) in upper catchment. Moderate flash-flood risk for low-lying settlements near Doda and Khari.",
    severity: "warning",
    district: "Doda",
    source: "IMD / DDMA Emergency Operations Centre",
    issuedAt: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    telegramBroadcastStatus: {
      channel: "@AAPDA_JK_Disaster_Alerts",
      subscribersCount: 1420,
      dispatchedAt: new Date(Date.now() - 109 * 60 * 1000).toISOString(),
    },
    isActive: true,
    isDemo: true,
  },
];

export function broadcastAlert(alert: {
  title: string;
  message: string;
  severity: "critical" | "warning" | "advisory";
  district: string;
  affectedRoad?: string;
  closureReason?: string;
  alternateRoute?: {
    name: string;
    description: string;
    passableFor?: string;
    extraTime?: string;
  };
}): PublicAlert {
  const advisory = getAlternateRouteForDistrict(alert.district);
  const newAlert: PublicAlert = {
    ...alert,
    id: `ALT-${Date.now().toString(36).toUpperCase()}`,
    source: "DDMA Incident Commander (Admin Action)",
    issuedAt: new Date().toISOString(),
    affectedRoad: alert.affectedRoad || advisory.affectedRoad,
    closureReason: alert.closureReason || advisory.closureReason,
    alternateRoute: alert.alternateRoute || advisory.alternateRoute,
    telegramBroadcastStatus: {
      channel: "@AAPDA_JK_Disaster_Alerts",
      subscribersCount: 1420,
      dispatchedAt: new Date().toISOString(),
    },
    isActive: true,
    isDemo: true,
  };
  MOCK_ALERTS.unshift(newAlert);

  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("aapda_grid_alerts");
      const list = stored ? JSON.parse(stored) : [...MOCK_ALERTS];
      const merged = [newAlert, ...list.filter((a: any) => a.id !== newAlert.id)];
      localStorage.setItem("aapda_grid_alerts", JSON.stringify(merged));
      window.dispatchEvent(new CustomEvent("aapda_alerts_updated", { detail: newAlert }));
      window.dispatchEvent(new CustomEvent("storage"));
    } catch (e) {
      console.warn("Storage alert sync error:", e);
    }
  }

  return newAlert;
}

export function findMatchingIncident(report: {
  title: string;
  description: string;
  district: string;
  location: { lat: number; lng: number };
}): Incident | undefined {
  const normTitle = (report.title || "").toLowerCase();
  const normDesc = (report.description || "").toLowerCase();
  const repDistrict = (report.district || "").toLowerCase().trim();

  return MOCK_INCIDENTS.find((inc) => {
    if (inc.status === "closed") return false;

    // 1. STRICT District Match: If districts differ, NEVER merge!
    const incDistrict = (inc.district || "").toLowerCase().trim();
    if (incDistrict && repDistrict && incDistrict !== repDistrict) {
      return false;
    }

    // 2. Spatial proximity check: must be within 5 km to be the exact same incident
    const latDiff = (inc.location.lat - report.location.lat) * 111;
    const lngDiff = (inc.location.lng - report.location.lng) * 85;
    const distKm = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
    if (distKm > 5) {
      return false;
    }

    // 3. Keyword matching
    const keywords = [
      "landslide", "rockfall", "shooting stone", "debris",
      "flood", "water", "river", "overflow", "submerged",
      "road", "block", "nh-44", "panthyal", "mughal", "ramban", "doda", "shopian", "chenab",
      "avalanche", "bridge", "udhampur"
    ];

    const matchCount = keywords.filter(
      (w) =>
        (normTitle.includes(w) || normDesc.includes(w)) &&
        (inc.title.toLowerCase().includes(w) || inc.description.toLowerCase().includes(w))
    ).length;

    return matchCount >= 1;
  });
}

export function addCitizenReport(report: {
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  district: string;
  location: { lat: number; lng: number };
  reportedBy?: string;
  mediaUrl?: string | null;
}): Incident {
  // Check if this report corroborates an existing incident
  const existing = findMatchingIncident(report);

  if (existing) {
    existing.reportCount = (existing.reportCount || 1) + 1;
    existing.updatedAt = new Date().toISOString();

    const subItem = {
      id: `RPT-SUB-${Date.now().toString(36).toUpperCase()}`,
      reporterName: report.reportedBy || "citizen_mobile",
      reportedAt: new Date().toISOString(),
      description: report.description,
      mediaUrl: report.mediaUrl || null,
      location: report.location,
    };

    if (!existing.subReports || existing.subReports.length === 0) {
      existing.subReports = [
        {
          id: existing.id,
          reporterName: existing.reportedBy,
          reportedAt: existing.reportedAt,
          description: existing.description,
          mediaUrl: existing.evidence?.[0]?.url || null,
          location: existing.location,
        },
      ];
    }
    existing.subReports.unshift(subItem);

    if (report.mediaUrl) {
      existing.evidence.unshift({
        id: `EV-${Date.now().toString(36)}`,
        type: "image",
        url: report.mediaUrl,
        caption: `Evidence photo from ${report.reportedBy || "citizen"}`,
        uploadedAt: new Date().toISOString(),
        uploadedBy: report.reportedBy || "citizen_mobile",
        aiAnalyzed: true,
        aiCaption: "Citizen attached photo corroborating hazard.",
      });
    }

    if (existing.aiScore) {
      existing.aiScore.confidence = Math.min(0.99, Number((existing.aiScore.confidence + 0.04).toFixed(2)));
      existing.aiScore.duplicateProbability = 0.96;
      existing.aiScore.uncertaintyFlags = [
        `Corroborated by ${existing.reportCount} independent citizen reports across the sector`,
      ];
    }

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("aapda_grid_incidents", JSON.stringify(MOCK_INCIDENTS));
        window.dispatchEvent(new CustomEvent("aapda_incidents_updated", { detail: MOCK_INCIDENTS }));
      } catch (e) {
        console.warn("Storage sync error:", e);
      }
    }

    return existing;
  }

  // Otherwise, create a new incident
  const assignedId = `REP-${Date.now().toString(36).toUpperCase()}`;
  const newIncident: Incident = {
    id: assignedId,
    title: report.title,
    description: report.description,
    severity: report.severity,
    status: "reported",
    district: report.district,
    location: report.location,
    reportedAt: new Date().toISOString(),
    reportedBy: report.reportedBy || "citizen_mobile",
    updatedAt: new Date().toISOString(),
    evidence: report.mediaUrl
      ? [
          {
            id: `EV-${Date.now().toString(36)}`,
            type: "image",
            url: report.mediaUrl,
            caption: `Photo evidence from ${report.reportedBy || "citizen"}`,
            uploadedAt: new Date().toISOString(),
            uploadedBy: report.reportedBy || "citizen_mobile",
            aiAnalyzed: true,
            aiCaption: "Citizen attached photo.",
          },
        ]
      : [],
    aiScore: {
      confidence: 0.88,
      duplicateProbability: 0.04,
      consistencyScore: 0.94,
      uncertaintyFlags: ["Citizen field report — pending human officer review"],
      label: "AI Recommendation (unverified — human review required)",
    },
    tags: [report.district.toLowerCase(), "citizen-report", "unverified"],
    reportCount: 1,
    subReports: [
      {
        id: assignedId,
        reporterName: report.reportedBy || "citizen_mobile",
        reportedAt: new Date().toISOString(),
        description: report.description,
        mediaUrl: report.mediaUrl || null,
        location: report.location,
      },
    ],
    isDemo: true,
  };

  MOCK_INCIDENTS.unshift(newIncident);

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("aapda_grid_incidents", JSON.stringify(MOCK_INCIDENTS));
      window.dispatchEvent(new CustomEvent("aapda_incidents_updated", { detail: MOCK_INCIDENTS }));
    } catch (e) {
      console.warn("Storage sync error:", e);
    }
  }

  return newIncident;
}

export function updateRoadStatusMock(roadId: string, status: "open" | "partially_open" | "closed" | "unknown"): RoadSegment | undefined {
  const road = MOCK_ROADS.find((r) => r.id === roadId);
  if (road) {
    road.status = status;
    road.closureReason = status === "open" ? undefined : `Updated by DDMA Officer: ${status.replace("_", " ")}`;
  }
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("aapda_grid_roads", JSON.stringify(MOCK_ROADS));
      window.dispatchEvent(new CustomEvent("aapda_roads_updated", { detail: MOCK_ROADS }));
      window.dispatchEvent(new CustomEvent("storage"));
    } catch (e) {
      console.warn("Storage road sync error:", e);
    }
  }
  return road;
}

export function computeDemoStats(): DemoStats {
  const incidentsByStatus = MOCK_INCIDENTS.reduce(
    (acc, inc) => {
      acc[inc.status] = (acc[inc.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  ) as DemoStats["incidentsByStatus"];

  return {
    totalIncidents: MOCK_INCIDENTS.length,
    incidentsByStatus,
    roadsClosed: MOCK_ROADS.filter((r) => r.status === "closed").length,
    roadsPartiallyOpen: MOCK_ROADS.filter((r) => r.status === "partially_open").length,
    isolatedSettlements: MOCK_SETTLEMENTS.filter((s) => s.isIsolated).length,
    pendingReliefRequests: MOCK_RELIEF_REQUESTS.filter((r) => r.status === "pending").length,
    criticalIncidents: MOCK_INCIDENTS.filter((i) => i.severity === "critical").length,
  };
}
