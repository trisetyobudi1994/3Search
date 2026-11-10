"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Check, AlertTriangle, TrendingUp, Users, Percent, ThumbsUp, ThumbsDown, ShoppingCart, Search } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import type { Product } from "@/lib/types";
import ScoreRing from "./ScoreRing";

const CONFIDENCE_LABEL = {
  high: { text: "Kepercayaan Tinggi", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  medium: { text: "Kepercayaan Sedang", cls: "bg-amber-50 text-amber-700 ring-amber-200" },
  low: { text: "Kepercayaan Rendah", cls: "bg-zinc-100 text-zinc-700 ring-zinc-200" },
};

export default function ProductCard({ p, index }: { p: Product; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const hover = useMotionValue(0);
  const [isMobile, setIsMobile] = useState(false);
  const [feedback, setFeedback] = useState<"idle" | "loading" | "success" | "failed">("idle");

  useEffect(() => {
    setIsMobile(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  const spring = { stiffness: 200, damping: 25, mass: 0.5 };
  const rotateX = useSpring(useTransform(my, [0, 1], [6, -6]), spring);
  const rotateY = useSpring(useTransform(mx, [0, 1], [-6, 6]), spring);
  const translateZ = useSpring(useTransform(hover, [0, 1], [0, 10]), spring);
  const glareOpacity = useSpring(useTransform(hover, [0, 1], [0, 0.9]), spring);
  
  const glare = useTransform([mx, my], ([x, y]: number[]) =>
    `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 55%)`
  );

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMobile || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width);
    my.set((e.clientY - r.top) / r.height);
    hover.set(1);
  };
  
  const onLeave = () => { 
    if (isMobile) return;
    mx.set(0.5); my.set(0.5); hover.set(0); 
  };

  const c = CONFIDENCE_LABEL[p.confidence];

  const handleFeedback = async (status: "success" | "failed") => {
    if (!p.rec_id || feedback === "loading" || feedback !== "idle") return;
    setFeedback("loading");
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rec_id: p.rec_id, status }),
      });
      setFeedback(status);
    } catch {
      setFeedback("idle");
    }
  };

  // Buat URL Pencarian TikTok berdasarkan judul produk
  const tiktokSearchUrl = `https://www.tiktok.com/search?q=${encodeURIComponent(p.name)}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 32, rotateX: -10 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ delay: 0.15 + index * 0.12, duration: 0.7, type: "spring", stiffness: 80, damping: 18 }}
      style={{ perspective: 1200 }}
    >
      <motion.div
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        whileTap={isMobile ? { scale: 0.98 } : {}}
        style={isMobile ? {} : { rotateX, rotateY, z: translateZ, transformStyle: "preserve-3d" }}
        className="group relative flex flex-col h-full rounded-3xl bg-white p-5 sm:p-6 shadow-3d ring-1 ring-zinc-200/60 transition-shadow duration-500 will-change-transform hover:shadow-3d-lg"
      >
        {!isMobile && (
          <>
            <motion.div 
              aria-hidden 
              style={{ background: glare, opacity: glareOpacity }}
              className="pointer-events-none absolute inset-0 rounded-3xl mix-blend-overlay z-0" 
            />
            <div className="pointer-events-none absolute inset-x-8 top-0 h-px rounded-full bg-gradient-to-r from-transparent via-white to-transparent z-0" />
          </>
        )}

        <div style={isMobile ? {} : { transform: "translateZ(24px)" }} className="relative flex flex-col flex-grow z-10">
          
          <div className="flex items-start justify-between gap-3 sm:gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-zinc-50 text-xl sm:text-2xl shadow-3d-sm ring-1 ring-zinc-200">
                {p.image ? (
                  <img src={p.image} alt={p.name} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  p.emoji
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-zinc-400">#{index + 1}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[9px] sm:text-[10px] font-medium ring-1 ${c.cls}`}>{c.text}</span>
                </div>
                <h3 className="mt-1 text-sm sm:text-[15px] font-semibold leading-tight text-zinc-900 line-clamp-2">{p.name}</h3>
                {p.seller && (
                  <p className="mt-0.5 text-[10px] sm:text-[11px] text-violet-600 font-medium truncate">🏪 {p.seller}</p>
                )}
                <p className="mt-0.5 text-xs sm:text-sm text-zinc-500">Rp {p.price.toLocaleString("id-ID")}</p>
              </div>
            </div>
            <div className="shrink-0 scale-90 sm:scale-100 origin-top-right">
              <ScoreRing score={p.score} />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-1 sm:gap-2 rounded-2xl bg-zinc-50 p-2 sm:p-3 text-center ring-1 ring-zinc-200/50">
            <div>
              <TrendingUp className="mx-auto h-3.5 w-3.5 text-violet-600" />
              <div className="mt-1 text-xs sm:text-sm font-semibold text-zinc-900">{p.velocity.toFixed(1)}×</div>
              <div className="text-[9px] sm:text-[10px] text-zinc-500">Velocity</div>
            </div>
            <div>
              <Users className="mx-auto h-3.5 w-3.5 text-violet-600" />
              <div className="mt-1 text-xs sm:text-sm font-semibold text-zinc-900">{p.sellers}</div>
              <div className="text-[9px] sm:text-[10px] text-zinc-500">Seller</div>
            </div>
            <div>
              <Percent className="mx-auto h-3.5 w-3.5 text-violet-600" />
              <div className="mt-1 text-xs sm:text-sm font-semibold text-zinc-900">{p.margin}%</div>
              <div className="text-[9px] sm:text-[10px] text-zinc-500">Margin</div>
            </div>
          </div>

          <div className="mt-4 space-y-1.5">
            <div className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Alasan top-3</div>
            {p.reasons.map((r, i) => (
              <div key={i} className="flex items-start gap-2 text-xs sm:text-[13px] text-zinc-700">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                <span>{r}</span>
              </div>
            ))}
          </div>

          <div className="mt-3 space-y-1.5 mb-4">
            <div className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Risiko</div>
            {p.risks.map((r, i) => (
              <div key={i} className="flex items-start gap-2 text-xs sm:text-[13px] text-zinc-600">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                <span>{r}</span>
              </div>
            ))}
          </div>

          {/* AREA TOMBOL: TIKTOK & TOKOPEDIA */}
          <div className="mt-auto relative z-30">
            
            <div className="grid grid-cols-2 gap-2 mb-3">
              {/* Tombol TikTok (Affiliate) */}
              <a
                href={tiktokSearchUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-2 py-2.5 text-[10px] sm:text-xs font-medium text-white shadow-sm transition-all hover:bg-zinc-800"
              >
                <Search className="h-3.5 w-3.5" /> Cari di TikTok
              </a>

              {/* Tombol Tokopedia (Beli) */}
              {p.url && (
                <a
                  href={p.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-2 py-2.5 text-[10px] sm:text-xs font-medium text-white shadow-sm transition-all hover:bg-emerald-600"
                >
                  <ShoppingCart className="h-3.5 w-3.5" /> Beli di Tokped
                </a>
              )}
            </div>

            <div className="border-t border-zinc-100 pt-3 sm:pt-4">
              <div className="mb-2 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Validasi rekomendasi ini
              </div>
              {feedback === "idle" || feedback === "loading" ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleFeedback("success")}
                    disabled={feedback === "loading" || !p.rec_id}
                    className="flex flex-1 items-center justify-center gap-1 sm:gap-1.5 rounded-xl bg-emerald-50 py-2 sm:py-2.5 text-[10px] sm:text-xs font-medium text-emerald-700 ring-1 ring-emerald-200 transition-colors hover:bg-emerald-100 disabled:opacity-50"
                  >
                    <ThumbsUp className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Beneran Laku
                  </button>
                  <button
                    onClick={() => handleFeedback("failed")}
                    disabled={feedback === "loading" || !p.rec_id}
                    className="flex flex-1 items-center justify-center gap-1 sm:gap-1.5 rounded-xl bg-rose-50 py-2 sm:py-2.5 text-[10px] sm:text-xs font-medium text-rose-700 ring-1 ring-rose-200 transition-colors hover:bg-rose-100 disabled:opacity-50"
                  >
                    <ThumbsDown className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Meleset
                  </button>
                </div>
              ) : (
                <div className={`rounded-xl py-2 text-center text-[10px] sm:text-xs font-medium ring-1 ${
                  feedback === "success" 
                    ? "bg-emerald-50 text-emerald-700 ring-emerald-200" 
                    : "bg-rose-50 text-rose-700 ring-rose-200"
                }`}>
                  {feedback === "success" ? "Terima kasih! Tersimpan ✅" : "Terima kasih atas koreksinya 🙏"}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}