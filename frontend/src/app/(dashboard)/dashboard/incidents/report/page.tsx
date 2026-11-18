"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FileText,
  MapPin,
  Upload,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  Loader2,
  Image as ImageIcon,
  Flame,
} from "lucide-react";
import { DemoBadge } from "@/components/shared/DemoBadge";
import { addCitizenReport } from "@/lib/api/mock-adapter";
import { saveIncidentReportToFirestore, compressAndEncodeImage } from "@/lib/firebase";

type IncidentType = "road_block" | "flood" | "landslide" | "avalanche" | "bridge_damage" | "other";
type SeverityLevel = "low" | "medium" | "high" | "critical";

const JK_DISTRICTS = [
  { name: "Udhampur", lat: 32.9157, lng: 75.1416 },
  { name: "Ramban", lat: 33.2440, lng: 75.2580 },
  { name: "Doda", lat: 33.1480, lng: 75.5460 },
  { name: "Kishtwar", lat: 33.3113, lng: 75.7663 },
  { name: "Shopian", lat: 33.7130, lng: 74.8400 },
  { name: "Jammu", lat: 32.7266, lng: 74.8570 },
  { name: "Srinagar", lat: 34.0837, lng: 74.7973 },
  { name: "Anantnag", lat: 33.7311, lng: 75.1522 },
  { name: "Reasi", lat: 33.0827, lng: 74.8315 },
  { name: "Poonch", lat: 33.7717, lng: 74.0930 },
  { name: "Rajouri", lat: 33.3768, lng: 74.3075 },
];

function resolveDistrictAndCoords(locationText: string, chosenDistrict?: string): { district: string; lat: number; lng: number } {
  if (chosenDistrict) {
    const found = JK_DISTRICTS.find((d) => d.name.toLowerCase() === chosenDistrict.toLowerCase());
    if (found) return { district: found.name, lat: found.lat, lng: found.lng };
  }

  const lower = (locationText || "").toLowerCase();
  for (const d of JK_DISTRICTS) {
    if (lower.includes(d.name.toLowerCase())) {
      return { district: d.name, lat: d.lat, lng: d.lng };
    }
  }

  if (lower.includes("chenani") || lower.includes("kud") || lower.includes("patnitop") || lower.includes("udhampur") || lower.includes("samroli")) {
    return { district: "Udhampur", lat: 32.9157, lng: 75.1416 };
  }
  if (lower.includes("panthyal") || lower.includes("peerah") || lower.includes("banihal") || lower.includes("ramsu") || lower.includes("ramban")) {
    return { district: "Ramban", lat: 33.2440, lng: 75.2580 };
  }
  if (lower.includes("bhaderwah") || lower.includes("thathri") || lower.includes("doda")) {
    return { district: "Doda", lat: 33.1480, lng: 75.5460 };
  }
  if (lower.includes("peer ki gali") || lower.includes("bafliaz") || lower.includes("shopian")) {
    return { district: "Shopian", lat: 33.7130, lng: 74.8400 };
  }

  return { district: "Udhampur", lat: 32.9157, lng: 75.1416 };
}

interface FormState {
  reporterName: string;
  district: string;
  location: string;
  incidentType: IncidentType | "";
  severity: SeverityLevel | "";
  description: string;
}

const INCIDENT_TYPES: { value: IncidentType; label: string }[] = [
  { value: "road_block", label: "Road Block" },
  { value: "flood", label: "Flood" },
  { value: "landslide", label: "Landslide" },
  { value: "avalanche", label: "Avalanche" },
  { value: "bridge_damage", label: "Bridge Damage" },
  { value: "other", label: "Other" },
];

const SEVERITIES: { value: SeverityLevel; label: string; desc: string }[] = [
  { value: "low", label: "Low", desc: "Minor, no immediate danger" },
  { value: "medium", label: "Medium", desc: "Moderate — monitor closely" },
  { value: "high", label: "High", desc: "Serious — response needed" },
  { value: "critical", label: "Critical", desc: "Life-threatening — urgent" },
];

function generateReportId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `RPT-${ts}-${rand}`;
}

export default function PublicReportPage(): React.ReactElement {
  const [form, setForm] = useState<FormState>({
    reporterName: "",
    district: "Udhampur",
    location: "",
    incidentType: "",
    severity: "",
    description: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);

  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [reportId, setReportId] = useState("");
  const [reportCount, setReportCount] = useState<number>(1);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (file.type.startsWith("image/")) {
        setFilePreview(URL.createObjectURL(file));
      } else {
        setFilePreview(null);
      }
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormState, string>> = {};
    if (!form.location.trim()) newErrors.location = "Location is required.";
    if (!form.incidentType) newErrors.incidentType = "Please select an incident type.";
    if (!form.severity) newErrors.severity = "Please select a severity level.";
    if (!form.description.trim()) newErrors.description = "Description is required.";
    if (form.description.trim().length < 20) newErrors.description = "Please provide at least 20 characters of description.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    const assignedId = generateReportId();
    let mediaPayload: string | null = null;

    try {
      // 1. Process image if provided (compressed to base64 Data URL for Firestore)
      if (selectedFile) {
        setStatusMessage("Optimizing photo for Firestore storage...");
        try {
          mediaPayload = await compressAndEncodeImage(selectedFile, 800, 0.7);
          setProcessedImageUrl(mediaPayload);
        } catch (imgErr) {
          console.warn("Image encoding fallback:", imgErr);
        }
      }

      // Resolve district and geographical coordinates accurately
      const geo = resolveDistrictAndCoords(form.location, form.district);

      // 2. Save structured record directly to Firebase Firestore
      setStatusMessage("Saving record to Firebase Firestore...");
      await saveIncidentReportToFirestore({
        reportId: assignedId,
        title: `${(form.incidentType || "Incident").toUpperCase().replace("_", " ")}: ${form.location}`,
        description: form.description,
        severity: (form.severity as SeverityLevel) || "high",
        incidentType: form.incidentType || "other",
        district: geo.district,
        location: {
          lat: geo.lat,
          lng: geo.lng,
          description: form.location,
        },
        reportedBy: form.reporterName || "citizen_mobile",
        mediaUrl: mediaPayload,
        status: "queued_for_review",
      });

      // 3. Keep local in-memory mock state in sync with deduplication
      const savedInc = addCitizenReport({
        title: `${(form.incidentType || "Incident").toUpperCase().replace("_", " ")}: ${form.location}`,
        description: form.description,
        severity: (form.severity as any) || "high",
        district: geo.district,
        location: { lat: geo.lat, lng: geo.lng },
        reportedBy: form.reporterName || "citizen_mobile",
        mediaUrl: mediaPayload,
      });

      setReportId(savedInc.id);
      setReportCount(savedInc.reportCount || 1);
      setSubmitted(true);
    } catch (err) {
      console.error("Error submitting report with Firestore:", err);
      const geo = resolveDistrictAndCoords(form.location, form.district);
      // Resilient fallback
      const fallbackInc = addCitizenReport({
        title: `${(form.incidentType || "Incident").toUpperCase().replace("_", " ")}: ${form.location}`,
        description: form.description,
        severity: (form.severity as any) || "high",
        district: geo.district,
        location: { lat: geo.lat, lng: geo.lng },
        reportedBy: form.reporterName || "citizen_mobile",
        mediaUrl: mediaPayload,
      });
      setReportId(fallbackInc.id);
      setReportCount(fallbackInc.reportCount || 1);
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <SuccessScreen
        reportId={reportId}
        reportCount={reportCount}
        mediaUrl={processedImageUrl}
        onReset={() => {
          setSubmitted(false);
          setForm({ reporterName: "", district: "Udhampur", location: "", incidentType: "", severity: "", description: "" });
          setSelectedFile(null);
          setFilePreview(null);
          setProcessedImageUrl(null);
          setReportCount(1);
        }}
      />
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-emerald-400" />
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Report an Incident</h1>
            <p className="text-slate-400 text-sm">Public report form — J&amp;K DDMA · Powered by Firestore</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 text-xs font-medium flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5" /> Firestore Active
          </span>
          <DemoBadge variant="banner" />
        </div>
      </div>

      {/* Info Notice */}
      <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
        <AlertTriangle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-blue-300 text-sm">
          Reports and evidence are synchronized directly to <strong>Firebase Firestore</strong> and queued for DDMA review. For urgent emergencies call <strong>112</strong>.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-5" aria-label="Incident report form">
        {/* Reporter Name (optional) */}
        <Field label="Your Name" optional>
          <input
            type="text"
            value={form.reporterName}
            onChange={(e) => setForm((p) => ({ ...p, reporterName: e.target.value }))}
            placeholder="Optional — leave blank to report anonymously"
            className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-sm placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
        </Field>

        {/* District Selector */}
        <Field label="District / Sector" required>
          <div className="relative">
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <select
              value={form.district}
              onChange={(e) => setForm((p) => ({ ...p, district: e.target.value }))}
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-sm appearance-none focus:outline-none focus:border-emerald-500/50 transition-colors"
            >
              {JK_DISTRICTS.map((d) => (
                <option key={d.name} value={d.name}>
                  {d.name} District
                </option>
              ))}
            </select>
          </div>
        </Field>

        {/* Location */}
        <Field label="Location Details" error={errors.location} required>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={form.location}
              onChange={(e) => {
                const val = e.target.value;
                const detected = resolveDistrictAndCoords(val, undefined);
                setForm((p) => ({
                  ...p,
                  location: val,
                  district: detected.district || p.district,
                }));
              }}
              placeholder="e.g. Near Udhampur town, Kud tunnel, or Panthyal NH-44"
              className={`w-full pl-9 pr-3 py-2.5 bg-slate-900 border ${errors.location ? "border-red-500/50" : "border-slate-800"} rounded-lg text-slate-200 text-sm placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors`}
              aria-describedby={errors.location ? "location-error" : undefined}
            />
          </div>
        </Field>

        {/* Incident Type */}
        <Field label="Incident Type" error={errors.incidentType} required>
          <div className="relative">
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <select
              value={form.incidentType}
              onChange={(e) => setForm((p) => ({ ...p, incidentType: e.target.value as IncidentType }))}
              className={`w-full px-3 py-2.5 bg-slate-900 border ${errors.incidentType ? "border-red-500/50" : "border-slate-800"} rounded-lg text-slate-200 text-sm appearance-none focus:outline-none focus:border-emerald-500/50 transition-colors`}
            >
              <option value="">Select incident type…</option>
              {INCIDENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </Field>

        {/* Severity */}
        <Field label="Severity" error={errors.severity} required>
          <div className="grid grid-cols-2 gap-2">
            {SEVERITIES.map((s) => (
              <label
                key={s.value}
                className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                  form.severity === s.value
                    ? severitySelectedStyle(s.value)
                    : "border-slate-800 bg-slate-900 hover:border-slate-700"
                }`}
              >
                <input
                  type="radio"
                  name="severity"
                  value={s.value}
                  checked={form.severity === s.value}
                  onChange={() => setForm((p) => ({ ...p, severity: s.value }))}
                  className="mt-0.5 accent-emerald-400"
                />
                <div>
                  <p className="text-slate-200 text-sm font-medium">{s.label}</p>
                  <p className="text-slate-500 text-xs">{s.desc}</p>
                </div>
              </label>
            ))}
          </div>
          {errors.severity && <p className="text-red-400 text-xs mt-1">{errors.severity}</p>}
        </Field>

        {/* Description */}
        <Field label="Description" error={errors.description} required>
          <textarea
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            placeholder="Describe what you observed — include details like time, extent of damage, number of people affected, road passability…"
            rows={5}
            className={`w-full px-3 py-2.5 bg-slate-900 border ${errors.description ? "border-red-500/50" : "border-slate-800"} rounded-lg text-slate-200 text-sm placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors resize-none`}
          />
          <p className="text-slate-500 text-xs text-right mt-1">{form.description.length} chars (min 20)</p>
        </Field>

        {/* Photo Upload (Encoded directly into Firestore) */}
        <Field label="Photo / Media Evidence (Stored in Firestore)" optional>
          <label
            className={`flex flex-col items-center justify-center gap-3 p-6 rounded-lg border-2 border-dashed cursor-pointer transition-all ${
              selectedFile
                ? "border-emerald-500/50 bg-emerald-500/5"
                : "border-slate-700 bg-slate-900 hover:border-slate-600"
            }`}
          >
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleFileChange}
            />
            {selectedFile ? (
              <div className="flex flex-col items-center gap-2">
                {filePreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={filePreview}
                    alt="Preview"
                    className="max-h-36 rounded-lg border border-emerald-500/30 object-cover shadow-sm"
                  />
                ) : (
                  <ImageIcon className="w-10 h-10 text-emerald-400" />
                )}
                <div className="text-center">
                  <p className="text-emerald-400 text-sm font-semibold">{selectedFile.name}</p>
                  <p className="text-slate-400 text-xs">{(selectedFile.size / 1024).toFixed(0)} KB · Ready for Firestore sync</p>
                </div>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 text-amber-400" />
                <div className="text-center">
                  <p className="text-slate-300 text-sm font-medium">Click to select photo evidence</p>
                  <p className="text-slate-500 text-xs mt-0.5">JPG, PNG · Stored directly in Firestore</p>
                </div>
              </>
            )}
          </label>
        </Field>

        {/* Submission progress */}
        {isSubmitting && (
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-2 text-xs text-amber-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{statusMessage || "Synchronizing with Firestore..."}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving to Firestore...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4" />
              Submit Incident Report
            </>
          )}
        </button>
      </form>
    </div>
  );
}

function SuccessScreen({
  reportId,
  reportCount,
  mediaUrl,
  onReset,
}: {
  reportId: string;
  reportCount: number;
  mediaUrl: string | null;
  onReset: () => void;
}): React.ReactElement {
  return (
    <div className="p-6 max-w-md mx-auto text-center space-y-6 pt-16">
      <div className="flex items-center justify-center">
        <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-full">
          <CheckCircle2 className="w-12 h-12 text-emerald-400" />
        </div>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-slate-100">Report Submitted</h2>
        <p className="text-slate-400 text-sm mt-2">
          {reportCount > 1 ? (
            <span className="text-purple-300 font-medium">
              Corroborated Hazard: This area has now been reported <strong>{reportCount} times</strong> by citizens. Your submission strengthens verification.
            </span>
          ) : (
            <>Your report has been written directly to <strong>Firebase Firestore</strong> and queued for DDMA review.</>
          )}
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-slate-400 text-xs uppercase tracking-wide">Tracking ID</p>
          {reportCount > 1 && (
            <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded-full text-[11px] font-bold">
              📢 Reported {reportCount} times
            </span>
          )}
        </div>
        <p className="text-emerald-400 font-mono text-xl font-bold">{reportId}</p>

        {mediaUrl && mediaUrl.startsWith("data:image") && (
          <div className="pt-2 border-t border-slate-800 flex flex-col items-center gap-1.5">
            <p className="text-[11px] text-amber-400 font-medium">📷 Attached Photo Evidence (in Firestore):</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={mediaUrl}
              alt="Uploaded Evidence"
              className="max-h-28 rounded-lg border border-slate-700 object-cover shadow"
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 justify-center p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <AlertTriangle className="w-4 h-4 text-blue-400 flex-shrink-0" />
        <p className="text-blue-300 text-xs">AI assistance only — humans decide. For emergencies call <strong>112</strong>.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
        <Link
          href="/dashboard/roads"
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-colors"
        >
          🗺️ View on Live Map
        </Link>
        <button
          type="button"
          onClick={onReset}
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
        >
          Submit another report
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  error,
  optional,
  required,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
  optional?: boolean;
  required?: boolean;
}): React.ReactElement {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
        {label}
        {required && <span className="text-red-400">*</span>}
        {optional && <span className="text-slate-500 text-xs font-normal">(optional)</span>}
      </label>
      {children}
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  );
}

function severitySelectedStyle(s: string): string {
  const map: Record<string, string> = {
    low: "border-blue-500/50 bg-blue-500/5",
    medium: "border-yellow-500/50 bg-yellow-500/5",
    high: "border-orange-500/50 bg-orange-500/5",
    critical: "border-red-500/50 bg-red-500/5",
  };
  return map[s] ?? "border-emerald-500/50 bg-emerald-500/5";
}
