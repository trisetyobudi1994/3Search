"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  Calculator,
  Lightbulb,
  Store,
  Target,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import type { Insights } from "@/lib/types";
import { DEFAULT_IDR_RATES, formatIDR, toIDR } from "@/lib/currency";
import { formatMoney, formatNumber } from "@/lib/regions";

const COLOR_MAP = {
  green: {
    bg: "from-emerald-500 to-teal-500",
    text: "text-emerald-600",
    ring: "ring-emerald-200",
    soft: "bg-emerald-50",
  },
  amber: {
    bg: "from-amber-500 to-orange-500",
    text: "text-amber-600",
    ring: "ring-amber-200",
    soft: "bg-amber-50",
  },
  red: {
    bg: "from-rose-500 to-red-500",
    text: "text-rose-600",
    ring: "ring-rose-200",
    soft: "bg-rose-50",
  },
} as const;

interface Props {
  insights: Insights;
  currency: string;
  /** Kurs yang dipakai server saat analisis; fallback ke default. */
  rates?: Record<string, number>;
}

export default function WarRoom({ insights, currency, rates }: Props) {
  const color = COLOR_MAP[insights.opportunityColor];
  const idrRates = rates ?? DEFAULT_IDR_RATES;

  // Simulasi selalu dalam Rupiah; harga region lain dikonversi lebih dulu.
  const avgPriceIDR =
    insights.avgPriceIDR > 0
      ? insights.avgPriceIDR
      : toIDR(insights.avgPrice, currency, idrRates);
  const hasAvgPrice = avgPriceIDR > 0;

  const rangeMinIDR =
    insights.priceRangeIDR?.min ||
    toIDR(insights.priceRange.min, currency, idrRates);
  const rangeMaxIDR =
    insights.priceRangeIDR?.max ||
    toIDR(insights.priceRange.max, currency, idrRates);

  const minPrice = Math.max(
    1_000,
    Math.round(
      (rangeMinIDR || (hasAvgPrice ? avgPriceIDR * 0.6 : 20_000)) / 1_000
    ) * 1_000
  );
  const maxPrice = Math.max(
    minPrice + 1_000,
    Math.round(
      (rangeMaxIDR || (hasAvgPrice ? avgPriceIDR * 1.8 : 500_000)) / 1_000
    ) * 1_000
  );

  const [sellPrice, setSellPrice] = useState(() =>
    Math.min(maxPrice, Math.max(minPrice, avgPriceIDR || minPrice))
  );
  const [cogsPercent, setCogsPercent] = useState(40);
  const [feePercent, setFeePercent] = useState(5);
  const [shipping, setShipping] = useState(() => {
    if (currency === "IDR") return 10_000;
    const localShipping = currency === "USD" ? 2 : 6;
    return Math.max(
      1_000,
      Math.round(toIDR(localShipping, currency, idrRates) / 1_000) * 1_000
    );
  });
  const [otherCost, setOtherCost] = useState(2_000);

  const cogs = Math.round((sellPrice * cogsPercent) / 100);
  const fee = Math.round((sellPrice * feePercent) / 100);
  const profit = Math.round(sellPrice - cogs - fee - shipping - otherCost);
  const marginPercent =
    sellPrice > 0 ? Math.round((profit / sellPrice) * 100) : 0;
  const investment = cogs + shipping + otherCost;
  const roi = investment > 0 ? Math.round((profit / investment) * 100) : 0;

  const marginRatio = 1 - (cogsPercent + feePercent) / 100;
  const breakEvenPrice =
    marginRatio > 0
      ? Math.round((shipping + otherCost) / marginRatio)
      : 0;

  const money = (value: number) => formatIDR(value);
  const step = 1_000;
  const shippingMax = Math.max(
    20_000,
    Math.round((sellPrice * 0.5) / 1_000) * 1_000
  );
  const rate = currency !== "IDR" ? idrRates[currency] ?? 1 : 1;

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-white p-6 shadow-3d ring-1 ring-zinc-200/60"
      >
        <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${color.bg}`} />
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <div
              className={`inline-flex items-center gap-1.5 rounded-full ${color.soft} px-2.5 py-1 text-[10px] font-semibold ${color.text} ring-1 ${color.ring}`}
            >
              <Target className="h-3 w-3" />
              {insights.opportunityLabel}
            </div>
            <h3 className="mt-2 text-xl font-bold text-zinc-900">Peluang Pasar</h3>
            <p className="mt-1 text-sm leading-relaxed text-zinc-600">
              {insights.opportunityReason}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-center">
            <div className="relative h-24 w-24">
              <svg viewBox="0 0 100 100" className="-rotate-90" aria-hidden>
                <circle cx="50" cy="50" r="42" stroke="#f4f4f5" strokeWidth="10" fill="none" />
                <motion.circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="currentColor"
                  className={color.text}
                  strokeWidth="10"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 42}
                  initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                  animate={{
                    strokeDashoffset:
                      2 * Math.PI * 42 * (1 - insights.opportunityScore / 100),
                  }}
                  transition={{ duration: 1.3, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-2xl font-bold ${color.text}`}>
                  {insights.opportunityScore}
                </span>
                <span className="text-[9px] text-zinc-400">/100</span>
              </div>
            </div>
            <span className="mt-1 text-[10px] text-zinc-400">Skor peluang</span>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-3xl bg-white p-6 shadow-3d ring-1 ring-zinc-200/60"
        >
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg gradient-bg">
              <Store className="h-3.5 w-3.5 text-white" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-900">Peta Toko & Merek</h3>
            <span className="text-[10px] text-zinc-400">
              ({insights.brands.length} teratas)
            </span>
          </div>
          <div className="space-y-2.5">
            {insights.brands.map((brand, index) => (
              <div key={brand.brand}>
                <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                  <span className="truncate font-medium text-zinc-800">
                    {index + 1}. {brand.brand}
                  </span>
                  <span className="shrink-0 text-zinc-500">
                    {brand.count} produk · {brand.percent}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${brand.percent}%` }}
                    transition={{ delay: 0.25 + index * 0.08, duration: 0.7 }}
                    className={`h-full rounded-full bg-gradient-to-r ${
                      index === 0
                        ? "from-violet-500 to-blue-500"
                        : "from-zinc-300 to-zinc-400"
                    }`}
                  />
                </div>
              </div>
            ))}
            {insights.brands.length === 0 && (
              <p className="text-xs text-zinc-400">Tidak ada data toko</p>
            )}
          </div>
          <p className="mt-4 text-[10px] leading-relaxed text-zinc-400">
            {formatNumber(insights.totalSellers)} toko unik dari{" "}
            {formatNumber(insights.totalProducts)} kandidat teratas.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 16 }}
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
            <svg viewBox="0 0 200 110" className="w-full max-w-[230px]" aria-hidden>
              <defs>
                <linearGradient id="saturationGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="50%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
              </defs>
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="#f4f4f5"
                strokeWidth="16"
                strokeLinecap="round"
              />
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="url(#saturationGradient)"
                strokeWidth="16"
                strokeLinecap="round"
                strokeDasharray={`${(insights.saturationLevel / 100) * 251} 251`}
              />
              <motion.g
                initial={{ rotate: -90 }}
                animate={{ rotate: -90 + (insights.saturationLevel / 100) * 180 }}
                transition={{ duration: 1.1, ease: "easeOut" }}
                style={{ transformOrigin: "100px 100px" }}
              >
                <line
                  x1="100"
                  y1="100"
                  x2="100"
                  y2="42"
                  stroke="#18181b"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <circle cx="100" cy="100" r="4" fill="#18181b" />
              </motion.g>
            </svg>
            <div className="-mt-2 text-center">
              <div className="text-xl font-bold text-zinc-900">
                {insights.saturationLevel}/100
              </div>
              <div className="text-xs font-medium text-zinc-600">
                {insights.saturationLabel}
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-center">
            <div className="rounded-xl bg-zinc-50 p-2">
              <div className="text-sm font-bold text-zinc-900">
                {formatNumber(insights.totalProducts)}
              </div>
              <div className="text-[10px] text-zinc-500">Produk dianalisis</div>
            </div>
            <div className="rounded-xl bg-zinc-50 p-2">
              <div className="text-sm font-bold text-zinc-900">
                {formatNumber(insights.totalSellers)}
              </div>
              <div className="text-[10px] text-zinc-500">Toko aktif</div>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-gradient-to-br from-violet-50 to-blue-50 p-6 ring-1 ring-violet-200/50"
      >
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg gradient-bg">
            <Calculator className="h-3.5 w-3.5 text-white" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-900">Simulasi Profit</h3>
          <span className="ml-auto rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-medium text-violet-700 ring-1 ring-violet-200">
            Semua angka Rupiah
          </span>
        </div>
        <p className="mt-1 text-[11px] text-zinc-500">
          Profit bersih = harga jual − COGS − fee platform − ongkir − biaya lain.
          Default: COGS 40%, fee 5%, ongkir {money(shipping)}, biaya lain{" "}
          {money(otherCost)} per unit.
        </p>

        {currency !== "IDR" && hasAvgPrice && (
          <p className="mt-2 rounded-xl bg-white/70 px-3 py-2 text-[10px] leading-relaxed text-zinc-600 ring-1 ring-white">
            Harga rata-rata asli {formatMoney(insights.avgPrice, currency)}{" "}
            ≈ {money(avgPriceIDR)}. Kurs estimasi 1 {currency} ={" "}
            {formatIDR(rate)} (atur lewat{" "}
            <code className="font-mono">IDR_RATE_{currency}</code> di server).
          </p>
        )}

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <div className="flex items-center justify-between text-xs text-zinc-600">
              <label htmlFor="sell-price">Harga jual</label>
              <span className="font-semibold text-zinc-900">{money(sellPrice)}</span>
            </div>
            <input
              id="sell-price"
              type="range"
              min={minPrice}
              max={maxPrice}
              step={step}
              value={sellPrice}
              onChange={(event) => setSellPrice(Number(event.target.value))}
              className="mt-2 w-full accent-violet-600"
            />
            <div className="mt-2 grid grid-cols-3 gap-2">
              <div>
                <label
                  htmlFor="cogs-percent"
                  className="text-[10px] font-medium text-zinc-500"
                >
                  COGS (%)
                </label>
                <input
                  id="cogs-percent"
                  type="number"
                  min={0}
                  max={85}
                  value={cogsPercent}
                  onChange={(event) =>
                    setCogsPercent(
                      Math.min(85, Math.max(0, Number(event.target.value) || 0))
                    )
                  }
                  className="mt-1 w-full rounded-lg border border-white/70 bg-white/90 px-2 py-1.5 text-xs text-zinc-900 shadow-3d-sm focus:border-violet-300 focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="fee-percent"
                  className="text-[10px] font-medium text-zinc-500"
                >
                  Fee platform (%)
                </label>
                <input
                  id="fee-percent"
                  type="number"
                  min={0}
                  max={30}
                  value={feePercent}
                  onChange={(event) =>
                    setFeePercent(
                      Math.min(30, Math.max(0, Number(event.target.value) || 0))
                    )
                  }
                  className="mt-1 w-full rounded-lg border border-white/70 bg-white/90 px-2 py-1.5 text-xs text-zinc-900 shadow-3d-sm focus:border-violet-300 focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="other-cost"
                  className="text-[10px] font-medium text-zinc-500"
                >
                  Biaya lain (Rp)
                </label>
                <input
                  id="other-cost"
                  type="number"
                  min={0}
                  max={500_000}
                  step={500}
                  value={otherCost}
                  onChange={(event) =>
                    setOtherCost(
                      Math.min(
                        500_000,
                        Math.max(0, Number(event.target.value) || 0)
                      )
                    )
                  }
                  className="mt-1 w-full rounded-lg border border-white/70 bg-white/90 px-2 py-1.5 text-xs text-zinc-900 shadow-3d-sm focus:border-violet-300 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs text-zinc-600">
              <label htmlFor="shipping-cost">Ongkir per unit</label>
              <span className="font-semibold text-zinc-900">{money(shipping)}</span>
            </div>
            <input
              id="shipping-cost"
              type="range"
              min={0}
              max={shippingMax}
              step={step}
              value={shipping}
              onChange={(event) => setShipping(Number(event.target.value))}
              className="mt-2 w-full accent-violet-600"
            />

            <div className="mt-3 rounded-xl bg-white/80 p-3 text-[11px] ring-1 ring-white">
              <div className="flex justify-between text-zinc-600">
                <span>Harga jual</span>
                <span className="font-medium text-zinc-900">{money(sellPrice)}</span>
              </div>
              <div className="mt-1 flex justify-between text-zinc-500">
                <span>− COGS ({cogsPercent}%)</span>
                <span>−{money(cogs)}</span>
              </div>
              <div className="mt-1 flex justify-between text-zinc-500">
                <span>− Fee platform ({feePercent}%)</span>
                <span>−{money(fee)}</span>
              </div>
              <div className="mt-1 flex justify-between text-zinc-500">
                <span>− Ongkir</span>
                <span>−{money(shipping)}</span>
              </div>
              <div className="mt-1 flex justify-between text-zinc-500">
                <span>− Biaya lain</span>
                <span>−{money(otherCost)}</span>
              </div>
              <div className="mt-1.5 flex justify-between border-t border-zinc-200 pt-1.5 font-semibold">
                <span className="text-zinc-800">Profit bersih</span>
                <span className={profit > 0 ? "text-emerald-600" : "text-rose-600"}>
                  {money(profit)}
                </span>
              </div>
            </div>

            <div className="mt-2 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-white/80 p-2 ring-1 ring-white">
                <div
                  className={`text-sm font-bold ${
                    profit > 0 ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {money(profit)}
                </div>
                <div className="text-[10px] text-zinc-500">Profit/unit</div>
              </div>
              <div className="rounded-xl bg-white/80 p-2 ring-1 ring-white">
                <div className="text-sm font-bold text-zinc-900">{marginPercent}%</div>
                <div className="text-[10px] text-zinc-500">Margin</div>
              </div>
              <div className="rounded-xl bg-white/80 p-2 ring-1 ring-white">
                <div className="text-sm font-bold text-zinc-900">{roi}%</div>
                <div className="text-[10px] text-zinc-500">ROI</div>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between rounded-xl bg-white/70 px-3 py-2 text-[10px] text-zinc-600">
              <span className="inline-flex items-center gap-1">
                <Wallet className="h-3 w-3 text-violet-600" />
                Modal per unit {money(investment)}
              </span>
              <span>Impas di {breakEvenPrice > 0 ? money(breakEvenPrice) : "—"}</span>
            </div>
          </div>
        </div>

        {profit <= 0 && (
          <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-[11px] text-rose-700 ring-1 ring-rose-200">
            Dengan asumsi ini, harga jual belum menutup COGS, fee, ongkir, dan biaya
            lain. Naikkan harga atau negosiasi biaya.
          </p>
        )}
        <p className="mt-3 flex items-center gap-1.5 text-[10px] text-zinc-400">
          <TrendingUp className="h-3 w-3" />
          Estimasi 100 unit: profit bersih {money(profit * 100)}. Ongkir dan biaya
          lain dihitung per unit; simulasi bukan jaminan hasil.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
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
          {insights.playbook.map((item, index) => {
            const style =
              item.type === "do"
                ? "border-emerald-200 bg-emerald-50"
                : item.type === "dont"
                ? "border-rose-200 bg-rose-50"
                : "border-blue-200 bg-blue-50";
            const icon = item.type === "do" ? "✅" : item.type === "dont" ? "⚠️" : "ℹ️";
            return (
              <motion.div
                key={`${item.title}-${index}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.08 }}
                className={`rounded-xl border ${style} p-3`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-sm">{icon}</span>
                  <div>
                    <div className="text-xs font-semibold text-zinc-900">
                      {item.title}
                    </div>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-600">
                      {item.detail}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
          {insights.playbook.length === 0 && (
            <p className="text-xs text-zinc-400">
              Belum ada rekomendasi taktik untuk data ini.
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
