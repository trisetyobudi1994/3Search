import { NextResponse } from "next/server";
import { ApifyClient } from "apify-client";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET() {
  const token = process.env.APIFY_TOKEN;
  const actor = process.env.APIFY_ACTOR || "toolzerhub/tiktok-shop-scraper";

  if (!token) return NextResponse.json({ error: "no token" });

  try {
    const client = new ApifyClient({ token });

    // Coba dengan input paling minimal
    const run = await client.actor(actor).call({ keyword: "serum" }, { timeout: 50 });

    const { items } = await client.dataset(run.defaultDatasetId).listItems({ limit: 2 });

    return NextResponse.json({
      success: true,
      runId: run.id,
      status: run.status,
      itemCount: items.length,
      firstItem: items[0] || null,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message, stack: err?.stack?.split("\n").slice(0, 3) });
  }
}
