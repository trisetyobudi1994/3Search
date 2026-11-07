"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  Target,
  TrendingUp,
  Search,
  MessageSquare,
  Sparkles,
  BarChart3,
} from "lucide-react";

interface TrendPoint {
  date: string;
  success: number;
  failed: number;
  total: number;
  rate: number | null;
}

interface Stats {
  totalSearches: number;
  totalRecommendations: number;
  totalFeedback: number;
  success: number;
  failed: number;
  hitRate: number;
  trend: TrendPoint[];
  topQueries: { query: string; count: number }[];
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="grain relative min-h-screen overflow-hidden bg-[#fafafa]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(124,58,237,0.10),transparent_45%),radial-gradient(circle_at_85%_20%,rgba(37,99,235,0.10),transparent_45%)]" />
        <div className="absolute -top-40 -left-40 h-[480px] w-[480px] rounded-full bg-violet-300/30 blur-[100px]" />
        <div className="absolute -bottom-40 -right-40 h-[520px] w-[520px] rounded-full bg-blue-300/30 blur-[110px]" />
      </div>

      <nav className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </Link>
        <span className="text-xs text-zinc-400">Public Transparency Dashboard</span>
      </nav>

      <div className="relative z-10 mx-auto max-w-5xl px-6 pb-24">
        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/60 px-3 py-1 text-xs text-zinc-600 shadow-3d-sm backdrop-blur-xl">
            <Sparkles className="h-3 w-3 text-violet-600" />
            <span>Kami publikasikan akurasi kami terbuka</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            <span className="gradient-text">Hit Rate</span> 3Search
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-zinc-500">
            Setiap rekomendasi yang keluar, kami minta feedback user. Angka di bawah
            adalah hasil nyata — bukan klaim marketing.
          </p>
        </motion.div>

        {loading && (
          <div className="mt-16 text-center text-sm text-zinc-400">Memuat data…</div>
        )}

        {!loading && stats && (
          <>
            {/* HERO — HIT RATE */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-10 rounded-3xl bg-white p-8 shadow-3d ring-1 ring-zinc-200/60"
            >
              <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
                <div className="text-center sm:text-left">
                  <div className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                    Presisi Rekomendasi
                  </div>
                  <div className="mt-2 flex items-end justify-center gap-3 sm:justify-start">
                    <span className="text-6xl font-bold gradient-text">
                      {stats.hitRate}%
                    </span>
                    <span className="mb-2 text-sm text-zinc-500">
                      dari {stats.totalFeedback} feedback
                    </span>
                  </div>
                  <p className="mt-2 max-w-md text-xs leading-relaxed text-zinc-500">
                    {stats.totalFeedback === 0
                      ? "Belum ada feedback yang masuk. Jadilah yang pertama memvalidasi rekomendasi!"
                      : `Dari ${stats.totalFeedback} rekomendasi yang divalidasi user, ${stats.success} benar-benar laku, ${stats.failed} meleset.`}
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-center ring-1 ring-emerald-200">
                    <div className="text-2xl font-bold text-emerald-600">{stats.success}</div>
                    <div className="text-[10px] font-medium text-emerald-700">Laku ✅</div>
                  </div>
                  <div className="rounded-2xl bg-rose-50 px-4 py-3 text-center ring-1 ring-rose-200">
                    <div className="text-2xl font-bold text-rose-600">{stats.failed}</div>
                    <div className="text-[10px] font-medium text-rose-700">Meleset ❌</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* STAT CARDS */}
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                {
                  label: "Total Pencarian",
                  value: stats.totalSearches,
                  icon: Search,
                  color: "text-violet-600",
                  bg: "bg-violet-50",
                },
                {
                  label: "Rekomendasi Dihasilkan",
                  value: stats.totalRecommendations,
                  icon: Target,
                  color: "text-blue-600",
                  bg: "bg-blue-50",
                },
                {
                  label: "Feedback Masuk",
                  value: stats.totalFeedback,
                  icon: MessageSquare,
                  color: "text-emerald-600",
                  bg: "bg-emerald-50",
                },
              ].map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.08 }}
                  className="rounded-2xl bg-white p-5 shadow-3d-sm ring-1 ring-zinc-200/60"
                >
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${s.bg}`}>
                    <s.icon className={`h-4 w-4 ${s.color}`} />
                  </div>
                  <div className="mt-3 text-2xl font-bold text-zinc-900">
                    {s.value.toLocaleString("id-ID")}
                  </div>
                  <div className="text-xs text-zinc-500">{s.label}</div>
                </motion.div>
              ))}
            </div>

            {/* TREND CHART */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-6 rounded-3xl bg-white p-6 shadow-3d ring-1 ring-zinc-200/60"
            >
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg gradient-bg">
                  <TrendingUp className="h-3.5 w-3.5 text-white" />
                </div>
                <h2 className="text-sm font-semibold text-zinc-900">
                  Trend 30 Hari Terakhir
                </h2>
              </div>
              <TrendChart data={stats.trend} />
            </motion.div>

            {/* TOP QUERIES */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-6 rounded-3xl bg-white p-6 shadow-3d ring-1 ring-zinc-200/60"
            >
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg gradient-bg">
                  <BarChart3 className="h-3.5 w-3.5 text-white" />
                </div>
                <h2 className="text-sm font-semibold text-zinc-900">
                  Produk Paling Banyak Dicari
                </h2>
              </div>
              {stats.topQueries.length === 0 ? (
                <p className="text-xs text-zinc-400">Belum ada pencarian</p>
              ) : (
                <div className="space-y-2">
                  {stats.topQueries.map((q, i) => {
                    const max = stats.topQueries[0].count;
                    return (
                      <div key={q.query}>
                        <div className="mb-1 flex justify-between text-xs">
                          <span className="font-medium text-zinc-800 capitalize">
                            {i + 1}. {q.query}
                          </span>
                          <span className="text-zinc-500">{q.count}×</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(q.count / max) * 100}%` }}
                            transition={{ delay: 0.6 + i * 0.1, duration: 0.8 }}
                            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>

            {/* DISCLAIMER */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-8 rounded-2xl border border-white/60 bg-white/80 p-4 text-center text-xs leading-relaxed text-zinc-500 shadow-3d-sm backdrop-blur"
            >
              ⚠️ <strong className="text-zinc-700">Transparansi:</strong> Data di
              halaman ini <em>real-time</em> dari feedback user. Sample size kecil
              bisa membuat hit rate fluktuatif — kami tidak cherry-pick.
              {stats.totalFeedback > 0 && stats.totalFeedback < 30 && (
                <span className="mt-1 block text-amber-600">
                  Sample size masih kecil ({stats.totalFeedback}). Angka akan lebih stabil seiring bertambahnya data.
                </span>
              )}
            </motion.p>
          </>
        )}
      </div>
    </main>
  );
}

// ===== TREND CHART =====
function TrendChart({ data }: { data: TrendPoint[] }) {
  const validDays = data.filter((d) => d.rate !== null);
  if (validDays.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl bg-zinc-50 text-xs text-zinc-400">
        Belum ada feedback dalam 30 hari terakhir
      </div>
    );
  }

  const W = 800;
  const H = 200;
  const PAD = 30;
  const innerW = W - PAD * 2;
  const innerH = H - PAD * 2;

  const points = data.map((d, i) => {
    const x = PAD + (i / Math.max(data.length - 1, 1)) * innerW;
    const y =
      d.rate !== null
        ? PAD + (1 - d.rate / 100) * innerH
        : null;
    return { x, y, rate: d.rate, date: d.date };
  });

  const pathSegments: string[] = [];
  let currentSegment = "";
  points.forEach((p, i) => {
    if (p.y !== null) {
      if (currentSegment === "") currentSegment = `M ${p.x} ${p.y}`;
      else currentSegment += ` L ${p.x} ${p.y}`;
    } else if (currentSegment !== "") {
      pathSegments.push(currentSegment);
      currentSegment = "";
    }
  });
  if (currentSegment !== "") pathSegments.push(currentSegment);

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-48 w-full min-w-[600px]">
        {/* Grid lines (25, 50, 75%) */}
        {[25, 50, 75].map((pct) => {
          const y = PAD + (1 - pct / 100) * innerH;
          return (
            <g key={pct}>
              <line x1={PAD} y1={y} x2={W - PAD} y2={y} stroke="#f4f4f5" strokeWidth="1" />
              <text x={PAD - 6} y={y + 3} textAnchor="end" fontSize="9" fill="#a1a1aa">
                {pct}%
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        {pathSegments.map((seg, si) => (
          <path
            key={si}
            d={`${seg} L ${points[points.length - 1].x} ${H - PAD} L ${points[0].x} ${H - PAD} Z`}
            fill="url(#areaGrad)"
            opacity="0.3"
          />
        ))}

        {/* Line */}
        {pathSegments.map((seg, si) => (
          <path
            key={si}
            d={seg}
            stroke="url(#lineGrad)"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {/* Dots */}
        {points.map(
          (p, i) =>
            p.y !== null && (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r="3.5"
                fill="white"
                stroke="#7c3aed"
                strokeWidth="2"
              />
            )
        )}

        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}