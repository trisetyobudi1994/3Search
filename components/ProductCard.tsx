"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Check, AlertTriangle, TrendingUp, Users, Percent, ThumbsUp, ThumbsDown } from "lucide-react";
import { useRef, useState } from "react";
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

  const [feedback, setFeedback] = useState<"idle" | "loading" | "success" | "failed">("idle");

  const spring = { stiffness: 200, damping: 25, mass: 0.5 };
  const rotateX = useSpring(useTransform(my, [0, 1], [6, -6]), spring);
  const rotateY = useSpring(useTransform(mx, [0, 1], [-6, 6]), spring);
  const translateZ = useSpring(useTransform(hover, [0, 1], [0, 10]), spring);
  const glareOpacity = useSpring(useTransform(hover, [0, 1], [0, 0.9]), spring);
  const glare = useTransform([mx, my], ([x, y]: number[]) =>
    `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 55%)`
  );

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width);
    my.set((e.clientY - r.top) / r.height);
    hover.set(1);
  };
  const onLeave = () => { mx.set(0.5); my.set(0.5); hover.set(0); };

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
        style={{ rotateX, rotateY, z: translateZ, transformStyle: "preserve-3d" }}
        className="group relative flex flex-col h-full rounded-3xl bg-white p-6 shadow-3d ring-1 ring-zinc-200/60 transition-shadow duration-500 will-change-transform hover:shadow-3d-lg"
      >
        {/* OVERLAY LINK: Membuat seluruh kartu bisa diklik */}
        {p.url && (
          <a
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 z-10 rounded-3xl"
            aria-label={`Buka ${p.name} di TikTok Shop`}
          />
        )}

        <motion.div aria-hidden style={{ background: glare, opacity: