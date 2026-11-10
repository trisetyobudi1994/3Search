"use client";
import { Check, Zap, Crown, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function PricingPage() {
  return (
    <main className="grain relative min-h-screen bg-[#fafafa] px-4 sm:px-6 py-10 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(124,58,237,0.1),transparent_50%)] pointer-events-none" />
      
      <div className="relative z-10 mx-auto max-w-5xl">
        <Link href="/" className="mb-8 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900">
          <ArrowLeft className="h-4 w-4" /> Kembali ke Beranda
        </Link>
        
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-5xl font-bold text-zinc-900 mb-4">
            Pilih Paket yang <span className="gradient-text">Tepat</span>
          </h1>
          <p className="text-zinc-500 max-w-xl mx-auto">
            Mulai gratis untuk mencoba. Upgrade saat bisnis Anda mulai berkembang.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* PAKET FREE */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl bg-white p-8 shadow-3d ring-1 ring-zinc-200">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100">
                <Zap className="h-5 w-5 text-zinc-600" />
              </div>
              <h2 className="text-xl font-bold text-zinc-900">Starter</h2>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold text-zinc-900">Rp 0</span>
              <span className="text-zinc-500"> / selamanya</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2 text-sm text-zinc-600"><Check className="h-4 w-4 text-emerald-500" /> 5 Pencarian per hari</li>
              <li className="flex items-center gap-2 text-sm text-zinc-600"><Check className="h-4 w-4 text-emerald-500" /> War Room Analysis</li>
              <li className="flex items-center gap-2 text-sm text-zinc-600"><Check className="h-4 w-4 text-emerald-500" /> Riwayat 10 Pencarian</li>
              <li className="flex items-center gap-2 text-sm text-zinc-400"><Check className="h-4 w-4 text-zinc-300" /> <span className="line-through">Export CSV</span></li>
            </ul>
            <button disabled className="w-full rounded-xl bg-zinc-100 py-3 text-sm font-semibold text-zinc-500 cursor-not-allowed">
              Paket Saat Ini
            </button>
          </motion.div>

          {/* PAKET PRO */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="relative rounded-3xl bg-zinc-900 p-8 shadow-3d ring-1 ring-zinc-800 overflow-hidden">
            <div className="absolute top-0 right-0 bg-gradient-to-l from-violet-600 to-blue-600 text-white text-[10px] font-bold px-4 py-1 rounded-bl-xl uppercase tracking-wider">
              Paling Populer
            </div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/20">
                <Crown className="h-5 w-5 text-violet-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Pro Seller</h2>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold text-white">Rp 49rb</span>
              <span className="text-zinc-400"> / bulan</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2 text-sm text-zinc-300"><Check className="h-4 w-4 text-violet-400" /> Pencarian Tanpa Batas</li>
              <li className="flex items-center gap-2 text-sm text-zinc-300"><Check className="h-4 w-4 text-violet-400" /> War Room Analysis</li>
              <li className="flex items-center gap-2 text-sm text-zinc-300"><Check className="h-4 w-4 text-violet-400" /> Riwayat Tanpa Batas</li>
              <li className="flex items-center gap-2 text-sm text-zinc-300"><Check className="h-4 w-4 text-violet-400" /> Export CSV</li>
            </ul>
            <button className="w-full rounded-xl gradient-bg py-3 text-sm font-semibold text-white shadow-3d-glow hover:brightness-110 transition-all">
              Upgrade ke Pro
            </button>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
