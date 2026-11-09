import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import type { StatsResponse, TrendPoint } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMPTY: Omit<StatsResponse, "database" | "updatedAt"> = {
  totalSearches: 0,
  totalRecommendations: 0,
  totalFeedback: 0,
  success: 0,
  failed: 0,
  hitRate: 0,
  trend: [],
  topQueries: [],
};

function emptyTrend(): TrendPoint[] {
  const trend: TrendPoint[] = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    trend.push({
      date: date.toISOString().slice(0, 10),
      success: 0,
      failed: 0,
      total: 0,
      rate: null,
    });
  }
  return trend;
}

export async function GET() {
  const headers = {
    "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
  };

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json(
      {
        ...EMPTY,
        trend: emptyTrend(),
        database: false,
        updatedAt: new Date().toISOString(),
      } satisfies StatsResponse,
      { headers }
    );
  }

  try {
    const [searchCount, recCount, feedbackRes, searchesRes] = await Promise.all([
      supabase.from("searches").select("*", { count: "exact", head: true }),
      supabase.from("recommendations").select("*", { count: "exact", head: true }),
      supabase
        .from("feedback")
        .select("status, created_at")
        .order("created_at", { ascending: false })
        .limit(5_000),
      supabase
        .from("searches")
        .select("query")
        .order("created_at", { ascending: false })
        .limit(5_000),
    ]);

    if (feedbackRes.error) {
      console.warn("Stats feedback error:", feedbackRes.error.message);
    }

    const feedback = (feedbackRes.data ?? []) as {
      status: string;
      created_at: string;
    }[];
    const totalFeedback = feedback.length;
    const success = feedback.filter((f) => f.status === "success").length;
    const failed = feedback.filter((f) => f.status === "failed").length;
    const hitRate = totalFeedback > 0 ? Math.round((success / totalFeedback) * 100) : 0;

    const trendMap = new Map<string, { success: number; failed: number }>();
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      trendMap.set(date.toISOString().slice(0, 10), { success: 0, failed: 0 });
    }

    for (const item of feedback) {
      const parsed = new Date(item.created_at);
      if (Number.isNaN(parsed.getTime())) continue;
      const key = parsed.toISOString().slice(0, 10);
      const entry = trendMap.get(key);
      if (!entry) continue;
      if (item.status === "success") entry.success += 1;
      else if (item.status === "failed") entry.failed += 1;
    }

    const trend: TrendPoint[] = Array.from(trendMap.entries()).map(([date, day]) => {
      const total = day.success + day.failed;
      return {
        date,
        success: day.success,
        failed: day.failed,
        total,
        rate: total > 0 ? Math.round((day.success / total) * 100) : null,
      };
    });

    const queryCounts = new Map<string, number>();
    for (const row of (searchesRes.data ?? []) as { query: string }[]) {
      const normalized = row.query?.toLowerCase().trim();
      if (!normalized) continue;
      queryCounts.set(normalized, (queryCounts.get(normalized) ?? 0) + 1);
    }

    const topQueries = Array.from(queryCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([query, count]) => ({ query, count }));

    const payload: StatsResponse = {
      database: true,
      totalSearches: searchCount.count ?? 0,
      totalRecommendations: recCount.count ?? 0,
      totalFeedback,
      success,
      failed,
      hitRate,
      trend,
      topQueries,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(payload, { headers });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json(
      {
        ...EMPTY,
        trend: emptyTrend(),
        database: true,
        updatedAt: new Date().toISOString(),
        error: "Gagal memuat statistik.",
      },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
