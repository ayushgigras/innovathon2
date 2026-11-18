"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shield,
  MapPin,
  Radio,
  ArrowRight,
  AlertTriangle,
  Globe,
  Map,
  Truck,
  Wrench,
  Clock,
  PhoneCall,
  CheckCircle2,
  Lock,
  Compass,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import {
  HOME_TRANSLATIONS,
  SupportedLanguage,
} from "@/lib/i18n/home-translations";
import { LocationSelectorModal } from "@/components/shared/LocationSelectorModal";

const LANGUAGES: { code: SupportedLanguage; label: string; nativeName: string }[] = [
  { code: "en", label: "English", nativeName: "English" },
  { code: "hi", label: "Hindi", nativeName: "हिन्दी" },
  { code: "ur", label: "Urdu", nativeName: "اردو" },
];

export default function HomePage(): React.ReactElement {
  const router = useRouter();
  const [lang, setLang] = useState<SupportedLanguage>("en");
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [currentDistrict, setCurrentDistrict] = useState("All J&K");

  // Load saved language and district preference
  useEffect(() => {
    try {
      const savedLang = localStorage.getItem("aapda_portal_lang") as SupportedLanguage;
      if (savedLang && ["en", "hi", "ur"].includes(savedLang)) {
        setLang(savedLang);
      }
      const savedDist = localStorage.getItem("aapda_citizen_district");
      if (savedDist) {
        setCurrentDistrict(savedDist);
      }
    } catch (e) {
      console.warn("Home state load error:", e);
    }
  }, []);

  const handleLanguageChange = (newLang: SupportedLanguage) => {
    setLang(newLang);
    try {
      localStorage.setItem("aapda_portal_lang", newLang);
      window.dispatchEvent(new CustomEvent("aapda_language_changed", { detail: newLang }));
    } catch (e) {
      console.warn("Storage language set error:", e);
    }
  };

  const handleOpenAapdaGrid = () => {
    // Open the location prompt modal before entering overview
    setIsLocationModalOpen(true);
  };

  const handleLocationSelect = (district: string) => {
    setIsLocationModalOpen(false);
    try {
      localStorage.setItem("aapda_citizen_district", district);
      window.dispatchEvent(new CustomEvent("aapda_district_changed", { detail: district }));
    } catch (e) {
      console.warn("Storage district set error:", e);
    }
    // Navigate straight to the overview layout
    router.push("/dashboard");
  };

  const t = HOME_TRANSLATIONS[lang] || HOME_TRANSLATIONS.en;
  const isRtl = lang === "ur";

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      className="min-h-screen bg-[#F4F5F7] text-[#0F172A] flex flex-col selection:bg-[#DC2626] selection:text-white"
    >
      {/* ── 1. Top Government Utility Ribbon ─────────────────────────────────── */}
      <div className="bg-[#0F172A] border-b border-slate-800 text-[11px] text-[#F8FAFC] py-2 px-4 sm:px-8 flex flex-wrap items-center justify-between gap-2 shadow-sm z-40">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
          <span className="font-bold tracking-wider uppercase text-[10px] text-[#F8FAFC]/90">
            {t.topBadge}
          </span>
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          <span className="text-[#FBBF24] font-bold flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-[#DC2626] animate-pulse" />
            24x7 SEOC Helpline: 1077
          </span>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <Link
            href="/admin/login"
            className="hover:text-white text-[#94A3B8] hidden sm:flex items-center gap-1.5 transition-colors font-medium"
          >
            <Lock className="w-3 h-3 text-[#10B981]" />
            {t.adminLoginBtn}
          </Link>
        </div>
      </div>

      {/* ── 2. Main Navigation Header (Civic Sentinel Light Theme) ───────────── */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] px-4 sm:px-8 py-3.5 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-[#065F46]/10 border border-[#065F46]/20 flex items-center justify-center text-[#065F46] group-hover:scale-105 transition-transform shadow-sm">
              <Shield className="w-6 h-6 text-[#065F46]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                {/* Brand Title: Deep Ink Navy font-extrabold */}
                <span className="font-extrabold text-xl tracking-tight text-[#0F172A] group-hover:text-[#065F46] transition-colors">
                  {t.brandTitle}
                </span>

                {/* Status Pill: Live Status Badge with pulsing green dot */}
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] text-[11px] font-bold tracking-wide">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#059669]" />
                  </span>
                  LIVE • J&amp;K
                </span>
              </div>
              {/* Secondary Subtitle */}
              <span className="text-xs text-[#475569] font-medium block truncate">
                {t.brandSubtitle}
              </span>
            </div>
          </Link>

          {/* Right Header Controls: Language Switcher + AAPDA Grid Button */}
          <div className="flex items-center gap-3">
            {/* ── Language Switcher (English, Hindi, Urdu) ─────────────────── */}
            <div className="flex items-center p-1 bg-[#F1F5F9] border border-[#CBD5E1] rounded-xl text-xs shadow-inner">
              <Globe className="w-3.5 h-3.5 text-[#64748B] mx-1.5 hidden sm:inline" />
              {LANGUAGES.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => handleLanguageChange(item.code)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    lang === item.code
                      ? "bg-[#0F172A] text-white shadow-sm"
                      : "text-[#475569] hover:text-[#0F172A]"
                  }`}
                  title={`Switch language to ${item.label}`}
                >
                  {item.nativeName}
                </button>
              ))}
            </div>

            {/* ── Top-Right Corner Primary Official Action: AAPDA GRID PORTAL ── */}
            <button
              type="button"
              onClick={handleOpenAapdaGrid}
              className="px-4 py-2.5 bg-[#065F46] hover:bg-[#047857] text-white font-bold text-xs sm:text-sm rounded-xl flex items-center gap-2 shadow-sm transition-all hover:scale-[1.02] border border-[#047857]"
              title="Open Overview Layout — Will prompt for location"
            >
              <Compass className="w-4 h-4 text-emerald-200" />
              <span>{t.navAapdaGridBtn}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── 3. Hero Section with 4% Topographic Contour Pattern ─────────────── */}
      <section className="relative overflow-hidden pt-8 pb-10 sm:pt-12 sm:pb-12 border-b border-[#E2E8F0] bg-[#F4F5F7]">
        {/* ── 4% Opacity Topographic Contour Line SVG Pattern ───────────────── */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'%3E%3Cpath d='M0 80 C 25 50, 55 50, 80 80 C 105 110, 135 110, 160 80 M0 40 C 35 20, 65 20, 95 45 C 125 70, 145 70, 160 40 M0 120 C 25 145, 60 145, 95 115 C 130 85, 145 110, 160 120 M0 0 C 40 25, 80 25, 120 0 M40 160 C 80 135, 120 135, 160 160' stroke='%230F172A' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
            backgroundSize: "160px 160px",
          }}
        />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-5">
          {/* Region Tag Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs font-bold uppercase tracking-wider shadow-sm">
            <Radio className="w-3.5 h-3.5 text-[#DC2626] animate-pulse" />
            <span>{t.heroSubheadline}</span>
          </div>

          {/* Hero Headline with Deep Ink Navy and Signal Crimson Highlight */}
          <h1 className="text-3xl sm:text-5xl lg:text-[3.25rem] font-black text-[#0F172A] tracking-tight leading-[1.15] max-w-4xl mx-auto">
            {lang === "en" ? (
              <>
                Real-Time Mountain Disaster Sentinel &amp;{" "}
                <span className="text-[#DC2626]">Emergency Response</span> for J&amp;K
              </>
            ) : lang === "hi" ? (
              <>
                जम्मू-कश्मीर के लिए वास्तविक समय पर्वतीय आपदा संप्रहरी एवं{" "}
                <span className="text-[#DC2626]">आपातकालीन प्रतिक्रिया</span>
              </>
            ) : (
              <>
                جموں و کشمیر کے لیے پہاڑی آفات کا ریئل ٹائم انتباہ اور{" "}
                <span className="text-[#DC2626]">ہنگامی ردعمل</span>
              </>
            )}
          </h1>

          {/* Hero Body Copy (Dark Slate for WCAG AAA) */}
          <p className="text-base sm:text-lg text-[#334155] max-w-3xl mx-auto leading-relaxed font-normal">
            {t.heroDesc}
          </p>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            {/* Primary Emergency CTA */}
            <button
              type="button"
              onClick={handleOpenAapdaGrid}
              className="px-6 py-3.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold text-sm rounded-xl flex items-center gap-2 shadow-sm transition-all hover:scale-[1.02] border border-[#B91C1C]"
            >
              <MapPin className="w-4 h-4" />
              <span>{t.ctaEnterGrid}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Secondary CTA: Live Road Map */}
            <Link
              href="/dashboard/roads"
              className="px-5 py-3.5 bg-white hover:bg-[#F8FAFC] text-[#0F172A] border border-[#CBD5E1] font-bold text-sm rounded-xl flex items-center gap-2 shadow-sm transition-all"
            >
              <Map className="w-4 h-4 text-[#065F46]" />
              <span>{t.ctaLiveRoadMap}</span>
            </Link>

            {/* Secondary CTA: Report an Incident */}
            <Link
              href="/dashboard/incidents/report"
              className="px-5 py-3.5 bg-white hover:bg-[#F8FAFC] text-[#0F172A] border border-[#CBD5E1] font-bold text-sm rounded-xl flex items-center gap-2 shadow-sm transition-all"
            >
              <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
              <span>{t.ctaReportIncident}</span>
            </Link>
          </div>

          {/* ── 4. Above-the-Fold KPI Metric Cards ─────────────────────────────── */}
          <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-3.5 max-w-4xl mx-auto text-left">
            <div className="p-3.5 rounded-xl bg-white border border-[#E2E8F0] shadow-sm">
              <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
                {t.statsMonitoredAxis}
              </span>
              <span className="text-base sm:text-lg font-black text-[#0F172A] mt-1 block">
                {t.statsMonitoredAxisVal}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-[#E2E8F0] shadow-sm">
              <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
                {t.statsEmergencyUnits}
              </span>
              <span className="text-base sm:text-lg font-black text-[#065F46] mt-1 block">
                {t.statsEmergencyUnitsVal}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-[#E2E8F0] shadow-sm">
              <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
                {t.statsReliefDepots}
              </span>
              <span className="text-base sm:text-lg font-black text-[#0F172A] mt-1 block">
                {t.statsReliefDepotsVal}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-[#E2E8F0] shadow-sm">
              <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
                {t.statsResponseTime}
              </span>
              <span className="text-base sm:text-lg font-black text-[#065F46] mt-1 block">
                {t.statsResponseTimeVal}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. 4 Core Pillars Section (High Contrast Light Theme) ────────────── */}
      <section className="py-14 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 w-full">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <span className="text-xs font-bold text-[#991B1B] uppercase tracking-wider bg-[#FEF2F2] border border-[#FECACA] px-3 py-1 rounded-full">
            Integrated Command System
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-[#0F172A] pt-1">
            How AAPDA Grid Safeguards Jammu &amp; Kashmir
          </h2>
          <p className="text-sm text-[#475569]">
            A real-time network connecting citizens, satellite radar, BRO heavy earthmovers, and district emergency control rooms.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Pillar 1 */}
          <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] hover:border-[#065F46]/50 transition-all shadow-sm space-y-3 group">
            <div className="w-12 h-12 rounded-xl bg-[#065F46]/10 text-[#065F46] flex items-center justify-center group-hover:scale-105 transition-transform">
              <Map className="w-6 h-6" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-[#0F172A] group-hover:text-[#065F46] transition-colors">
              {t.pillar1Title}
            </h3>
            <p className="text-sm text-[#475569] leading-relaxed">
              {t.pillar1Desc}
            </p>
            <div className="pt-2">
              <Link
                href="/dashboard/roads"
                className="text-xs font-bold text-[#065F46] hover:text-[#047857] inline-flex items-center gap-1 underline underline-offset-4"
              >
                Explore Road Map <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] hover:border-[#DC2626]/50 transition-all shadow-sm space-y-3 group">
            <div className="w-12 h-12 rounded-xl bg-[#DC2626]/10 text-[#DC2626] flex items-center justify-center group-hover:scale-105 transition-transform">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-[#0F172A] group-hover:text-[#DC2626] transition-colors">
              {t.pillar2Title}
            </h3>
            <p className="text-sm text-[#475569] leading-relaxed">
              {t.pillar2Desc}
            </p>
            <div className="pt-2">
              <Link
                href="/dashboard/incidents/report"
                className="text-xs font-bold text-[#DC2626] hover:text-[#B91C1C] inline-flex items-center gap-1 underline underline-offset-4"
              >
                Submit Citizen Report <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] hover:border-[#D97706]/50 transition-all shadow-sm space-y-3 group">
            <div className="w-12 h-12 rounded-xl bg-[#D97706]/10 text-[#D97706] flex items-center justify-center group-hover:scale-105 transition-transform">
              <Truck className="w-6 h-6" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-[#0F172A] group-hover:text-[#D97706] transition-colors">
              {t.pillar3Title}
            </h3>
            <p className="text-sm text-[#475569] leading-relaxed">
              {t.pillar3Desc}
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={handleOpenAapdaGrid}
                className="text-xs font-bold text-[#D97706] hover:text-[#B45309] inline-flex items-center gap-1 underline underline-offset-4"
              >
                Inspect RahatGrid Fleet <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Pillar 4 */}
          <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] hover:border-[#0F172A]/40 transition-all shadow-sm space-y-3 group">
            <div className="w-12 h-12 rounded-xl bg-[#0F172A]/10 text-[#0F172A] flex items-center justify-center group-hover:scale-105 transition-transform">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-[#0F172A] group-hover:text-[#065F46] transition-colors">
              {t.pillar4Title}
            </h3>
            <p className="text-sm text-[#475569] leading-relaxed">
              {t.pillar4Desc}
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={handleOpenAapdaGrid}
                className="text-xs font-bold text-[#065F46] hover:text-[#047857] inline-flex items-center gap-1 underline underline-offset-4"
              >
                Set Sector &amp; View Advisories <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. Emergency Helplines Strip (High-Contrast Slate Navy) ──────────── */}
      <section className="bg-[#0F172A] border-y border-slate-800 py-8 px-4 sm:px-6 shadow-inner text-white">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <h3 className="text-base font-bold text-white flex items-center justify-center md:justify-start gap-2">
              <PhoneCall className="w-4 h-4 text-[#DC2626]" />
              {t.emergencyHelplinesTitle}
            </h3>
            <p className="text-xs text-[#94A3B8]">
              {t.emergencyHelplinesDesc}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-mono font-bold">
            <a
              href="tel:112"
              className="px-4 py-2 bg-[#1E293B] border border-slate-700 hover:border-[#DC2626] text-white rounded-xl transition-colors shadow-sm"
            >
              📞 112 (National)
            </a>
            <a
              href="tel:1077"
              className="px-4 py-2 bg-[#1E293B] border border-[#DC2626]/60 text-[#FCA5A5] rounded-xl transition-colors shadow-sm"
            >
              🚨 1077 (SEOC J&amp;K)
            </a>
            <a
              href="tel:1033"
              className="px-4 py-2 bg-[#1E293B] border border-slate-700 hover:border-[#10B981] text-white rounded-xl transition-colors shadow-sm"
            >
              🛣️ 1033 (NHAI Emergency)
            </a>
          </div>
        </div>
      </section>

      {/* ── 7. Official Footer ──────────────────────────────────────────────── */}
      <footer className="mt-auto bg-[#0B1120] border-t border-slate-900 py-8 px-4 sm:px-8 text-xs text-[#94A3B8]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <p className="font-semibold text-slate-200">{t.footerRights}</p>
            <p className="text-[11px] text-[#64748B]">{t.footerDisclaimer}</p>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <button
              type="button"
              onClick={handleOpenAapdaGrid}
              className="text-[#34D399] hover:underline"
            >
              {t.navAapdaGridBtn}
            </button>
            <span className="text-slate-700">•</span>
            <Link href="/admin/login" className="text-[#94A3B8] hover:text-white transition-colors">
              {t.adminLoginBtn}
            </Link>
          </div>
        </div>
      </footer>

      {/* ── Location Selector Modal (Triggered when clicking AAPDA Grid) ────── */}
      <LocationSelectorModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onSelectDistrict={handleLocationSelect}
        currentDistrict={currentDistrict}
      />
    </div>
  );
}
