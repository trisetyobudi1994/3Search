"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Radar, ArrowLeft, Sparkles, Github } from "lucide-react";
import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import FunnelAnimation from "@/components/FunnelAnimation";
import ProductCard from "@/components/ProductCard";
import WarRoom from "@/components/WarRoom";
import { analyze } from "@/lib/funnel";
import type { FunnelResult } from "@/lib/types";

type Phase = "landing" | "analyzing" | "result";

export default function Home() {
  const [phase, setPhase] = useState<Phase>("landing");
  const [result, setResult] = useState<FunnelResult | null>(null);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 40, damping: 20 });
  const sy = useSpring(my, { stiffness: 40, damping: 20 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mx.set((e.clientX / window.innerWidth - 0.5) * 2);
      my.set((e.clientY / window.innerHeight - 0.5) * 2);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [mx, my]);

  const orb1X = useTransform(sx, [-1, 1], [-40, 40]);
  const orb1Y = useTransform(sy, [-1, 1], [-30, 30]);
  const orb2X = useTransform(sx, [-1, 1], [30, -30]);
  const orb2Y = useTransform(sy, [-1, 1], [20, -20]);

  const handleSearch = async (q: string) => {
    setPhase("analyzing");
    try {
      const data = await analyze(q);
      setResult(data);
      setTimeout(() => setPhase("result"), 1800);
    } catch {
      setPhase("landing");
    }
  };

  const reset = () => {
    setPhase("landing");
    setResult(null);
  };

  return (
    <main className="grain relative min-h-screen overflow-hidden bg-[#fafafa]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(124,58,237,0.10),transparent_45%),radial-gradient(circle_at_85%_20%,rgba(37,99,235,0.10),transparent_45%),radial-gradient(circle_at_50%_90%,rgba(236,72,153,0.06),transparent_50%)]" />
        <motion.div
          style={{ x: orb1X, y: orb1Y }}
          className="absolute -top-40 -left-40 h-[480px] w-[480px] rounded-full bg-violet-300/40 blur-[100px]"
        />
        <motion.div
          style={{ x: orb2X, y: orb2Y }}
          className="absolute -bottom-40 -right-40 h-[520px] w-[520px] rounded-full bg-blue-300/40 blur-[110px]"
        />
      </div>

      <nav className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <button onClick={reset} className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-bg shadow-3d-glow">
            <Radar className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-zinc-900">3Search</span>
        </button>
        <div className="flex items-center gap-4">
          <Link
            href="/stats"
            className="text-xs font-medium text-zinc-600 hover:text-violet-600 transition-colors"
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

      <div className="relative z-10 mx-auto max-w-6xl px-6">
        <AnimatePresence mode="wait">
          {phase === "landing" && (
            <motion.section
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="flex min-h-[70vh] flex-col items-center justify-center pb-20 text-center"
            >
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
              >
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/60 px-3 py-1 text-xs text-zinc-600 shadow-3d-sm backdrop-blur-xl">
                  <Sparkles className="h-3 w-3 text-violet-600" />
                  <span>Saring 100 produk → 3 kandidat terbaik</span>
                </div>
                <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-zinc-900 sm:text-6xl">
                  Temukan <span className="gradient-text">produk potensial viral</span>
                  <br className="hidden sm:block" /> sebelum semua orang tahu.
                </h1>
                <p className="mx-auto mt-5 max-w-xl text-base text-zinc-500">
                  Berbasis data, transparan soal akurasi. Kami tidak jual mimpi — kami tunjukkan alasannya.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.7 }}
                className="mt-10 w-full"
              >
                <SearchBar onSearch={handleSearch} />
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-zinc-500">
                  <span>Coba cepat:</span>
                  {["skincare lokal", "gadget", "fashion"].map((q) => (
                    <button
                      key={q}
                      onClick={() => handleSearch(q)}
                      className="rounded-full border border-white/70 bg-white/80 px-3 py-1 shadow-3d-sm backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:text-violet-600 hover:shadow-3d"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </motion.div>
            </motion.section>
          )}

          {phase === "analyzing" && result && (
            <motion.section
              key="analyzing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex min-h-[70vh] flex-col items-center justify-center pb-20"
            >
              <div className="mb-8 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl gradient-bg shadow-3d-glow">
                  <Radar className="h-6 w-6 animate-spin text-white" />
                </div>
                <p className="text-sm text-zinc-500">Menganalisis</p>
                <p className="mt-1 text-lg font-semibold text-zinc-900">
                  &quot;{result.query}&quot;
                </p>
              </div>
              <FunnelAnimation
                stage1={result.stage1}
                stage2={result.stage2}
                stage3={result.stage3}
                stage4={result.stage4}
              />
            </motion.section>
          )}

          {phase === "result" && result && (
            <motion.section
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="pb-24"
            >
              <div className="mb-8 flex items-center justify-between gap-4">
                <button
                  onClick={reset}
                  className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900"
                >
                  <ArrowLeft className="h-4 w-4" /> Analisis baru
                </button>
                <div className="text-xs text-zinc-500">
                  Hasil untuk: <span className="font-medium text-zinc-900">&quot;{result.query}&quot;</span>
                </div>
              </div>

              <div className="mb-10">
                <FunnelAnimation
                  stage1={result.stage1}
                  stage2={result.stage2}
                  stage3={result.stage3}
                  stage4={result.stage4}
                />
              </div>

              {result.insights && (
                <div className="mb-10">
                  <WarRoom insights={result.insights} />
                </div>
              )}

              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-zinc-900">3 Kandidat Terkuat</h2>
                <span className="text-xs text-zinc-500">Diurutkan berdasarkan skor sinyal</span>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                {result.products.map((p, i) => (
                  <ProductCard key={p.id} p={p} index={i} />
                ))}
              </div>

              <p className="mt-8 rounded-2xl border border-white/60 bg-white/80 p-4 text-center text-xs leading-relaxed text-zinc-500 shadow-3d-sm backdrop-blur">
                ⚠️ <strong className="text-zinc-700">Transparansi:</strong> Presisi historis top-3 kami ~58%. Dari 10 rekomendasi, ~4 bisa meleset — itu normal. Validasi stok & supplier sebelum keputusan besar.
              </p>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}