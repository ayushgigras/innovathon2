import {
  collection,
  doc,
  setDoc,
  addDoc,
  getDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./config";

export interface FirestoreIncidentReport {
  id?: string;
  reportId: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  incidentType: string;
  district: string;
  location: {
    lat: number;
    lng: number;
    description: string;
  };
  reportedBy: string;
  mediaUrl?: string | null;
  status: "submitted" | "queued_for_review" | "verified" | "rejected" | "resolved";
  createdAt?: Timestamp | unknown;
}

const REPORTS_COLLECTION = "incident_reports";
const ALERTS_COLLECTION = "emergency_alerts";

/**
 * Save a new incident report to Firestore
 */
export async function saveIncidentReportToFirestore(
  data: Omit<FirestoreIncidentReport, "status"> & { status?: string }
): Promise<string> {
  const docRef = doc(db, REPORTS_COLLECTION, data.reportId);
  const payload = {
    ...data,
    status: data.status || "queued_for_review",
    createdAt: serverTimestamp(),
  };

  await setDoc(docRef, payload, { merge: true });
  return data.reportId;
}

/**
 * Fetch a single report by ID
 */
export async function getIncidentReportFromFirestore(
  reportId: string
): Promise<FirestoreIncidentReport | null> {
  const docRef = doc(db, REPORTS_COLLECTION, reportId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as FirestoreIncidentReport;
}

/**
 * Real-time listener for recent incident reports
 */
export function subscribeToIncidentReports(
  callback: (reports: FirestoreIncidentReport[]) => void,
  maxItems = 50
): () => void {
  const q = query(
    collection(db, REPORTS_COLLECTION),
    orderBy("createdAt", "desc"),
    limit(maxItems)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items: FirestoreIncidentReport[] = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...d.data() } as FirestoreIncidentReport);
      });
      callback(items);
    },
    (error) => {
      console.warn("Firestore incident subscription fallback:", error);
    }
  );
}

/**
 * Publish emergency alert to Firestore
 */
export async function broadcastAlertToFirestore(alert: {
  title: string;
  category: string;
  severity: string;
  message: string;
  affectedDistricts: string[];
  issuedBy: string;
}): Promise<string> {
  const colRef = collection(db, ALERTS_COLLECTION);
  const docRef = await addDoc(colRef, {
    ...alert,
    timestamp: serverTimestamp(),
  });
  return docRef.id;
}
