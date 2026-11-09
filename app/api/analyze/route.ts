import { NextRequest, NextResponse } from "next/server";
import { buildFunnel } from "@/lib/pipeline";
import { buildDemoDataset } from "@/lib/demo";
import {
  fetchTikTokProducts,
  isApifyConfigured,
  ScraperError,
} from "@/lib/apify";
import { getCached, setCached } from "@/lib/cache";
import { getSupabase } from "@/lib/supabase";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { isRegionCode, DEFAULT_REGION } from "@/lib/regions";
import type { FunnelResult, Product, RegionCode } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_QUERY_LENGTH = 80;
const WINDOW_MS = 10 * 60 * 1000;

export async function POST(req: NextRequest) {
  const startedAt = Date.now();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Body permintaan tidak valid.", code: "invalid_body" },
      { status: 400 }
    );
  }

  const payload = (body ?? {}) as Record<string, unknown>;
  const query = String(payload.query ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_QUERY_LENGTH);
  const regionRaw = String(payload.region ?? DEFAULT_REGION).toUpperCase();
  const region: RegionCode = isRegionCode(regionRaw) ? regionRaw : DEFAULT_REGION;

  if (query.length < 2) {
    return NextResponse.json(
      {
        error: "Kata kunci terlalu pendek.",
        hint: "Masukkan minimal 2 karakter, misalnya “serum niacinamide”.",
        code: "invalid_query",
      },
      { status: 400 }
    );
  }

  const live = isApifyConfigured();
  const limit = live ? 20 : 120;
  const limiter = rateLimit(`analyze:${clientIp(req.headers)}`, limit, WINDOW_MS);

  if (!limiter.ok) {
    return NextResponse.json(
      {
        error: "Terlalu banyak permintaan analisis.",
        hint: `Coba lagi dalam ${Math.ceil(limiter.retryAfterSeconds / 60)} menit.`,
        code: "rate_limited",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(limiter.retryAfterSeconds),
          "Cache-Control": "no-store",
        },
      }
    );
  }

  try {
    // 1. Cache (hanya untuk data live agar dataset demo selalu segar).
    if (live) {
      const cached = await getCached(query, region);
      if (cached) {
        const result: FunnelResult = {
          ...cached,
          query,
          region,
          cached: true,
          durationMs: Date.now() - startedAt,
          warnings: Array.from(
            new Set([
              ...cached.warnings,
              "Hasil diambil dari cache untuk menghemat kuota scraper.",
            ])
          ),
        };
        return NextResponse.json(result, {
          headers: { "Cache-Control": "no-store" },
        });
      }
    }

    const warnings: string[] = [];
    let raw: unknown[] = [];
    let mode: FunnelResult["mode"] = "demo";

    if (live) {
      try {
        raw = await fetchTikTokProducts(query, region, 100);
        mode = "live";
      } catch (error) {
        const scraperError =
          error instanceof ScraperError
            ? error
            : new ScraperError("unknown", error instanceof Error ? error.message : "Gagal mengambil data.");
        console.error(`Scraper gagal (${scraperError.code}):`, scraperError.message);
        warnings.push(
          `Sumber live gagal (${scraperError.code}). Hasil di bawah memakai dataset demo sementara.`
        );
        raw = buildDemoDataset(query, region);
        mode = "demo";
      }
    } else {
      raw = buildDemoDataset(query, region);
    }

    // 2. Pipeline: normalisasi → filter → skor → insight.
    const result = buildFunnel(raw, {
      query,
      region,
      mode,
      startedAt,
      extraWarnings: warnings,
    });

    // 3. Simpan ke database hanya untuk data live, agar statistik publik
    //    tidak tercampur data simulasi. Cache ditulis lebih dulu dan tanpa
    //    rec_id, supaya permintaan berikutnya tidak memanggil scraper lagi.
    if (mode === "live") {
      await setCached(query, region, result);
      const persisted = await persistResult(result);
      if (persisted) {
        return NextResponse.json(persisted, {
          headers: { "Cache-Control": "no-store" },
        });
      }
    }

    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Analyze error:", error);
    return NextResponse.json(
      {
        error: "Analisis gagal diproses.",
        hint: "Coba lagi sebentar. Jika berulang, periksa konfigurasi scraper.",
        code: "analyze_failed",
      },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}

/**
 * Menyimpan pencarian + rekomendasi lalu mengembalikan hasil dengan rec_id.
 * Kegagalan database tidak boleh menggagalkan analisis.
 */
async function persistResult(result: FunnelResult): Promise<FunnelResult | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data: search, error: searchError } = await supabase
      .from("searches")
      .insert({ query: result.query, region: result.region })
      .select("id")
      .single();

    if (searchError || !search?.id) {
      console.warn("Gagal menyimpan search:", searchError?.message);
      return null;
    }

    const rows = result.products.map((product) => ({
      search_id: search.id,
      product_id: product.id,
      product_name: product.name,
      score: product.score,
    }));

    const { data: inserted, error: insertError } = await supabase
      .from("recommendations")
      .insert(rows)
      .select("id, product_id");

    if (insertError) {
      console.warn("Gagal menyimpan rekomendasi:", insertError.message);
      return result;
    }

    const byProduct = new Map<string, string>();
    for (const row of (inserted ?? []) as { id: string; product_id: string }[]) {
      byProduct.set(row.product_id, row.id);
    }

    const products: Product[] = result.products.map((product) => ({
      ...product,
      rec_id: byProduct.get(product.id),
    }));

    return { ...result, products };
  } catch (error) {
    console.warn("Persist error:", error);
    return null;
  }
}
