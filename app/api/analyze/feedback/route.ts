import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const limiter = rateLimit(`feedback:${clientIp(req.headers)}`, 60, 10 * 60 * 1000);
  if (!limiter.ok) {
    return NextResponse.json(
      { error: "Terlalu banyak feedback. Coba lagi nanti." },
      { status: 429, headers: { "Retry-After": String(limiter.retryAfterSeconds) } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body permintaan tidak valid." }, { status: 400 });
  }

  const payload = (body ?? {}) as Record<string, unknown>;
  const recId = typeof payload.rec_id === "string" ? payload.rec_id.trim() : "";
  const status = payload.status;

  if (!recId || (status !== "success" && status !== "failed")) {
    return NextResponse.json(
      { error: "Data feedback tidak valid." },
      { status: 400 }
    );
  }

  const supabase = getSupabase();
  if (!supabase) {
    // Bukan error: UI akan menyimpan feedback di perangkat pengguna.
    return NextResponse.json({
      stored: false,
      demo: true,
      message: "Database belum terhubung — feedback disimpan di perangkat ini.",
    });
  }

  const { error } = await supabase.from("feedback").insert({
    recommendation_id: recId,
    status,
  });

  if (error) {
    // 23505 = unique violation: satu rekomendasi hanya boleh divalidasi sekali.
    if (error.code === "23505") {
      return NextResponse.json({ stored: true, duplicate: true });
    }
    // 23503 = foreign key violation: rec_id tidak dikenal / sudah dihapus.
    if (error.code === "23503") {
      return NextResponse.json(
        {
          error: "Rekomendasi tidak ditemukan.",
          hint: "Jalankan analisis ulang lalu beri feedback pada hasil terbaru.",
          code: "unknown_recommendation",
        },
        { status: 400 }
      );
    }
    console.error("Feedback error:", error.message);
    return NextResponse.json(
      { error: "Gagal menyimpan feedback." },
      { status: 500 }
    );
  }

  const [successRes, failedRes] = await Promise.all([
    supabase
      .from("feedback")
      .select("*", { count: "exact", head: true })
      .eq("status", "success"),
    supabase
      .from("feedback")
      .select("*", { count: "exact", head: true })
      .eq("status", "failed"),
  ]);

  const success = successRes.count ?? 0;
  const failed = failedRes.count ?? 0;
  const total = success + failed;

  return NextResponse.json({
    stored: true,
    stats: {
      success,
      failed,
      total,
      hitRate: total > 0 ? Math.round((success / total) * 100) : 0,
    },
  });
}
