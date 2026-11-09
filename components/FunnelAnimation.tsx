"use client";

import { motion } from "framer-motion";
import { formatNumber } from "@/lib/regions";

interface Props {
  stage1: number;
  stage2: number;
  stage3: number;
  stage4: number;
  hitRate?: { rate: number; total: number } | null;
}

const STAGES = [
  { key: "stage1", label: "Kandidat awal", desc: "Item dari sumber data" },
  { key: "stage2", label: "Lolos filter", desc: "Kualitas & duplikat" },
  { key: "stage3", label: "Skor kuat", desc: "Skor sinyal ≥ 55" },
  { key: "stage4", label: "Top kandidat", desc: "Siap divalidasi" },
] as const;

export default function FunnelAnimation(props: Props) {
  const { hitRate } = props;

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STAGES.map((stage, index) => {
          const value = props[stage.key];
          const previous = index === 0 ? null : props[STAGES[index - 1].key];
          const conversion =
            previous && previous > 0 ? Math.round((value / previous) * 100) : null;

          return (
            <motion.div
              key={stage.key}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.12, duration: 0.45 }}
              className="relative rounded-2xl bg-white p-4 text-center shadow-3d-sm ring-1 ring-zinc-200/70"
            >
              <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                {stage.label}
              </div>
              <div
                className={`mt-1 text-2xl font-bold sm:text-3xl ${
                  index === 3 ? "gradient-text" : "text-zinc-900"
                }`}
              >
                {formatNumber(value)}
              </div>
              <div className="mt-1 text-[10px] leading-tight text-zinc-500">
                {stage.desc}
              </div>
              {conversion !== null && (
                <div className="mt-2 inline-flex items-center rounded-full bg-zinc-50 px-2 py-0.5 text-[10px] font-medium text-zinc-500 ring-1 ring-zinc-200/60">
                  {conversion}% dari tahap sebelumnya
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <p className="mt-4 text-center text-xs leading-relaxed text-zinc-500">
        {hitRate
          ? `Presisi historis top-3: ${hitRate.rate}% dari ${formatNumber(
              hitRate.total
            )} feedback tervalidasi.`
          : "Presisi historis belum tersedia — belum ada feedback tervalidasi."}{" "}
        Angka ini bukan jaminan laku.
      </p>
    </div>
  );
}
