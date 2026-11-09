import { NextResponse } from "next/server";
import { ApifyClient } from "apify-client";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET() {
  const token = process.env.APIFY_TOKEN;
  const actor = "rexreus/tiktok-shop-scraper";

  if (!token) return NextResponse.json({ error: "Token tidak ditemukan" });

  try {
    const client = new ApifyClient({ token });

    // Schema yang benar untuk rexreus: queries (array) & region (string)
    const input = {
      queries: ["serum"],
      region: "ID",
      maxItems: 5,
    };

    const run = await client.actor(actor).call(input, { timeout: 50 });
    const { items } = await client.dataset(run.defaultDatasetId).listItems({ limit: 5 });

    return NextResponse.json({
      success: true,
      actorUsed: actor,
      runStatus: run.status,
      itemCount: items.length,
      firstItem: items[0] || null,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message });
  }
}