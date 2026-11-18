// AAPDA Grid — Shared TypeScript Types
// All data marked as DEMO/SIMULATED unless fetched from verified backend

export type SeverityLevel = "critical" | "high" | "medium" | "low";
export type IncidentStatus = "reported" | "under_review" | "verified" | "closed" | "duplicate";
export type RoadStatus = "open" | "partially_open" | "closed" | "unknown";
export type ReliefRequestStatus = "pending" | "approved" | "in_transit" | "delivered" | "rejected";
export type UserRole = "citizen" | "ddma_officer" | "field_officer" | "ngo_partner";

// ─── Incident ───────────────────────────────────────────────────────────────
export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface EvidenceItem {
  id: string;
  type: "image" | "video" | "audio" | "document";
  url: string;
  caption?: string;
  uploadedAt: string; // ISO 8601
  uploadedBy: string;
  aiAnalyzed: boolean;
  aiCaption?: string; // AI-generated, labeled unverified
}

export interface AiScore {
  confidence: number; // 0–1
  duplicateProbability: number; // 0–1
  consistencyScore: number; // 0–1
  uncertaintyFlags: string[];
  label: "AI Recommendation (unverified — human review required)";
}

export interface SubReportItem {
  id: string;
  reporterName: string;
  reportedAt: string;
  description: string;
  mediaUrl?: string | null;
  location?: GeoPoint;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: SeverityLevel;
  status: IncidentStatus;
  district: string;
  location: GeoPoint;
  reportedAt: string; // ISO 8601
  reportedBy: string;
  updatedAt: string;
  evidence: EvidenceItem[];
  aiScore?: AiScore;
  tags: string[];
  reportCount?: number;
  subReports?: SubReportItem[];
  isDemo: true; // always true in frontend mock
}

// ─── Road ────────────────────────────────────────────────────────────────────
export interface RoadSegment {
  id: string;
  name: string;
  district: string;
  status: RoadStatus;
  closureReason?: string;
  affectedFrom?: string; // ISO 8601
  estimatedClearance?: string; // ISO 8601
  coordinates: GeoPoint[];
  affectedSettlements: string[]; // settlement IDs
  alternateRouteAvailable: boolean;
  isDemo: true;
}

// ─── Critical Facilities & Routing ──────────────────────────────────────────
export interface CriticalFacility {
  id: string;
  name: string;
  type: "hospital" | "warehouse" | "shelter" | "police" | "relief_depot";
  district: string;
  location: GeoPoint;
  operationalStatus: "operational" | "damaged" | "isolated";
  capacity?: number;
  isDemo: true;
}

export interface RouteOption {
  routeId: string;
  name: string;
  distanceKm: number;
  estimatedTimeMinutes: number;
  status: "recommended" | "alternative" | "caution";
  passable: boolean;
  segments: string[];
  geometry: GeoPoint[];
  warnings?: string[];
  reason?: string;
}

export interface Settlement {
  id: string;
  name: string;
  district: string;
  population: number;
  location: GeoPoint;
  isIsolated: boolean;
  isolatedSince?: string;
  accessRoads: string[]; // road segment IDs
  nearestFacility?: {
    name: string;
    type: "hospital" | "police" | "relief_camp" | "warehouse";
    distanceKm: number;
  };
  isDemo: true;
}

// ─── Relief ──────────────────────────────────────────────────────────────────
export interface ReliefItem {
  id: string;
  name: string;
  category: "food" | "medicine" | "shelter" | "water" | "clothing" | "equipment";
  unit: string;
  quantityAvailable: number;
  quantityReserved: number;
  warehouseId: string;
}

export interface ReliefRequest {
  id: string;
  settlementId: string;
  settlementName: string;
  district: string;
  requestedBy: string;
  status: ReliefRequestStatus;
  items: { itemId: string; name: string; quantityRequested: number; quantityApproved?: number }[];
  priority: SeverityLevel;
  createdAt: string;
  updatedAt: string;
  aiAllocationSuggestion?: {
    label: "AI Recommendation (unverified — human review required)";
    suggestedItems: { itemId: string; quantity: number; rationale: string }[];
    feasibilityScore: number;
  };
  isDemo: true;
}

export interface Delivery {
  id: string;
  requestId: string;
  settlementId: string;
  settlementName: string;
  district: string;
  status: "scheduled" | "in_transit" | "delivered" | "failed";
  scheduledAt: string;
  deliveredAt?: string;
  vehicleId?: string;
  driverName?: string;
  items: { name: string; quantity: number }[];
  isDemo: true;
}

// ─── UI State ────────────────────────────────────────────────────────────────
export interface PublicAlert {
  id: string;
  title: string;
  message: string;
  severity: "critical" | "warning" | "advisory";
  district: string;
  source: string;
  issuedAt: string;
  expiresAt?: string;
  affectedRoad?: string;
  closureReason?: string;
  alternateRoute?: {
    name: string;
    description: string;
    passableFor?: string;
    extraTime?: string;
  };
  telegramBroadcastStatus?: {
    channel: string;
    subscribersCount: number;
    dispatchedAt: string;
  };
  isActive: boolean;
  isDemo: true;
}

export interface DemoStats {
  totalIncidents: number;
  incidentsByStatus: Record<IncidentStatus, number>;
  roadsClosed: number;
  roadsPartiallyOpen: number;
  isolatedSettlements: number;
  pendingReliefRequests: number;
  criticalIncidents: number;
}
