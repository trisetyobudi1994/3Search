"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, Search, Loader2 } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function HistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchHistory = async () => {
      const { data: { session } } = await supabase!.auth.getSession();
      if (!session) return router.push("/login");

      const res = await fetch("/api/history", {
        headers: { "Authorization": `Bearer ${session.access_token}` }
      });
      if (res.ok) {
        setHistory(await res.json());
      }
      setLoading(false);
    };
    fetchHistory();
  }, [router]);

  return (
    <main className="grain relative min-h-screen bg-[#fafafa] px-4 sm:px-6 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(124,58,237,0.1),transparent_50%)] pointer-events-none" />
      
      <div className="relative z-10 mx-auto max-w-3xl">
        <Link href="/" className="mb-8 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900">
          <ArrowLeft className="h-4 w-4" /> Kembali ke Beranda
        </Link>
        
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 mb-2">Riwayat Pencarian</h1>
        <p className="text-zinc-500 mb-8 text-sm sm:text-base">10 pencarian terakhir Anda.</p>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-violet-600" /></div>
        ) : history.length === 0 ? (
          <div className="rounded-3xl bg-white p-10 text-center shadow-3d ring-1 ring-zinc-200">
            <Search className="mx-auto h-10 w-10 text-zinc-300 mb-4" />
            <h3 className="text-lg font-semibold text-zinc-900">Belum ada riwayat</h3>
            <p className="text-sm text-zinc-500">Mulai analisis produk pertama Anda.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((h, i) => (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} key={h.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3 border-b border-zinc-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-violet-600" />
                    <span className="font-semibold text-zinc-900 capitalize">"{h.query}"</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-zinc-400">
                    <Clock className="h-3 w-3" /> 
                    {new Date(h.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
                <div className="space-y-2">
                  {h.recommendations?.map((r: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-zinc-600 line-clamp-1">{idx + 1}. {r.product_name}</span>
                      <span className="font-medium text-emerald-600 ml-4 shrink-0">Skor {r.score}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
