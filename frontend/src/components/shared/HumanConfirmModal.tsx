"use client";

import React, { useState } from "react";
import { ShieldAlert, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface HumanConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  aiReasoning: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "approve" | "reject" | "allocate";
}

export function HumanConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  aiReasoning,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "approve",
}: HumanConfirmModalProps): React.ReactElement | null {
  const [confirmed, setConfirmed] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = (): void => {
    setConfirmed(true);
    setTimeout(() => {
      setConfirmed(false);
      onConfirm();
    }, 400);
  };

  const confirmBtnClass =
    variant === "reject"
      ? "bg-red-600 hover:bg-red-700 text-white"
      : "bg-emerald-600 hover:bg-emerald-700 text-white";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-start gap-3 p-5 border-b border-slate-800">
          <ShieldAlert className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <h2 className="text-slate-100 font-semibold text-base">{title}</h2>
            <p className="text-slate-400 text-xs mt-0.5">Human confirmation required before action is applied</p>
          </div>
        </div>

        {/* AI Reasoning */}
        <div className="p-5 space-y-3">
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
            <p className="text-amber-400 text-xs font-semibold uppercase tracking-wide mb-1.5">
              AI Recommendation — Requires Human Review
            </p>
            <p className="text-slate-300 text-sm leading-relaxed">{aiReasoning}</p>
          </div>

          <p className="text-slate-400 text-xs">
            By clicking <strong className="text-slate-200">{confirmLabel}</strong>, you as the
            authorised DDMA officer take responsibility for this action. The AI system does not
            officially verify incidents, issue warnings, or dispatch responders.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-5 pt-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-800 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all",
              confirmBtnClass,
              confirmed && "opacity-70 scale-95"
            )}
          >
            {variant === "reject" ? (
              <XCircle className="w-4 h-4" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
            )}
            {confirmed ? "Processing…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
