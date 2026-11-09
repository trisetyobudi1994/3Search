import { ApifyClient } from "apify-client";

// Actor yang field output-nya cocok dengan mapToProduct() di app/api/analyze/route.ts
export const ACTOR_ID = process.env.APIFY_ACTOR || "herus13/tiktok-shop-scraper";

export async function fetchTikTokProducts(
  keyword: string,
  region = "ID",
  maxItems = 100
): Promise<any[]> {
  const token = process.env.APIFY_TOKEN;
  if (!token) throw new Error("APIFY_TOKEN belum diset di environment variables");

  const client = new ApifyClient({ token });
  const input = { keyword, region, maxItems };

  // waitSecs: berapa lama kita menunggu (harus < maxDuration route = 60s)
  // timeout : batas waktu run actor di sisi Apify (detik)
  const run = await client.actor(ACTOR_ID).call(input, { waitSecs: 50, timeout: 55 });

  if (run.status !== "SUCCEEDED") {
    throw new Error(
      `Apify belum selesai/gagal (status: ${run.status}). Coba lagi dalam beberapa detik.`
    );
  }

  const { items } = await client.dataset(run.defaultDatasetId).listItems({ limit: maxItems });
  return items;
}
