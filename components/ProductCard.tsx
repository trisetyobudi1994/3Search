"use client";

import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  AlertTriangle,
  Bookmark,
  Check,
  ExternalLink,
  Flame,
  Loader2,
  MessageSquare,
  Package,
  Star,
  ThumbsDown,
  ThumbsUp,
  Truck,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Product } from "@/lib/types";
import { formatCompact, formatMoney, formatNumber } from "@/lib/regions";
import { formatIDR, toIDR } from "@/lib/currency";
import { getLocalFeedback, recordLocalFeedback } from "@/lib/local-store";
import { sendFeedback } from "@/lib/client-api";
import ScoreRing from "./ScoreRing";

const CONFIDENCE_LABEL = {
  high: {
    text: "Kepercayaan tinggi",
    cls: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  medium: {
    text: "Kepercayaan sedang",
    cls: "bg-amber-50 text-amber-700 ring-amber-200",
  },
  low: {
    text: "Kepercayaan rendah",
    cls: "bg-zinc-100 text-zinc-700 ring-zinc-200",
  },
} as const;

interface Props {
  p: Product;
  index: number;
  saved: boolean;
  onToggleSave: (product: Product) => void;
  onNotify: (message: string) => void;
}

export default function ProductCard({
  p,
  index,
  saved,
  onToggleSave,
  onNotify,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const hover = useMotionValue(0);

  const [feedback, setFeedback] = useState<"idle" | "loading" | "success" | "failed">("idle");
  const [feedbackNote, setFeedbackNote] = useState<string | null>(null);
  const [imageFailed, setImageFailed] = useState(false);

  const spring = { stiffness: 200, damping: 26, mass: 0.5 };
  const rotateX = useSpring(useTransform(my, [0, 1], [5, -5]), spring);
  const rotateY = useSpring(useTransform(mx, [0, 1], [-5, 5]), spring);
  const translateZ = useSpring(useTransform(hover, [0, 1], [0, 8]), spring);
  const glareOpacity = useSpring(useTransform(hover, [0, 1], [0, 0.7]), spring);
  const glareX = useTransform(mx, (value) => value * 100);
  const glareY = useTransform(my, (value) => value * 100);
  const glare = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0) 55%)`;

  const confidence = CONFIDENCE_LABEL[p.confidence];
  const locale =
    p.currency === "USD" ? "en-US" : p.currency === "MYR" ? "ms-MY" : "id-ID";
  const feedbackKey = p.rec_id ?? p.id;

  useEffect(() => {
    setImageFailed(false);
  }, [p.id]);

  useEffect(() => {
    const local = getLocalFeedback()[feedbackKey];
    if (local) setFeedback(local);
  }, [feedbackKey]);

  const onMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    mx.set((event.clientX - rect.left) / rect.width);
    my.set((event.clientY - rect.top) / rect.height);
    hover.set(1);
  };

  const onLeave = () => {
    mx.set(0.5);
    my.set(0.5);
    hover.set(0);
  };

  const handleFeedback = async (status: "success" | "failed") => {
    if (feedback === "loading") return;
    setFeedback("loading");
    setFeedbackNote(null);
    try {
      let stored = false;
      let duplicate = false;
      if (p.rec_id) {
        const response = await sendFeedback({ rec_id: p.rec_id, status });
        stored = response.stored;
        duplicate = response.duplicate ?? false;
      }
      recordLocalFeedback(feedbackKey, status);
      setFeedback(status);
      setFeedbackNote(
        duplicate
          ? "Feedback produk ini sudah tercatat sebelumnya."
          : stored
          ? "Tersimpan ke database publik."
          : "Database belum aktif — tersimpan di perangkat ini."
      );
      onNotify("Feedback tersimpan. Terima kasih!");
    } catch {
      setFeedback("idle");
      onNotify("Feedback gagal dikirim. Coba lagi.");
    }
  };

  const priceIDR = p.priceIDR ?? toIDR(p.price, p.currency);
  const originalPriceIDR =
    p.discountPercent && p.discountPercent > 0 && p.discountPercent < 100
      ? Math.round(priceIDR / (1 - p.discountPercent / 100))
      : null;

  const hasFeedback = feedback === "success" || feedback === "failed";

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 + index * 0.1, duration: 0.55 }}
      className="h-full"
    >
      <motion.div
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        style={{ rotateX, rotateY, z: translateZ, transformStyle: "preserve-3d" }}
        className="group relative flex h-full flex-col rounded-3xl bg-white p-5 shadow-3d ring-1 ring-zinc-200/60 transition-shadow duration-500 will-change-transform hover:shadow-3d-lg sm:p-6"
      >
        <motion.div
          aria-hidden
          style={{ background: glare, opacity: glareOpacity }}
          className="pointer-events-none absolute inset-0 rounded-3xl mix-blend-overlay"
        />
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px rounded-full bg-gradient-to-r from-transparent via-white to-transparent" />

        <div
          style={{ transform: "translateZ(18px)" }}
          className="relative flex h-full flex-col preserve-3d"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] font-semibold text-white">
                  #{index + 1}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${confidence.cls}`}
                >
                  {confidence.text}
                </span>
                <button
                  type="button"
                  onClick={() => onToggleSave(p)}
                  aria-pressed={saved}
                  aria-label={saved ? "Hapus dari daftar pantau" : "Simpan ke daftar pantau"}
                  title={saved ? "Hapus dari daftar pantau" : "Simpan ke daftar pantau"}
                  className={`ml-auto rounded-lg p-1.5 transition-colors ${
                    saved
                      ? "bg-violet-50 text-violet-600"
                      : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                  }`}
                >
                  <Bookmark className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
                </button>
              </div>

              <div className="mt-2 flex items-start gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-violet-50 to-blue-50 text-2xl shadow-3d-sm ring-1 ring-zinc-200/80">
                  {p.image && !imageFailed ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.image}
                      alt={p.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      onError={() => setImageFailed(true)}
                    />
                  ) : (
                    <span aria-hidden>{p.emoji ?? "📦"}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-zinc-900">
                    {p.name}
                  </h3>
                  {p.shop && (
                    <p className="mt-0.5 truncate text-[11px] font-medium text-violet-600">
                      🏪 {p.shop}
                    </p>
                  )}
                  <div className="mt-1 flex flex-wrap items-baseline gap-1.5">
                    <span className="text-sm font-semibold text-zinc-900">
                      {formatIDR(priceIDR)}
                    </span>
                    {originalPriceIDR && (
                      <span className="text-[11px] text-zinc-400 line-through">
                        {formatIDR(originalPriceIDR)}
                      </span>
                    )}
                  </div>
                  {p.currency !== "IDR" && (
                    <div className="mt-0.5 text-[10px] text-zinc-400">
                      Harga asli {formatMoney(p.price, p.currency)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ transform: "translateZ(30px)" }} className="shrink-0">
              <ScoreRing score={p.score} />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-zinc-50 p-3 text-center ring-1 ring-zinc-200/50">
            <div>
              <Package className="mx-auto h-3.5 w-3.5 text-violet-600" />
              <div className="mt-1 text-sm font-semibold text-zinc-900">
                {p.sold > 0 ? formatCompact(p.sold, locale) : "—"}
              </div>
              <div className="text-[10px] text-zinc-500">Terjual</div>
            </div>
            <div>
              <Star className="mx-auto h-3.5 w-3.5 text-violet-600" />
              <div className="mt-1 text-sm font-semibold text-zinc-900">
                {p.rating > 0 ? p.rating.toFixed(1) : "—"}
              </div>
              <div className="text-[10px] text-zinc-500">Rating</div>
            </div>
            <div>
              <MessageSquare className="mx-auto h-3.5 w-3.5 text-violet-600" />
              <div className="mt-1 text-sm font-semibold text-zinc-900">
                {p.reviews > 0 ? formatCompact(p.reviews, locale) : "—"}
              </div>
              <div className="text-[10px] text-zinc-500">Ulasan</div>
            </div>
          </div>

          {(p.freeShipping || originalPriceIDR || (p.stock !== undefined && p.stock <= 20)) && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {p.freeShipping && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-emerald-200">
                  <Truck className="h-3 w-3" /> Gratis ongkir
                </span>
              )}
              {originalPriceIDR && (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-medium text-rose-700 ring-1 ring-rose-200">
                  <Flame className="h-3 w-3" /> Diskon {p.discountPercent}%
                </span>
              )}
              {p.stock !== undefined && p.stock <= 20 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 ring-1 ring-amber-200">
                  Stok {formatNumber(p.stock, locale)}
                </span>
              )}
            </div>
          )}

          <div className="mt-4 space-y-1.5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Alasan masuk top-3
            </div>
            {p.reasons.map((reason, i) => (
              <div key={i} className="flex items-start gap-2 text-[13px] text-zinc-700">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                <span>{reason}</span>
              </div>
            ))}
          </div>

          <div className="mt-3 space-y-1.5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Risiko
            </div>
            {p.risks.map((risk, i) => (
              <div key={i} className="flex items-start gap-2 text-[13px] text-zinc-600">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                <span>{risk}</span>
              </div>
            ))}
          </div>

          {p.breakdown && p.breakdown.length > 0 && (
            <details className="mt-3 rounded-xl bg-zinc-50/80 px-3 py-2 ring-1 ring-zinc-200/50">
              <summary className="cursor-pointer list-none text-[11px] font-medium text-zinc-500 transition-colors hover:text-zinc-800">
                Rincian skor {p.score}/100
              </summary>
              <div className="mt-2 space-y-1.5">
                {p.breakdown.map((part) => (
                  <div key={part.label}>
                    <div className="flex justify-between text-[10px] text-zinc-500">
                      <span>{part.label}</span>
                      <span>
                        {part.points}/{part.max}
                      </span>
                    </div>
                    <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-zinc-200">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500"
                        style={{
                          width: `${Math.min(100, (part.points / part.max) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </details>
          )}

          <div className="mt-auto pt-4">
            {p.url && (
              <a
                href={p.url}
                target="_blank"
                rel="noreferrer"
                className="mb-3 flex items-center justify-center gap-1.5 rounded-xl gradient-bg px-3 py-2 text-xs font-medium text-white shadow-3d-glow transition-all hover:brightness-110"
              >
                Buka di TikTok
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}

            <div className="border-t border-zinc-100 pt-4">
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Validasi rekomendasi ini
              </div>

              {!hasFeedback ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleFeedback("success")}
                    disabled={feedback === "loading"}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-50 py-2 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200 transition-colors hover:bg-emerald-100 disabled:opacity-60"
                  >
                    {feedback === "loading" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <ThumbsUp className="h-3.5 w-3.5" />
                    )}
                    Beneran laku
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFeedback("failed")}
                    disabled={feedback === "loading"}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-rose-50 py-2 text-xs font-medium text-rose-700 ring-1 ring-rose-200 transition-colors hover:bg-rose-100 disabled:opacity-60"
                  >
                    <ThumbsDown className="h-3.5 w-3.5" />
                    Meleset
                  </button>
                </div>
              ) : (
                <div
                  className={`rounded-xl py-2 text-center text-xs font-medium ring-1 ${
                    feedback === "success"
                      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                      : "bg-rose-50 text-rose-700 ring-rose-200"
                  }`}
                >
                  {feedback === "success"
                    ? "Terima kasih! Data disimpan ✅"
                    : "Terima kasih atas koreksinya 🙏"}
                </div>
              )}

              {feedbackNote && (
                <p className="mt-1.5 text-center text-[10px] leading-relaxed text-zinc-400">
                  {feedbackNote}
                </p>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
