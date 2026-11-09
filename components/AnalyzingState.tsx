"use client";

import { motion } from "framer-motion";
import { Check, Loader2, Radar, X } from "lucide-react";
import { useEffect, useState } from "react";
import { getRegion } from "@/lib/regions";
import type { RegionCode } from "@/lib/types";

interface Props {
  query: string;
  region: RegionCode;
  onCancel: () => void;
}

const STEPS = [
  { at: 0, label: "Menyiapkan pencarian", detail: "Validasi kata kunci & wilayah" },
  { at: 2, label: "Mengambil kandidat produk", detail: "Sumber data marketplace" },
  { at: 7, label: "Menyaring & memberi skor", detail: "Filter kualitas, duplikat, sinyal" },
  { at: 12, label: "Menyusun insight pasar", detail: "Saturasi, peta toko, simulasi" },
];

export default function AnalyzingState({ query, region, onCancel }: Props) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    setElapsed(0);
    const timer = setInterval(() => {
      setElapsed((current) => current + 0.2);
    }, 200);
    return () => clearInterval(timer);
  }, [query]);

  const activeIndex = STEPS.reduce(
    (acc, step, index) => (elapsed >= step.at ? index : acc),
    0
  );
  const progress = Math.min(94, Math.max(6, (elapsed / 18) * 100));
  const meta = getRegion(region);

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-xl flex-col items-center justify-center py-10">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-bg shadow-3d-glow"
      >
        <Radar className="h-7 w-7 animate-spin text-white" />
      </motion.div>

      <h2 className="mt-6 text-lg font-semibold text-zinc-900">
        Menganalisis pasar…
      </h2>
      <p className="mt-1 flex flex-wrap items-center justify-center gap-1.5 text-xs text-zinc-500">
        <span className="rounded-full bg-white px-2 py-0.5 ring-1 ring-zinc-200">
          {meta.flag} {meta.label}
        </span>
        <span className="max-w-[16rem] truncate rounded-full bg-white px-2 py-0.5 font-medium text-zinc-700 ring-1 ring-zinc-200">
          “{query}”
        </span>
      </p>

      <div className="mt-8 w-full rounded-3xl bg-white p-5 shadow-3d-sm ring-1 ring-zinc-200/60">
        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-zinc-100">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500"
            animate={{ width: `${progress}%` }}
            transition={{ ease: "easeOut", duration: 0.4 }}
          />
        </div>

        <ol className="space-y-3">
          {STEPS.map((step, index) => {
            const done = index < activeIndex;
            const active = index === activeIndex;
            return (
              <li key={step.label} className="flex items-start gap-3">
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${
                    done
                      ? "bg-emerald-100 text-emerald-600"
                      : active
                      ? "bg-violet-100 text-violet-600"
                      : "bg-zinc-100 text-zinc-400"
                  }`}
                >
                  {done ? (
                    <Check className="h-3 w-3" />
                  ) : active ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    index + 1
                  )}
                </span>
                <div className="min-w-0">
                  <div
                    className={`text-[13px] font-medium ${
                      active ? "text-zinc-900" : done ? "text-zinc-600" : "text-zinc-400"
                    }`}
                  >
                    {step.label}
                  </div>
                  <div className="text-[11px] text-zinc-400">{step.detail}</div>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="mt-5 flex items-center justify-between border-t border-zinc-100 pt-3 text-[11px] text-zinc-400">
          <span>{Math.floor(elapsed)} detik</span>
          <span>Data live biasanya 10–20 detik</span>
        </div>
      </div>

      <button
        type="button"
        onClick={onCancel}
        className="mt-6 inline-flex items-center gap-1.5 text-xs text-zinc-500 transition-colors hover:text-zinc-900"
      >
        <X className="h-3.5 w-3.5" />
        Batalkan analisis
      </button>
    </div>
  );
}
