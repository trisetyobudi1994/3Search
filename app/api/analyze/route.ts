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
  if (typeof v === "string") {
    const clean = v.replace(/[^\d.]/g, "");
    return parseFloat(clean) || 0;
  }
  return 0;
}

// 👇 FUNGSI MAPPING DISESUAIKAN DENGAN ACTOR BARU 👇
function mapToProduct(raw: any, index: number): Product {
  // Actor baru mengembalikan 'price' sebagai string (misal "$24.99")
  const priceStr = raw.price || "0";
  const price = parseFloat(priceStr.replace(/[^0-9.]/g, "")) || 0;
  
  const rating = raw.rating || 0;
  const review = 0; // Actor ini tidak memberikan review count
  const sold = toNumber(raw.sold_count);
  
  const soldScore = Math.min(40, Math.log10(sold + 1) * 10);
  const ratingScore = Math.min(30, (rating / 5) * 30);
  const priceScore = price > 0 ? 10 : 5;
  const score = Math.round(soldScore + ratingScore + priceScore);

  const reasons: string[] = [];
  const risks: string[] = [];

  if (sold > 0) reasons.push(`Terjual ${sold.toLocaleString("id-ID")}+ unit`);
  if (rating >= 4.5) reasons.push(`Rating tinggi ${rating.toFixed(1)}/5`);
  if (price > 0 && price < 150000) reasons.push("Harga impulse buy");

  if (sold < 50) risks.push("Volume penjualan masih rendah");
  if (rating < 4.2) risks.push("Rating di bawah rata-rata");
  
  if (reasons.length === 0) reasons.push("Sinyal awal dari pencarian keyword");
  if (risks.length === 0) risks.push("Validasi supplier sebelum stok besar");

  return {
    id: raw.product_id || `prod-${index}`,
    name: raw.title || raw.name || "Produk TikTok Shop",
    emoji: "📦",
    price: price,
    score: score > 100 ? 100 : score,
    confidence: score >= 75 ? "high" : score >= 60 ? "medium" : "low",
    reasons: reasons.slice(0, 3),
    risks: risks.slice(0, 2),
    margin: 25,
    sellers: 1,
    velocity: sold > 0 ? Math.min(3, sold / 1000) : 1,
    image: raw.image,
    seller: raw.seller_id ? `Seller ID: ${raw.seller_id}` : undefined,
    url: raw.product_id ? `https://shop.tiktok.com/view/product/${raw.product_id}` : undefined,
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

    let result: FunnelResult;
    const cached = await getCached(query, region);

    if (cached) {
      result = cached;
    } else {
      const raw = await fetchTikTokProducts(query, region, 100);
      const stage1 = raw.length;
      
      const filtered = raw.filter((p: any) => {
        const sold = toNumber(p.sold_count);
        const rating = p.rating || 0;
        return sold >= 10 && rating >= 4.0;
      });
      
      const stage2List = filtered.length >= 3 ? filtered : raw;
      const stage2 = stage2List.length;
      
      const scored = stage2List.map((p: any, i: number) => mapToProduct(p, i)).sort((a: any, b: any) => b.score - a.score);
      const top3 = scored.slice(0, 3);
      
      const insights = generateInsights(top3);
      result = { query, stage1, stage2, stage3: Math.min(10, scored.length), stage4: top3.length, products: top3, insights };
      
      await setCached(query, region, result);
    }

    // Simpan ke Supabase
    if (supabase) {
      const { data: searchData } = await supabase.from("searches").insert({ query, region }).select("id").single();
      if (searchData?.id) {
        const recs = result.products.map((p) => ({
          search_id: searchData.id,
          product_id: p.id,
          product_name: p.name,
          score: p.score,
        }));
        const { data: insertedRecs } = await supabase.from("recommendations").insert(recs).select("id, product_id");
        
        if (insertedRecs) {
          result.products = result.products.map((p) => {
            const rec = insertedRecs.find((r: any) => r.product_id === p.id);
            return { ...p, rec_id: rec?.id };
          });
        }
      }
    }

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Analyze error:", err);
    return NextResponse.json({ error: err?.message || "Gagal" }, { status: 500 });
  }
}