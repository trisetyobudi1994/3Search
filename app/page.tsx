"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  ArrowLeft,
  Bookmark,
  Download,
  Gauge,
  Github,
  Info,
  Layers,
  Radar,
  Share2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import FunnelAnimation from "@/components/FunnelAnimation";
import ProductCard from "@/components/ProductCard";
import WarRoom from "@/components/WarRoom";
import AnalyzingState from "@/components/AnalyzingState";
import ErrorBanner from "@/components/ErrorBanner";
import LandingExtras from "@/components/LandingExtras";
import {
  ApiError,
  fetchHealth,
  fetchStats,
  requestAnalysis,
} from "@/lib/client-api";
import {
  exportResultCsv,
  exportResultJson,
  resultShareUrl,
} from "@/lib/export";
import {
  clearRecentSearches,
  getRecentSearches,
  getSavedProducts,
  getSessionStats,
  recordAnalysis,
  toggleSavedProduct,
} from "@/lib/local-store";
import {
  formatNumber,
  formatRelativeTime,
  getRegion,
  isRegionCode,
} from "@/lib/regions";
import type {
  FunnelResult,
  HealthResponse,
  LocalStats,
  Product,
  RecentSearch,
  RegionCode,
} from "@/lib/types";

type Phase = "landing" | "analyzing" | "result";

const EXAMPLES = [
  "serum niacinamide",
  "skincare lokal",
  "TWS bluetooth",
  "cardigan oversize",
];

const HOW_IT_WORKS = [
  {
    icon: Layers,
    title: "Satu tarikan data",
    desc: "Kandidat produk, harga, penjualan, rating, dan ulasan dari kategori yang kamu cari.",
  },
  {
    icon: Gauge,
    title: "Skor yang bisa dibedah",
    desc: "Filter kualitas, dedupe, lalu skor sinyal 0–100. Setiap poin bisa kamu buka rinciannya.",
  },
  {
    icon: ShieldCheck,
    title: "Keputusan sadar risiko",
    desc: "Lihat saturasi, peta toko, dan simulasi profit sebelum menebak-nebak stok.",
  },
];

const EMPTY_LOCAL: LocalStats = {
  analyses: 0,
  feedback: 0,
  success: 0,
  failed: 0,
  hitRate: 0,
};

export default function Home() {
  const [phase, setPhase] = useState<Phase>("landing");
  const [result, setResult] = useState<FunnelResult | null>(null);
  const [activeQuery, setActiveQuery] = useState("");
  const [activeRegion, setActiveRegion] = useState<RegionCode>("ID");
  const [error, setError] = useState<{ message: string; hint?: string } | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [recent, setRecent] = useState<RecentSearch[]>([]);
  const [saved, setSaved] = useState<Product[]>([]);
  const [localStats, setLocalStats] = useState<LocalStats>(EMPTY_LOCAL);
  const [hitRate, setHitRate] = useState<{ rate: number; total: number } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const runRef = useRef(0);
  const initializedRef = useRef(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const springX = useSpring(mx, { stiffness: 40, damping: 20 });
  const springY = useSpring(my, { stiffness: 40, damping: 20 });
  const orb1X = useTransform(springX, [-1, 1], [-40, 40]);
  const orb1Y = useTransform(springY, [-1, 1], [-30, 30]);
  const orb2X = useTransform(springX, [-1, 1], [30, -30]);
  const orb2Y = useTransform(springY, [-1, 1], [20, -20]);

  const notify = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  useEffect(() => {
    const onMove = (event: MouseEvent) => {
      mx.set((event.clientX / window.innerWidth - 0.5) * 2);
      my.set((event.clientY / window.innerHeight - 0.5) * 2);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [mx, my]);

  const refreshLocal = useCallback(() => {
    setRecent(getRecentSearches());
    setSaved(getSavedProducts());
    setLocalStats(getSessionStats());
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const data = await fetchStats();
      if (data && data.totalFeedback > 0) {
        setHitRate({ rate: data.hitRate, total: data.totalFeedback });
      } else {
        setHitRate(null);
      }
    } catch {
      // Statistik bukan jalur kritis — abaikan kegagalan.
    }
  }, []);

  const runAnalysis = useCallback(
    async (rawQuery: string, region: RegionCode) => {
      const query = rawQuery.replace(/\s+/g, " ").trim().slice(0, 80);
      if (query.length < 2) {
        setError({
          message: "Kata kunci terlalu pendek.",
          hint: "Gunakan minimal 2 karakter, misalnya “serum niacinamide”.",
        });
        return;
      }

      const runId = ++runRef.current;
      setActiveQuery(query);
      setActiveRegion(region);
      setError(null);
      setPhase("analyzing");
      const startedAt = Date.now();

      try {
        const data = await requestAnalysis({ query, region });
        const minimumDelay = 1_100 - (Date.now() - startedAt);
        if (minimumDelay > 0) {
          await new Promise((resolve) => setTimeout(resolve, minimumDelay));
        }
        if (runRef.current !== runId) return;

        setResult(data);
        setPhase("result");
        recordAnalysis(query, region);
        refreshLocal();
        void loadStats();

        const url = new URL(window.location.href);
        url.searchParams.set("q", data.query);
        url.searchParams.set("region", data.region);
        window.history.replaceState({}, "", url);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (err) {
        if (runRef.current !== runId) return;
        setPhase("landing");
        if (err instanceof ApiError) {
          setError({ message: err.message, hint: err.hint });
        } else {
          setError({
            message: "Analisis gagal.",
            hint: "Periksa koneksi lalu coba lagi sebentar lagi.",
          });
        }
      }
    },
    [loadStats, refreshLocal]
  );

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    refreshLocal();
    void fetchHealth().then(setHealth);

    const params = new URLSearchParams(window.location.search);
    const query = params.get("q");
    const regionParam = params.get("region");
    const region: RegionCode = isRegionCode(regionParam) ? regionParam : "ID";

    if (query && query.trim().length >= 2) {
      void runAnalysis(query, region);
    } else {
      void loadStats();
    }
  }, [loadStats, refreshLocal, runAnalysis]);

  const reset = useCallback(() => {
    runRef.current += 1;
    setPhase("landing");
    setResult(null);
    setError(null);
    setActiveQuery("");
    window.history.replaceState({}, "", window.location.pathname);
    refreshLocal();
  }, [refreshLocal]);

  const savedIds = useMemo(() => new Set(saved.map((item) => item.id)), [saved]);
  const regionMeta = getRegion(result?.region ?? activeRegion);

  const handleToggleSave = useCallback(
    (product: Product) => {
      const nowSaved = toggleSavedProduct(product);
      setSaved(getSavedProducts());
      notify(
        nowSaved
          ? "Produk disimpan ke daftar pantau."
          : "Produk dihapus dari daftar pantau."
      );
    },
    [notify]
  );

  const handleClearRecent = useCallback(() => {
    clearRecentSearches();
    setRecent(getRecentSearches());
    notify("Riwayat pencarian dibersihkan.");
  }, [notify]);

  const handleSaveAll = useCallback(() => {
    if (!result) return;
    let added = 0;
    for (const product of result.products) {
      if (!savedIds.has(product.id)) {
        toggleSavedProduct(product);
        added += 1;
      }
    }
    setSaved(getSavedProducts());
    notify(
      added > 0 ? `${added} produk disimpan.` : "Semua produk sudah tersimpan."
    );
  }, [notify, result, savedIds]);

  const handleCopyShare = useCallback(async () => {
    if (!result) return;
    const url = resultShareUrl(result) || window.location.href;
    try {
      if (!navigator.clipboard?.writeText) throw new Error("clipboard unavailable");
      await navigator.clipboard.writeText(url);
      notify("Tautan analisis disalin.");
    } catch {
      notify("Tidak bisa menyalin otomatis. Salin URL dari address bar.");
    }
  }, [notify, result]);

  const retry = activeQuery.length >= 2
    ? () => {
        void runAnalysis(activeQuery, activeRegion);
      }
    : undefined;

  return (
    <main className="grain relative min-h-screen overflow-hidden bg-[#fafafa]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(124,58,237,0.10),transparent_45%),radial-gradient(circle_at_85%_20%,rgba(37,99,235,0.10),transparent_45%),radial-gradient(circle_at_50%_90%,rgba(236,72,153,0.06),transparent_50%)]" />
        <motion.div
          style={{ x: orb1X, y: orb1Y }}
          className="absolute -left-40 -top-40 h-[480px] w-[480px] rounded-full bg-violet-300/40 blur-[100px]"
        />
        <motion.div
          style={{ x: orb2X, y: orb2Y }}
          className="absolute -bottom-40 -right-40 h-[520px] w-[520px] rounded-full bg-blue-300/40 blur-[110px]"
        />
      </div>

      <nav className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <button
          type="button"
          onClick={reset}
          className="flex items-center gap-2"
          aria-label="Kembali ke halaman awal"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-bg shadow-3d-glow">
            <Radar className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-zinc-900">3Search</span>
        </button>

        <div className="flex items-center gap-3 sm:gap-4">
          {health && (
            <span
              title={
                health.dataSource === "live"
                  ? "Scraper Apify aktif — data live."
                  : "APIFY_TOKEN belum diset — aplikasi memakai dataset demo."
              }
              className="hidden items-center gap-1.5 rounded-full border border-white/70 bg-white/70 px-2.5 py-1 text-[10px] font-medium text-zinc-600 shadow-3d-sm backdrop-blur sm:inline-flex"
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  health.dataSource === "live" ? "bg-emerald-500" : "bg-amber-500"
                }`}
              />
              {health.dataSource === "live" ? "Data live" : "Mode demo"}
            </span>
          )}
          <Link
            href="/stats"
            className="text-xs font-medium text-zinc-600 transition-colors hover:text-violet-600"
          >
            Hit Rate
          </Link>
          <a
            href="https://github.com/trisetyobudi1994/3Search"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900"
          >
            <Github className="h-4 w-4" />
            <span className="hidden sm:inline">GitHub</span>
          </a>
        </div>
      </nav>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="relative z-10 mx-auto mt-2 max-w-2xl px-6"
          >
            <ErrorBanner
              message={error.message}
              hint={error.hint}
              onRetry={retry}
              onDismiss={() => setError(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 mx-auto max-w-6xl px-6">
        <AnimatePresence mode="wait">
          {phase === "landing" && (
            <motion.section
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35 }}
              className="flex flex-col items-center pb-20 pt-6 text-center sm:pt-12"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/60 px-3 py-1 text-xs text-zinc-600 shadow-3d-sm backdrop-blur-xl">
                  <Sparkles className="h-3 w-3 text-violet-600" />
                  <span>100+ produk → 3 kandidat terkuat</span>
                </div>
                <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-zinc-900 sm:text-6xl">
                  Temukan{" "}
                  <span className="gradient-text">produk potensial viral</span>
                  <br className="hidden sm:block" /> sebelum semua orang tahu.
                </h1>
                <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-zinc-500">
                  Saring ratusan produk TikTok Shop jadi 3 kandidat berbasis sinyal
                  penjualan, rating, dan ulasan — lengkap dengan alasan, risiko, dan
                  simulasi profit.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.6 }}
                className="mt-9 w-full"
              >
                <SearchBar
                  onSearch={runAnalysis}
                  defaultRegion={activeRegion}
                  initialQuery={activeQuery}
                />
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-zinc-500">
                  <span>Coba cepat:</span>
                  {EXAMPLES.map((example) => (
                    <button
                      key={example}
                      type="button"
                      onClick={() => runAnalysis(example, activeRegion)}
                      className="rounded-full border border-white/70 bg-white/80 px-3 py-1 shadow-3d-sm backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:text-violet-600 hover:shadow-3d"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </motion.div>

              <LandingExtras
                recent={recent}
                saved={saved}
                onRun={runAnalysis}
                onToggleSave={handleToggleSave}
                onClearRecent={handleClearRecent}
              />

              <section className="mt-16 w-full max-w-4xl">
                <div className="grid gap-4 text-left sm:grid-cols-3">
                  {HOW_IT_WORKS.map((item, index) => (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 + index * 0.08 }}
                      className="rounded-2xl bg-white/80 p-5 shadow-3d-sm ring-1 ring-zinc-200/60 backdrop-blur"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-bg shadow-3d-glow">
                        <item.icon className="h-4 w-4 text-white" />
                      </div>
                      <h2 className="mt-3 text-sm font-semibold text-zinc-900">
                        {item.title}
                      </h2>
                      <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                        {item.desc}
                      </p>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-4 rounded-3xl border border-white/60 bg-white/80 p-5 text-left shadow-3d-sm backdrop-blur">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
                      <ShieldCheck className="h-4 w-4 text-violet-600" />
                      Transparansi akurasi
                    </div>
                    <Link
                      href="/stats"
                      className="text-xs font-medium text-violet-600 hover:text-violet-800"
                    >
                      Buka dashboard →
                    </Link>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-600">
                    {hitRate
                      ? `Presisi historis top-3: ${hitRate.rate}% dari ${formatNumber(
                          hitRate.total
                        )} feedback tervalidasi.`
                      : "Belum ada feedback tervalidasi. Hit rate akan muncul di sini setelah pengguna memvalidasi rekomendasi."}{" "}
                    Dari 10 rekomendasi, sekitar 4 bisa meleset — validasi stok dan
                    supplier sebelum keputusan besar.
                  </p>
                  {localStats.feedback > 0 && (
                    <p className="mt-2 text-xs text-zinc-500">
                      Validasi kamu di perangkat ini: {localStats.success}/
                      {localStats.feedback} akurat ({localStats.hitRate}%).
                    </p>
                  )}
                </div>

                {health?.dataSource === "demo" && (
                  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-left text-xs leading-relaxed text-amber-900">
                    <strong>Mode demo aktif.</strong> Set{" "}
                    <code className="rounded bg-white/70 px-1 py-0.5 font-mono text-[11px]">
                      APIFY_TOKEN
                    </code>{" "}
                    untuk data TikTok Shop live. Semua alur — skor, insight, simulasi
                    profit — tetap bisa dicoba sekarang.
                  </div>
                )}
              </section>
            </motion.section>
          )}

          {phase === "analyzing" && (
            <motion.section
              key="analyzing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative"
            >
              <AnalyzingState
                query={activeQuery}
                region={activeRegion}
                onCancel={reset}
              />
            </motion.section>
          )}

          {phase === "result" && result && (
            <motion.section
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="pb-20 pt-2"
            >
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={reset}
                  className="flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Analisis baru
                </button>
                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-zinc-600 ring-1 ring-zinc-200">
                    {regionMeta.flag} {regionMeta.label}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 ring-1 ${
                      result.mode === "live"
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                        : "bg-amber-50 text-amber-700 ring-amber-200"
                    }`}
                  >
                    {result.mode === "live" ? "Data live" : "Mode demo"}
                  </span>
                  {result.cached && (
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700 ring-1 ring-blue-200">
                      Cache
                    </span>
                  )}
                  <span className="text-zinc-400">
                    {formatRelativeTime(result.generatedAt)} · {result.durationMs} ms
                  </span>
                </div>
              </div>

              <div className="rounded-3xl bg-white p-6 shadow-3d ring-1 ring-zinc-200/60 sm:p-7">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                  <div className="min-w-0">
                    <div className="text-[11px] uppercase tracking-wider text-zinc-400">
                      Hasil analisis
                    </div>
                    <h2 className="mt-1 truncate text-2xl font-bold text-zinc-900 sm:text-3xl">
                      “{result.query}”
                    </h2>
                    <p className="mt-1 text-sm text-zinc-500">
                      {formatNumber(result.totalAnalyzed)} produk dianalisis →{" "}
                      {result.stage4} kandidat terkuat
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleCopyShare}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-100 px-3 py-2 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-200"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      Salin tautan
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveAll}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-100 px-3 py-2 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-200"
                    >
                      <Bookmark className="h-3.5 w-3.5" />
                      Simpan semua
                    </button>
                    <button
                      type="button"
                      onClick={() => exportResultCsv(result)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-100 px-3 py-2 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-200"
                    >
                      <Download className="h-3.5 w-3.5" />
                      CSV
                    </button>
                    <button
                      type="button"
                      onClick={() => exportResultJson(result)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-100 px-3 py-2 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-200"
                    >
                      <Download className="h-3.5 w-3.5" />
                      JSON
                    </button>
                  </div>
                </div>

                {result.warnings.length > 0 && (
                  <div className="mt-5 space-y-1.5 rounded-2xl bg-zinc-50 p-4 ring-1 ring-zinc-200/60">
                    {result.warnings.map((warning, index) => (
                      <p
                        key={`${warning}-${index}`}
                        className="flex items-start gap-2 text-[11px] leading-relaxed text-zinc-600"
                      >
                        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" />
                        <span>{warning}</span>
                      </p>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-8">
                <FunnelAnimation
                  stage1={result.stage1}
                  stage2={result.stage2}
                  stage3={result.stage3}
                  stage4={result.stage4}
                  hitRate={hitRate}
                />
              </div>

              {result.insights && result.insights.totalProducts > 0 && (
                <div className="mt-8">
                  <WarRoom
                    key={`${result.query}-${result.generatedAt}`}
                    insights={result.insights}
                    currency={result.currency}
                    rates={result.idrRates}
                  />
                </div>
              )}

              <div className="mb-4 mt-10 flex flex-wrap items-end justify-between gap-2">
                <h2 className="text-lg font-semibold text-zinc-900">
                  3 Kandidat Terkuat
                </h2>
                <span className="text-xs text-zinc-500">
                  Skor sinyal 0–100 · buka “Rincian skor” untuk transparansi
                </span>
              </div>

              {result.products.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  {result.products.map((product, index) => (
                    <ProductCard
                      key={product.id}
                      p={product}
                      index={index}
                      saved={savedIds.has(product.id)}
                      onToggleSave={handleToggleSave}
                      onNotify={notify}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl bg-white p-8 text-center text-sm text-zinc-500 ring-1 ring-zinc-200/60">
                  Tidak ada kandidat yang bisa ditampilkan untuk kata kunci ini. Coba
                  kata kunci yang lebih umum.
                </div>
              )}

              <p className="mt-8 rounded-2xl border border-white/60 bg-white/80 p-4 text-center text-xs leading-relaxed text-zinc-500 shadow-3d-sm backdrop-blur">
                ⚠️ <strong className="text-zinc-700">Transparansi:</strong>{" "}
                {result.mode === "demo"
                  ? "Hasil ini memakai dataset simulasi untuk mencoba alur produk — bukan data penjualan nyata."
                  : "Data berasal dari sumber publik TikTok Shop dan bisa berubah setiap saat."}{" "}
                Validasi stok, supplier, dan margin sebelum keputusan besar.
              </p>
            </motion.section>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="fixed bottom-6 left-1/2 z-[70] w-max max-w-[90vw] -translate-x-1/2 rounded-full bg-zinc-900 px-4 py-2 text-center text-xs font-medium text-white shadow-3d-lg"
            role="status"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
