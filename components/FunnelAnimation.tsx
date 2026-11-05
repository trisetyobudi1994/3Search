"use client";

import { motion } from "framer-motion";

interface Props { stage1: number; stage2: number; stage3: number; stage4: number; }

const STAGES = [
  { key: "stage1", label: "Kandidat awal", desc: "Semua produk kategori" },
  { key: "stage2", label: "Lolos filter", desc: "Rating, review, momentum" },
  { key: "stage3", label: "Skor sinyal", desc: "Velocity, konversi, growth" },
  { key: "stage4", label: "Top kandidat", desc: "Verifikasi & margin" },
] as const;

export default function FunnelAnimation(props: Props) {
  return (
    <div className="mx-auto w-full max-w-3xl perspective-1200">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4" style={{ transformStyle: "preserve-3d" }}>
        {STAGES.map((s, i) => (
          <motion.div
            key={s.key}
            initial={{ opacity: 0, y: 20, rotateX: -15 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ delay: i * 0.35, duration: 0.6, type: "spring", stiffness: 100, damping: 15 }}
            whileHover={{ y: -4, z: 15 }}
            style={{ transformStyle: "preserve-3d" }}
            className="relative rounded-2xl bg-white p-4 text-center shadow-3d-sm ring-1 ring-zinc-200/70 transition-shadow hover:shadow-3d"
          >
            <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">{s.label}</div>
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.35 + 0.2, duration: 0.5, type: "spring", stiffness: 120 }}
              className={`mt-1 text-3xl font-bold ${i === 3 ? "gradient-text" : "text-zinc-900"}`}
            >
              {props[s.key]}
            </motion.div>
            <div className="mt-1 text-[11px] leading-tight text-zinc-500">{s.desc}</div>
          </motion.div>
        ))}
      </div>
      <p className="mt-4 text-center text-xs text-zinc-500">
        Presisi historis top-3: <span className="font-semibold text-zinc-900">~58%</span> · Bukan jaminan laku.
      </p>
    </div>
  );
}
