import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET() {
  try {
    if (!supabase) {
      return NextResponse.json({
        totalSearches: 0,
        totalRecommendations: 0,
        totalFeedback: 0,
        success: 0,
        failed: 0,
        hitRate: 0,
        trend: [],
        topQueries: [],
      });
    }

    // 1. Feedback data
    const { data: feedbackData } = await supabase
      .from("feedback")
      .select("status, created_at");

    // 2. Counts
    const [{ count: totalSearches }, { count: totalRecs }, { data: searchesData }] =
      await Promise.all([
        supabase.from("searches").select("*", { count: "exact", head: true }),
        supabase.from("recommendations").select("*", { count: "exact", head: true }),
        supabase.from("searches").select("query"),
      ]);

    const feedback = feedbackData || [];
    const totalFeedback = feedback.length;
    const success = feedback.filter((f) => f.status === "success").length;
    const failed = feedback.filter((f) => f.status === "failed").length;
    const hitRate =
      totalFeedback > 0 ? Math.round((success / totalFeedback) * 100) : 0;

    // 3. Trend 30 hari terakhir
    const now = new Date();
    const trendMap = new Map<string, { success: number; failed: number }>();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      trendMap.set(d.toISOString().split("T")[0], { success: 0, failed: 0 });
    }
    feedback.forEach((f) => {
      const date = new Date(f.created_at).toISOString().split("T")[0];
      if (trendMap.has(date)) {
        const entry = trendMap.get(date)!;
        if (f.status === "success") entry.success++;
        else entry.failed++;
      }
    });
    const trend = Array.from(trendMap.entries()).map(([date, d]) => ({
      date,
      success: d.success,
      failed: d.failed,
      total: d.success + d.failed,
      rate:
        d.success + d.failed > 0
          ? Math.round((d.success / (d.success + d.failed)) * 100)
          : null,
    }));

    // 4. Top queries
    const queryCounts = new Map<string, number>();
    (searchesData || []).forEach((s) => {
      const q = s.query.toLowerCase().trim();
      queryCounts.set(q, (queryCounts.get(q) || 0) + 1);
    });
    const topQueries = Array.from(queryCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([query, count]) => ({ query, count }));

    return NextResponse.json({
      totalSearches: totalSearches || 0,
      totalRecommendations: totalRecs || 0,
      totalFeedback,
      success,
      failed,
      hitRate,
      trend,
      topQueries,
    });
  } catch (err: any) {
    console.error("Stats error:", err);
    return NextResponse.json(
      { error: err?.message || "Gagal memuat stats" },
      { status: 500 }
    );
  }
}