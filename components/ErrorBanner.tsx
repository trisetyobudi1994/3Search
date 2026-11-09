"use client";

import { AlertTriangle, RefreshCw, X } from "lucide-react";

interface Props {
  message: string;
  hint?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export default function ErrorBanner({ message, hint, onRetry, onDismiss }: Props) {
  return (
    <div
      role="alert"
      className="relative overflow-hidden rounded-2xl border border-rose-200 bg-rose-50/90 p-4 shadow-3d-sm backdrop-blur"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
          <AlertTriangle className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-rose-900">{message}</p>
          {hint && <p className="mt-1 text-xs leading-relaxed text-rose-700">{hint}</p>}
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-rose-700 ring-1 ring-rose-200 transition-colors hover:bg-rose-100"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Coba lagi
            </button>
          )}
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Tutup pesan"
            className="rounded-lg p-1 text-rose-500 transition-colors hover:bg-rose-100"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
