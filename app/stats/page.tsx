"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  Database,
  MessageSquare,
  RefreshCw,
  Search,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { fetchStats } from "@/lib/client-api";
import { clearLocalData, getSessionStats } from "@/lib/local-store";
import { formatNumber, formatRelativeTime } from "@/lib/regions";
import type { LocalStats, StatsResponse, TrendPoint } from "@/lib/types";

const EMPTY_LOCAL: LocalStats = {
  analyses: 0,
  feedback: 0,
  success: 0,
  failed: 0,
  hitRate: 0,
};

export default function StatsPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [local, setLocal] = useState<LocalStats>(EMPTY_LOCAL);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat statistik.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLocal(getSessionStats());
    void load();
  }, [load]);

  const resetLocal = () => {
    clearLocalData();
    setLocal(getSessionStats());
  };

  return (
    <main className="grain relative min-h-screen overflow-hidden bg-[#fafafa]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(124,58,237,0.10),transparent_45%),radial-gradient(circle_at_85%_20%,rgba(37,99,235,0.10),transparent_45%)]" />
        <div className="absolute -left-40 -top-40 h-[480px] w-[480px] rounded-full bg-violet-300/30 blur-[100px]" />
        <div className="absolute -bottom-40 -right-40 h-[520px] w-[520px] rounded-full bg-blue-300/30 blur-[110px]" />
      </div>

      <nav className="relative z-10 mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali
        </Link>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 shadow-3d-sm ring-1 ring-zinc-200/70 transition-colors hover:text-zinc-900 disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Muat ulang
          </button>
          <span className="hidden text-xs text-zinc-400 sm:inline">
            Public transparency dashboard
          </span>
        </div>
      </nav>

      <div className="relative z-10 mx-auto max-w-5xl px-6 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
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
            Setiap rekomendasi bisa divalidasi pengguna. Angka di bawah dihitung dari
            feedback nyata — bukan klaim marketing.
          </p>
        </motion.div>

        {error && (
          <div className="mx-auto mt-8 max-w-xl rounded-2xl border border-rose-200 bg-rose-50 p-4 text-center text-sm text-rose-700">
            {error}{" "}
            <button
              type="button"
              onClick={() => void load()}
              className="font-semibold underline underline-offset-2"
            >
              Coba lagi
            </button>
          </div>
        )}

        {loading && !stats && (
          <div className="mt-10 space-y-4">
            <div className="h-40 animate-pulse rounded-3xl bg-white/70 shadow-3d-sm" />
            <div className="grid gap-4 sm:grid-cols-3">
              {[0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="h-28 animate-pulse rounded-2xl bg-white/70 shadow-3d-sm"
                />
              ))}
            </div>
          </div>
        )}

        {stats && (
          <>
            {!stats.database && (
              <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-xs leading-relaxed text-amber-900">
                <div className="mb-1 flex items-center gap-2 font-semibold">
                  <Database className="h-4 w-4" />
                  Database belum terhubung
                </div>
                Statistik publik akan terisi otomatis setelah{" "}
                <code className="rounded bg-white/70 px-1 py-0.5 font-mono text-[11px]">
                  SUPABASE_URL
                </code>{" "}
                dan{" "}
                <code className="rounded bg-white/70 px-1 py-0.5 font-mono text-[11px]">
                  SUPABASE_SERVICE_ROLE_KEY
                </code>{" "}
                diset serta skema{" "}
                <code className="rounded bg-white/70 px-1 py-0.5 font-mono text-[11px]">
                  supabase/schema.sql
                </code>{" "}
                dijalankan. Sementara itu, validasi sesi ini tetap tercatat di
                perangkatmu.
              </div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="mt-8 rounded-3xl bg-white p-8 shadow-3d ring-1 ring-zinc-200/60"
            >
              <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
                <div className="text-center sm:text-left">
                  <div className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                    Presisi rekomendasi
                  </div>
                  <div className="mt-2 flex items-end justify-center gap-3 sm:justify-start">
                    <span className="text-6xl font-bold gradient-text">
                      {stats.totalFeedback > 0 ? `${stats.hitRate}%` : "—"}
                    </span>
                    <span className="mb-2 text-sm text-zinc-500">
                      dari {formatNumber(stats.totalFeedback)} feedback
                    </span>
                  </div>
                  <p className="mt-2 max-w-md text-xs leading-relaxed text-zinc-500">
                    {stats.totalFeedback === 0
                      ? "Belum ada feedback yang masuk. Jadilah yang pertama memvalidasi rekomendasi!"
                      : `Dari ${stats.totalFeedback} rekomendasi tervalidasi, ${stats.success} benar-benar laku dan ${stats.failed} meleset.`}
                  </p>
                  <p className="mt-1 text-[10px] text-zinc-400">
                    Diperbarui {formatRelativeTime(stats.updatedAt)}
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-center ring-1 ring-emerald-200">
                    <div className="text-2xl font-bold text-emerald-600">
                      {stats.success}
                    </div>
                    <div className="text-[10px] font-medium text-emerald-700">
                      Laku ✅
                    </div>
                  </div>
                  <div className="rounded-2xl bg-rose-50 px-4 py-3 text-center ring-1 ring-rose-200">
                    <div className="text-2xl font-bold text-rose-600">
                      {stats.failed}
                    </div>
                    <div className="text-[10px] font-medium text-rose-700">
                      Meleset ❌
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                {
                  label: "Total pencarian",
                  value: stats.totalSearches,
                  icon: Search,
                  color: "text-violet-600",
                  bg: "bg-violet-50",
                },
                {
                  label: "Rekomendasi dihasilkan",
                  value: stats.totalRecommendations,
                  icon: Target,
                  color: "text-blue-600",
                  bg: "bg-blue-50",
                },
                {
                  label: "Feedback masuk",
                  value: stats.totalFeedback,
                  icon: MessageSquare,
                  color: "text-emerald-600",
                  bg: "bg-emerald-50",
                },
              ].map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.06 }}
                  className="rounded-2xl bg-white p-5 shadow-3d-sm ring-1 ring-zinc-200/60"
                >
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${item.bg}`}
                  >
                    <item.icon className={`h-4 w-4 ${item.color}`} />
                  </div>
                  <div className="mt-3 text-2xl font-bold text-zinc-900">
                    {formatNumber(item.value)}
                  </div>
                  <div className="text-xs text-zinc-500">{item.label}</div>
                </motion.div>
              ))}
            </div>

            {(local.analyses > 0 || local.feedback > 0) && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 }}
                className="mt-4 rounded-3xl bg-white p-6 shadow-3d-sm ring-1 ring-zinc-200/60"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg gradient-bg">
                      <Target className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-zinc-900">
                        Sesi di perangkat ini
                      </h2>
                      <p className="text-[10px] text-zinc-400">
                        Tidak dikirim ke mana pun — hanya tersimpan di browser.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={resetLocal}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] text-zinc-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 className="h-3 w-3" />
                    Reset data lokal
                  </button>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-zinc-50 p-3">
                    <div className="text-lg font-bold text-zinc-900">
                      {local.analyses}
                    </div>
                    <div className="text-[10px] text-zinc-500">Analisis</div>
                  </div>
                  <div className="rounded-xl bg-zinc-50 p-3">
                    <div className="text-lg font-bold text-zinc-900">
                      {local.feedback}
                    </div>
                    <div className="text-[10px] text-zinc-500">Validasi</div>
                  </div>
                  <div className="rounded-xl bg-zinc-50 p-3">
                    <div className="text-lg font-bold text-zinc-900">
                      {local.feedback > 0 ? `${local.hitRate}%` : "—"}
                    </div>
                    <div className="text-[10px] text-zinc-500">Akurasi lokal</div>
                  </div>
                </div>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24 }}
              className="mt-6 rounded-3xl bg-white p-6 shadow-3d ring-1 ring-zinc-200/60"
            >
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg gradient-bg">
                  <TrendingUp className="h-3.5 w-3.5 text-white" />
                </div>
                <h2 className="text-sm font-semibold text-zinc-900">
                  Tren 30 hari terakhir
                </h2>
              </div>
              <TrendChart data={stats.trend} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6 rounded-3xl bg-white p-6 shadow-3d ring-1 ring-zinc-200/60"
            >
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg gradient-bg">
                  <BarChart3 className="h-3.5 w-3.5 text-white" />
                </div>
                <h2 className="text-sm font-semibold text-zinc-900">
                  Produk paling banyak dicari
                </h2>
              </div>
              {stats.topQueries.length === 0 ? (
                <p className="text-xs text-zinc-400">Belum ada pencarian.</p>
              ) : (
                <div className="space-y-2">
                  {stats.topQueries.map((query, index) => {
                    const max = stats.topQueries[0]?.count || 1;
                    return (
                      <div key={query.query}>
                        <div className="mb-1 flex justify-between text-xs">
                          <span className="font-medium capitalize text-zinc-800">
                            {index + 1}. {query.query}
                          </span>
                          <span className="text-zinc-500">{query.count}×</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(query.count / max) * 100}%` }}
                            transition={{
                              delay: 0.35 + index * 0.07,
                              duration: 0.7,
                            }}
                            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.36 }}
              className="mt-8 rounded-2xl border border-white/60 bg-white/80 p-4 text-center text-xs leading-relaxed text-zinc-500 shadow-3d-sm backdrop-blur"
            >
              ⚠️ <strong className="text-zinc-700">Transparansi:</strong> Data di
              halaman ini berasal dari feedback pengguna, bukan cherry-picking. Sample
              size kecil membuat hit rate fluktuatif.
              {stats.totalFeedback > 0 && stats.totalFeedback < 30 && (
                <span className="mt-1 block text-amber-600">
                  Sample size masih kecil ({stats.totalFeedback}). Angka akan lebih
                  stabil seiring bertambahnya data.
                </span>
              )}
            </motion.p>
          </>
        )}
      </div>
    </main>
  );
}

interface ChartPoint {
  x: number;
  y: number | null;
  rate: number | null;
  date: string;
}

function formatDay(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

function TrendChart({ data }: { data: TrendPoint[] }) {
  const validDays = data.filter((day) => day.rate !== null);

  if (validDays.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl bg-zinc-50 text-xs text-zinc-400">
        Belum ada feedback dalam 30 hari terakhir.
      </div>
    );
  }

  const width = 800;
  const height = 220;
  const padding = 32;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;

  const points: ChartPoint[] = data.map((day, index) => ({
    x: padding + (index / Math.max(data.length - 1, 1)) * innerWidth,
    y: day.rate === null ? null : padding + (1 - day.rate / 100) * innerHeight,
    rate: day.rate,
    date: day.date,
  }));

  const segments: (ChartPoint & { y: number })[][] = [];
  let current: (ChartPoint & { y: number })[] = [];
  for (const point of points) {
    if (point.y === null) {
      if (current.length > 0) {
        segments.push(current);
        current = [];
      }
    } else {
      current.push({ ...point, y: point.y });
    }
  }
  if (current.length > 0) segments.push(current);

  const firstDate = points[0]?.date ?? "";
  const lastDate = points[points.length - 1]?.date ?? "";

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-48 w-full min-w-[560px]"
        role="img"
        aria-label="Grafik hit rate 30 hari terakhir"
      >
        {[25, 50, 75].map((percent) => {
          const y = padding + (1 - percent / 100) * innerHeight;
          return (
            <g key={percent}>
              <line
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="#f4f4f5"
                strokeWidth="1"
              />
              <text
                x={padding - 6}
                y={y + 3}
                textAnchor="end"
                fontSize="9"
                fill="#a1a1aa"
              >
                {percent}%
              </text>
            </g>
          );
        })}

        {segments.map((segment, index) => {
          const line = segment
            .map((point, pointIndex) =>
              `${pointIndex === 0 ? "M" : "L"} ${point.x} ${point.y}`
            )
            .join(" ");
          const first = segment[0];
          const last = segment[segment.length - 1];
          const area = `${line} L ${last.x} ${height - padding} L ${first.x} ${
            height - padding
          } Z`;
          return (
            <g key={index}>
              <path d={area} fill="url(#areaGradient)" opacity="0.35" />
              <path
                d={line}
                stroke="url(#lineGradient)"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          );
        })}

        {points.map(
          (point, index) =>
            point.y !== null && (
              <circle
                key={index}
                cx={point.x}
                cy={point.y}
                r="3.5"
                fill="white"
                stroke="#7c3aed"
                strokeWidth="2"
              >
                <title>
                  {formatDay(point.date)}: {point.rate}%
                </title>
              </circle>
            )
        )}

        <text
          x={padding}
          y={height - 8}
          fontSize="9"
          fill="#a1a1aa"
          textAnchor="start"
        >
          {formatDay(firstDate)}
        </text>
        <text
          x={width - padding}
          y={height - 8}
          fontSize="9"
          fill="#a1a1aa"
          textAnchor="end"
        >
          {formatDay(lastDate)}
        </text>

        <defs>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
