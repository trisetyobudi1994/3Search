import { NextResponse } from "next/server";
import { ApifyClient } from "apify-client";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET() {
  const token = process.env.APIFY_TOKEN;
  const actor = "herus13/tiktok-shop-scraper"; // Paksa pakai herus13

  if (!token) return NextResponse.json({ error: "Token tidak ditemukan" });

  try {
    const client = new ApifyClient({ token });
    
    // Schema yang benar untuk herus13: search_terms & region
    const input = { 
      search_terms: ["serum"], 
      region: "ID",
      max_results: 5
    };

    const run = await client.actor(actor).call(input, { timeout: 50 });
    const { items } = await client.dataset(run.defaultDatasetId).listItems({ limit: 5 });

    return NextResponse.json({
      success: true,
      runId: run.id,
      status: run.status,
      itemCount: items.length,
      firstItem: items[0] || null, // Kita intip struktur datanya
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message });
  }
}