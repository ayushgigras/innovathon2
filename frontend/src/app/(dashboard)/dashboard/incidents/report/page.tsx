"use client";

import React, { useState } from "react";
import {
  FileText,
  MapPin,
  Upload,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";
import { DemoBadge } from "@/components/shared/DemoBadge";

type IncidentType = "road_block" | "flood" | "landslide" | "avalanche" | "bridge_damage" | "other";
type SeverityLevel = "low" | "medium" | "high" | "critical";

interface FormState {
  reporterName: string;
  location: string;
  incidentType: IncidentType | "";
  severity: SeverityLevel | "";
  description: string;
  hasPhoto: boolean;
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
    location: "",
    incidentType: "",
    severity: "",
    description: "",
    hasPhoto: false,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [reportId, setReportId] = useState("");

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

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!validate()) return;
    setReportId(generateReportId());
    setSubmitted(true);
  };

  if (submitted) {
    return <SuccessScreen reportId={reportId} onReset={() => { setSubmitted(false); setForm({ reporterName: "", location: "", incidentType: "", severity: "", description: "", hasPhoto: false }); }} />;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-emerald-400" />
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Report an Incident</h1>
            <p className="text-slate-400 text-sm">Public report form — J&amp;K DDMA</p>
          </div>
        </div>
        <DemoBadge variant="banner" />
      </div>

      {/* Info Notice */}
      <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
        <AlertTriangle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-blue-300 text-sm">
          Reports are queued for review by DDMA officers. <strong>AI assistance only — no automatic action is taken.</strong> For emergencies call <strong>112</strong>.
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

        {/* Location */}
        <Field label="Location" error={errors.location} required>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
              placeholder="e.g. NH-44 near Ramban, 3km north of town"
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

        {/* Photo Upload (UI only) */}
        <Field label="Photo / Video" optional>
          <label
            className={`flex flex-col items-center justify-center gap-3 p-6 rounded-lg border-2 border-dashed cursor-pointer transition-all ${
              form.hasPhoto
                ? "border-emerald-500/50 bg-emerald-500/5"
                : "border-slate-700 bg-slate-900 hover:border-slate-600"
            }`}
          >
            <input
              type="file"
              accept="image/*,video/*"
              className="sr-only"
              onChange={() => setForm((p) => ({ ...p, hasPhoto: true }))}
            />
            {form.hasPhoto ? (
              <>
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                <p className="text-emerald-400 text-sm font-medium">File attached</p>
              </>
            ) : (
              <>
                <Upload className="w-8 h-8 text-slate-500" />
                <div className="text-center">
                  <p className="text-slate-300 text-sm">Click to attach photo or video</p>
                  <p className="text-slate-500 text-xs mt-0.5">JPG, PNG, MP4 — max 50MB · optional</p>
                </div>
              </>
            )}
          </label>
        </Field>

        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          <FileText className="w-4 h-4" />
          Submit Report
        </button>
      </form>
    </div>
  );
}

function SuccessScreen({ reportId, onReset }: { reportId: string; onReset: () => void }): React.ReactElement {
  return (
    <div className="p-6 max-w-md mx-auto text-center space-y-6 pt-20">
      <div className="flex items-center justify-center">
        <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-full">
          <CheckCircle2 className="w-12 h-12 text-emerald-400" />
        </div>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-slate-100">Report Submitted</h2>
        <p className="text-slate-400 text-sm mt-2">
          Your report has been queued for review by DDMA officers. AI assistance may flag this for priority review.
        </p>
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <p className="text-slate-400 text-xs uppercase tracking-wide mb-2">Your Report ID</p>
        <p className="text-emerald-400 font-mono text-xl font-bold">{reportId}</p>
        <p className="text-slate-500 text-xs mt-2">Save this ID to follow up on your report status.</p>
      </div>
      <div className="flex items-center gap-2 justify-center p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <AlertTriangle className="w-4 h-4 text-blue-400 flex-shrink-0" />
        <p className="text-blue-300 text-xs">AI system only assists DDMA officers — no automatic action will be taken. For emergencies call <strong>112</strong>.</p>
      </div>
      <DemoBadge variant="banner" />
      <button
        type="button"
        onClick={onReset}
        className="text-slate-400 hover:text-slate-200 text-sm transition-colors"
      >
        Submit another report
      </button>
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
