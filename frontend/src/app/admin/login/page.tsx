"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldAlert, Lock, User, ArrowRight, ShieldCheck, Info } from "lucide-react";
import { DemoBadge } from "@/components/shared/DemoBadge";

export default function AdminLoginPage(): React.ReactElement {
  const router = useRouter();
  const [username, setUsername] = useState("ddma_ramban_commander");
  const [password, setPassword] = useState("••••••••••••");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Simulated authenticated session token
    setTimeout(() => {
      setIsLoading(false);
      router.push("/admin/dashboard");
    }, 600);
  };

  const handleQuickDemoLogin = () => {
    setUsername("ddma_ramban_commander");
    setPassword("secure_eoc_2026");
    setIsLoading(true);
    setTimeout(() => {
      router.push("/admin/dashboard");
    }, 400);
  };

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-red-600/20 border border-red-600/40 rounded-2xl text-red-500 mb-2">
            <ShieldAlert className="w-8 h-8 animate-pulse" />
          </div>
          <h1 className="text-2xl font-black text-stone-100 tracking-tight">
            AAPDA GRID CONTROL ROOM
          </h1>
          <p className="text-xs text-stone-400">
            Authorized Incident Command &amp; Emergency Operations Centre
          </p>
          <div className="flex justify-center pt-1">
            <DemoBadge variant="inline" />
          </div>
        </div>

        {/* Login Box */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-2xl space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-stone-800 text-xs text-stone-400">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>Multi-Factor Authorized DDMA Terminal Access</span>
          </div>

          {error && (
            <div className="p-3 bg-red-950/50 border border-red-800 rounded-xl text-red-400 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block text-stone-300 font-semibold mb-1">
                Officer ID / Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. ddma_ramban_commander"
                  className="w-full pl-9 pr-3 py-2 bg-stone-800 border border-stone-700 rounded-xl text-stone-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-stone-300 font-semibold mb-1">
                Password / Digital Signature
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter authorized password"
                  className="w-full pl-9 pr-3 py-2 bg-stone-800 border border-stone-700 rounded-xl text-stone-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-colors text-xs"
            >
              {isLoading ? "Authenticating Digital Signature..." : "Enter Command Centre"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Login Pill for Judges */}
          <div className="pt-2 border-t border-stone-800 text-center">
            <button
              type="button"
              onClick={handleQuickDemoLogin}
              className="w-full py-2 px-3 bg-red-950/40 hover:bg-red-900/40 border border-red-800/60 rounded-xl text-red-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
            >
              <ShieldCheck className="w-4 h-4 text-red-400" />
              🚀 Instant 1-Click Demo Login (DDMA Commander)
            </button>
            <p className="text-[10px] text-stone-500 mt-2">
              For judges &amp; jury: Instantly authenticates with full EOC review &amp; alert broadcasting rights.
            </p>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center">
          <Link
            href="/dashboard/roads"
            className="text-xs text-stone-400 hover:text-stone-200 transition-colors"
          >
            ← Return to Public Citizen Map
          </Link>
        </div>
      </div>
    </div>
  );
}
