import { NextRequest, NextResponse } from "next/server";
import { fetchTikTokProducts } from "@/lib/apify";
import type { Product, FunnelResult } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

function toNumber(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const clean = v.replace(/[^\d.]/g, "");
    return parseFloat(clean) || 0;
  }
  return 0;
}

function normalizePrice(v: unknown): number {
  const n = toNumber(v);
  return n > 100000 ? Math.round(n / 100) : n;
}

function scoreProduct(p: { sold: number; rating: number; review: number; price: number }): number {
  const soldScore = Math.min(40, Math.log10(p.sold + 1) * 10);
  const ratingScore = Math.min(30, (p.rating / 5) * 30);
  const reviewScore = Math.min(20, Math.log10(p.review + 1) * 5);
  const priceScore = p.price > 0 && p.price < 500000 ? 10 : 5;
  return Math.round(soldScore + ratingScore + reviewScore + priceScore);
}

function confidenceFromScore(score: number): Product["confidence"] {
  if (score >= 75) return "high";
  if (score >= 60) return "medium";
  return "low";
}

function mapToProduct(raw: any, index: number): Product {
  const sold = toNumber(raw.soldCount ?? raw.sold ?? raw.sales);
  const rating = toNumber(raw.rating) || 4.5;
  const review = toNumber(raw.reviewCount ?? raw.reviews);
  const price = normalizePrice(raw.price);
  const score = scoreProduct({ sold, rating, review, price });

  const reasons: string[] = [];
  const risks: string[] = [];

  if (sold > 0) reasons.push(`Terjual ${sold.toLocaleString("id-ID")}+ unit`);
  if (rating >= 4.5) reasons.push(`Rating tinggi ${rating.toFixed(1)}/5`);
  if (review > 0) reasons.push(`${review.toLocaleString("id-ID")} ulasan`);
  if (price > 0 && price < 150000) reasons.push("Harga impulse buy (< Rp 150rb)");

  if (sold < 50) risks.push("Volume penjualan masih rendah");
  if (review < 20) risks.push("Ulasan sedikit — validasi pasar belum kuat");
  if (rating < 4.2) risks.push("Rating di bawah rata-rata");
  if (price >= 500000) risks.push("Harga tinggi — konversi bisa lebih lambat");
  if (reasons.length === 0) reasons.push("Sinyal awal dari pencarian keyword");

  return {
    id: raw.productId || raw.id || `prod-${index}`,
    name: raw.title || raw.productName || "Produk TikTok Shop",
    emoji: "📦",
    price,
    score,
    confidence: confidenceFromScore(score),
    reasons: reasons.slice(0, 3),
    risks: risks.length ? risks.slice(0, 2) : ["Validasi supplier sebelum stok besar"],
    margin: 25,
    sellers: 1,
    velocity: sold > 0 ? Math.min(3, sold / 100) : 1,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query: string = (body.query || "").toString().trim();
    const region: string = (body.region || "ID").toString().toUpperCase();

    if (!query) {
      return NextResponse.json({ error: "Query wajib diisi" }, { status: 400 });
    }

    const raw = await fetchTikTokProducts(query, region, 100);
    const stage1 = raw.length;

    const filtered = raw.filter((p) => {
      const sold = toNumber(p.soldCount ?? p.sold);
      const rating = toNumber(p.rating);
      const review = toNumber(p.reviewCount ?? p.reviews);
      return sold >= 10 && rating >= 4.2 && review >= 20;
    });

    const stage2List = filtered.length >= 3 ? filtered : raw.slice(0, 50);
    const stage2 = stage2List.length;

    const scored = stage2List
      .map((p, i) => mapToProduct(p, i))
      .sort((a, b) => b.score - a.score);

    const stage3 = Math.min(10, scored.length);
    const top10 = scored.slice(0, stage3);
    const top3 = top10.slice(0, 3);
    const stage4 = top3.length;

    const result: FunnelResult = { query, stage1, stage2, stage3, stage4, products: top3 };
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Apify error:", err);
    return NextResponse.json(
      { error: err?.message || "Gagal mengambil data TikTok Shop" },
      { status: 500 }
    );
  }
}