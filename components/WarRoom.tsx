"use client";

import { motion } from "framer-motion";
import { TrendingUp, AlertTriangle, Lightbulb, Target } from "lucide-react";
import { useState } from "react";
import type { Insights } from "@/lib/types";

const COLOR_MAP = {
  green: { bg: "from-emerald-500 to-teal-500", text: "text-emerald-600", ring: "ring-emerald-200", soft: "bg-emerald-50" },
  amber: { bg: "from-amber-500 to-orange-500", text: "text-amber-600", ring: "ring-amber-200", soft: "bg-amber-50" },
  red: { bg: "from-rose-500 to-red-500", text: "text-rose-600", ring: "ring-rose-200", soft: "bg-rose-50" },
};

export default function WarRoom({ insights }: { insights: Insights }) {
  const color = COLOR_MAP[insights.opportunityColor];
  const [sellPrice, setSellPrice] = useState(insights.avgPrice || 100000);

  const cogs = Math.round(sellPrice * 0.4);
  const feeTiktok = Math.round(sellPrice * 0.05);
  const shipping = 10000;
  const profit = sellPrice - cogs - feeTiktok - shipping;
  const marginPercent = Math.round((profit / sellPrice) * 100);
  const roi = Math.round((profit / (cogs + shipping)) * 100);

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-white p-6 shadow-3d ring-1 ring-zinc-200/60"
      >
        <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${color.bg}`} />
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <div className={`inline-flex items-center gap-1.5 rounded-full ${color.soft} px-2.5 py-1 text-[10px] font-semibold ${color.text} ring-1 ${color.ring}`}>
              <Target className="h-3 w-3" />
              {insights.opportunityLabel}
            </div>
            <h3 className="mt-2 text-xl font-bold text-zinc-900">Market Opportunity</h3>
            <p className="mt-1 text-sm leading-relaxed text-zinc-600">
              {insights.opportunityReason}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-center">
            <div className="relative h-24 w-24">
              <svg viewBox="0 0 100 100" className="-rotate-90">
                <circle cx="50" cy="50" r="42" stroke="#f4f4f5" strokeWidth="10" fill="none" />
                <motion.circle
                  cx="50" cy="50" r="42"
                  stroke="currentColor"
                  className={color.text}
                  strokeWidth="10" fill="none" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 42}
                  initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - insights.opportunityScore / 100) }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-2xl font-bold ${color.text}`}>{insights.opportunityScore}</span>
                <span className="text-[9px] text-zinc-400">/100</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-3xl bg-white p-6 shadow-3d ring-1 ring-zinc-200/60"
        >
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg gradient-bg">
              <TrendingUp className="h-3.5 w-3.5 text-white" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-900">Peta Merek</h3>
            <span className="text-[10px] text-zinc-400">(top {insights.brands.length})</span>
          </div>
          <div className="space-y-2.5">
            {insights.brands.map((b, i) => (
              <div key={b.brand}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="truncate font-medium text-zinc-800">
                    {i + 1}. {b.brand}
                  </span>
                  <span className="ml-2 shrink-0 text-zinc-500">
                    {b.count} produk · {b.percent}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${b.percent}%` }}
                    transition={{ delay: 0.3 + i * 0.1, duration: 0.8, ease: "easeOut" }}
                    className={`h-full rounded-full bg-gradient-to-r ${
                      i === 0 ? "from-violet-500 to-blue-500" : "from-zinc-300 to-zinc-400"
                    }`}
                  />
                </div>
              </div>
            ))}
            {insights.brands.length === 0 && (
              <p className="text-xs text-zinc-400">Tidak ada data merek</p>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-3xl bg-white p-6 shadow-3d ring-1 ring-zinc-200/60"
        >
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg gradient-bg">
              <AlertTriangle className="h-3.5 w-3.5 text-white" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-900">Saturasi Pasar</h3>
          </div>
          <div className="flex flex-col items-center">
            <svg viewBox="0 0 200 110" className="w-full max-w-[240px]">
              <defs>
                <linearGradient id="satGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="50%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
              </defs>
              <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#f4f4f5" strokeWidth="16" strokeLinecap="round" />
              <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="url(#satGrad)" strokeWidth="16" strokeLinecap="round" strokeDasharray={`${(insights.saturationLevel / 100) * 251} 251`} />
              <motion.g
                initial={{ rotate: -90 }}
                animate={{ rotate: -90 + (insights.saturationLevel / 100) * 180 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                style={{ transformOrigin: "100px 100px" }}
              >
                <line x1="100" y1="100" x2="100" y2="40" stroke="#18181b" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="100" cy="100" r="4" fill="#18181b" />
              </motion.g>
            </svg>
            <div className="-mt-2 text-center">
              <div className="text-xl font-bold text-zinc-900">{insights.saturationLevel}/100</div>
              <div className="text-xs font-medium text-zinc-600">{insights.saturationLabel}</div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-center">
            <div className="rounded-xl bg-zinc-50 p-2">
              <div className="text-sm font-bold text-zinc-900">{insights.totalProducts}</div>
              <div className="text-[10px] text-zinc-500">Produk dianalisis</div>
            </div>
            <div className="rounded-xl bg-zinc-50 p-2">
              <div className="text-sm font-bold text-zinc-900">{insights.totalSellers}+</div>
              <div className="text-[10px] text-zinc-500">Seller aktif</div>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-gradient-to-br from-violet-50 to-blue-50 p-6 ring-1 ring-violet-200/50"
      >
        <h3 className="text-sm font-semibold text-zinc-900">💰 Simulasi Profit</h3>
        <p className="mt-0.5 text-[11px] text-zinc-500">Asumsi: COGS 40%, fee TikTok 5%, ongkir Rp 10rb</p>
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-zinc-600">
            <span>Harga jual</span>
            <span className="font-semibold text-zinc-900">Rp {sellPrice.toLocaleString("id-ID")}</span>
          </div>
          <input
            type="range"
            min={Math.max(20000, insights.priceRange.min)}
            max={Math.max(500000, insights.priceRange.max)}
            step={1000}
            value={sellPrice}
            onChange={(e) => setSellPrice(Number(e.target.value))}
            className="mt-2 w-full accent-violet-600"
          />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-white/80 p-3 text-center ring-1 ring-white">
            <div className={`text-base font-bold ${profit > 0 ? "text-emerald-600" : "text-rose-600"}`}>
              Rp {profit.toLocaleString("id-ID")}
            </div>
            <div className="text-[10px] text-zinc-500">Profit / unit</div>
          </div>
          <div className="rounded-xl bg-white/80 p-3 text-center ring-1 ring-white">
            <div className="text-base font-bold text-zinc-900">{marginPercent}%</div>
            <div className="text-[10px] text-zinc-500">Margin</div>
          </div>
          <div className="rounded-xl bg-white/80 p-3 text-center ring-1 ring-white">
            <div className="text-base font-bold text-zinc-900">{roi}%</div>
            <div className="text-[10px] text-zinc-500">ROI</div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-white p-6 shadow-3d ring-1 ring-zinc-200/60"
      >
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg gradient-bg">
            <Lightbulb className="h-3.5 w-3.5 text-white" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-900">Action Playbook</h3>
        </div>
        <div className="space-y-2">
          {insights.playbook.map((item, i) => {
            const style =
              item.type === "do"
                ? "border-emerald-200 bg-emerald-50"
                : item.type === "dont"
                ? "border-rose-200 bg-rose-50"
                : "border-blue-200 bg-blue-50";
            const icon = item.type === "do" ? "✅" : item.type === "dont" ? "⚠️" : "ℹ️";
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className={`rounded-xl border ${style} p-3`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-sm">{icon}</span>
                  <div>
                    <div className="text-xs font-semibold text-zinc-900">{item.title}</div>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-600">{item.detail}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
          {insights.playbook.length === 0 && (
            <p className="text-xs text-zinc-400">Belum ada rekomendasi</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}