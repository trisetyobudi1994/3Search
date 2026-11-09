import { NextRequest, NextResponse } from "next/server";
import { fetchTikTokProducts } from "@/lib/apify";
import { generateInsights } from "@/lib/insights";
import { getCached, setCached } from "@/lib/cache";
import { supabase } from "@/lib/supabase";
import type { Product, FunnelResult } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

// Parser angka toleran: 1234, "1.234", "Rp 89.000", "1,2rb", "3.5K", "2jt"
function toNumber(v: any): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v !== "string") return 0;
  let s = v.toLowerCase().replace(/rp|\s/g, "");
  let mult = 1;
  if (/(jt|m)$/.test(s)) { mult = 1_000_000; s = s.replace(/(jt|m)$/, ""); }
  else if (/(rb|k)$/.test(s)) { mult = 1_000; s = s.replace(/(rb|k)$/, ""); }
  // "89.000" / "1.234.567" = pemisah ribuan; "1,5" = desimal
  if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
  s = s.replace(",", ".").replace(/[^\d.]/g, "");
  return (parseFloat(s) || 0) * mult;
}

function mapToProduct(raw: any, index: number): Product {
  const price = toNumber(raw.price);
  const rating = toNumber(raw.rating);
  const review = toNumber(raw.review_count);
  const sold = toNumber(raw.sold_count);

  const soldScore = Math.min(40, Math.log10(sold + 1) * 10);
  const ratingScore = Math.min(30, (rating / 5) * 30);
  const reviewScore = Math.min(20, Math.log10(review + 1) * 5);
  const priceScore = price > 0 ? 10 : 5;
  const score = Math.min(100, Math.round(soldScore + ratingScore + reviewScore + priceScore));

  const reasons: string[] = [];
  const risks: string[] = [];

  if (sold > 0) reasons.push(`Terjual ${sold.toLocaleString("id-ID")}+ unit`);
  if (rating >= 4.5) reasons.push(`Rating tinggi ${rating.toFixed(1)}/5`);
  if (review > 0) reasons.push(`${review.toLocaleString("id-ID")} ulasan`);
  if (price > 0 && price < 150000) reasons.push("Harga impulse buy");

  if (sold < 50) risks.push("Volume penjualan masih rendah");
  if (review < 20) risks.push("Ulasan sedikit — validasi pasar belum kuat");
  if (rating > 0 && rating < 4.2) risks.push("Rating di bawah rata-rata");
  if (price >= 500000) risks.push("Harga tinggi — konversi bisa lebih lambat");

  if (reasons.length === 0) reasons.push("Sinyal awal dari pencarian keyword");
  if (risks.length === 0) risks.push("Validasi supplier sebelum stok besar");

  const imageUrl = raw.main_image || raw.image_urls?.[0] || raw.image || undefined;

  return {
    id: String(raw.product_id || raw.id || `prod-${index}`),
    name: raw.title || raw.name || "Produk TikTok Shop",
    emoji: "📦",
    price,
    score,
    confidence: score >= 75 ? "high" : score >= 60 ? "medium" : "low",
    reasons: reasons.slice(0, 3),
    risks: risks.slice(0, 2),
    margin: 25,
    sellers: 1,
    velocity: sold > 0 ? Math.max(0.1, Math.min(3, sold / 1000)) : 1,
    image: imageUrl,
    seller: raw.seller_name || raw.shop_name || undefined,
    url: raw.product_url || raw.url || undefined,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const query: string = (body.query || "").toString().trim().slice(0, 100);
    const region: string = (body.region || "ID").toString().toUpperCase().slice(0, 2);

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
      if (stage1 === 0) {
        return NextResponse.json(
          { error: "Tidak ada produk ditemukan. Coba keyword lain." },
          { status: 404 }
        );
      }

      const filtered = raw.filter((p: any) => toNumber(p.sold_count) >= 10 && toNumber(p.rating) >= 4.0);
      const stage2List = filtered.length >= 3 ? filtered : raw;

      const scored = stage2List
        .map((p: any, i: number) => mapToProduct(p, i))
        .sort((a, b) => b.score - a.score);
      const top3 = scored.slice(0, 3);

      // Insight dihitung dari SEMUA produk yang lolos filter (bukan hanya top-3)
      const insights = generateInsights(scored);

      result = {
        query,
        stage1,
        stage2: stage2List.length,
        stage3: Math.min(10, scored.length),
        stage4: top3.length,
        products: top3,
        insights,
      };

      await setCached(query, region, result);
    }

    // Simpan ke Supabase — kegagalan DB tidak boleh menggagalkan hasil analisis
    if (supabase) {
      try {
        const { data: searchData, error: sErr } = await supabase
          .from("searches")
          .insert({ query, region })
          .select("id")
          .single();
        if (sErr) throw sErr;

        if (searchData?.id) {
          const recs = result.products.map((p) => ({
            search_id: searchData.id,
            product_id: p.id,
            product_name: p.name,
            score: p.score,
          }));
          const { data: insertedRecs, error: rErr } = await supabase
            .from("recommendations")
            .insert(recs)
            .select("id, product_id");
          if (rErr) throw rErr;

          if (insertedRecs) {
            result = {
              ...result,
              products: result.products.map((p) => ({
                ...p,
                rec_id: insertedRecs.find((r: any) => r.product_id === p.id)?.id,
              })),
            };
          }
        }
      } catch (dbErr) {
        console.warn("Supabase error (diabaikan):", dbErr);
      }
    }

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Analyze error:", err);
    return NextResponse.json({ error: err?.message || "Gagal menganalisis" }, { status: 500 });
  }
}
