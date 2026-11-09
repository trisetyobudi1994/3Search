import { NextRequest, NextResponse } from "next/server";
import { fetchTikTokProducts } from "@/lib/apify";
import { generateInsights } from "@/lib/insights";
import { getCached, setCached } from "@/lib/cache";
import { supabase } from "@/lib/supabase";
import type { Product, FunnelResult } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

function toNumber(v: any): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return parseFloat(v.replace(/[^\d.]/g, "")) || 0;
  return 0;
}

function mapToProduct(raw: any, index: number): Product {
  const price = toNumber(raw.price || 0);
  const rating = raw.rating || 0;
  const review = toNumber(raw.review_count || 0);
  const sold = toNumber(raw.sold_count || 0);
  
  const soldScore = Math.min(40, Math.log10(sold + 1) * 10);
  const ratingScore = Math.min(30, (rating / 5) * 30);
  const reviewScore = Math.min(20, Math.log10(review + 1) * 5);
  const score = Math.round(soldScore + ratingScore + reviewScore + 10);

  const image = raw.main_image || raw.image_urls?.[0]; 
  const url = raw.product_url;

  return {
    id: raw.product_id || `prod-${index}`,
    name: raw.title || "Produk TikTok Shop",
    emoji: "📦",
    price: price,
    score: Math.min(score, 100),
    confidence: score >= 75 ? "high" : score >= 60 ? "medium" : "low",
    reasons: [
      sold > 0 ? `Terjual ${sold.toLocaleString("id-ID")}+` : "Produk baru",
      rating >= 4.5 ? `Rating ${rating}/5` : "Rating standar",
      "Sinyal pencarian"
    ],
    risks: ["Validasi supplier sebelum stok besar"],
    margin: 25,
    sellers: 1,
    velocity: sold > 0 ? Math.min(3, sold / 1000) : 1,
    image: image,
    seller: raw.seller_name || "Seller TikTok",
    url: url,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query = (body.query || "").toString().trim();
    const region = (body.region || "ID").toString().toUpperCase();

    if (!query) return NextResponse.json({ error: "Kata kunci wajib diisi" }, { status: 400 });

    // 1. Ambil data (dari cache ATAU apify)
    let result: FunnelResult;
    const cached = await getCached(query, region);

    if (cached) {
      result = cached; // Pakai data cache
    } else {
      const raw = await fetchTikTokProducts(query, region, 100);
      const scored = raw.map((p, i) => mapToProduct(p, i)).sort((a, b) => b.score - a.score);
      const top3 = scored.slice(0, 3);
      const insights = generateInsights(top3);
      
      result = { 
        query, stage1: raw.length, stage2: raw.length, stage3: 10, stage4: 3, 
        products: top3, insights 
      };
      await setCached(query, region, result);
    }

    // 2. SELALU Simpan ke Supabase (agar dapat rec_id untuk tombol feedback)
    if (supabase) {
      const { data: searchData } = await supabase.from("searches").insert({ query, region }).select("id").single();
      if (searchData?.id) {
        const recs = result.products.map((p) => ({ search_id: searchData.id, product_id: p.id, product_name: p.name, score: p.score }));
        const { data: inserted } = await supabase.from("recommendations").insert(recs).select("id, product_id");
        
        if (inserted) {
          result.products = result.products.map((p) => ({ 
            ...p, 
            rec_id: inserted.find((r: any) => r.product_id === p.id)?.id 
          }));
        }
      }
    }

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("API Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}