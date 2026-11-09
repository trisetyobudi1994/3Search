import { ApifyClient } from "apify-client";

const client = new ApifyClient({ token: process.env.APIFY_TOKEN });
const ACTOR_ID = process.env.APIFY_ACTOR || "abotapi/tiktok-shop-scraper";

export async function fetchTikTokProducts(
  keyword: string,
  region = "ID",
  maxItems = 100
): Promise<any[]> {
  if (!process.env.APIFY_TOKEN) throw new Error("APIFY_TOKEN belum diset.");

  // Schema khusus untuk actor abotapi/tiktok-shop-scraper
  const input = { 
    mode: "search",         // Mode pencarian
    queries: [keyword],     // Kata kunci dalam bentuk array
    maxItems: maxItems,
    proxy: {
      useApifyProxy: true,
      apifyProxyGroups: ["RESIDENTIAL"],
      apifyProxyCountry: region, // Paksa region ke ID (Indonesia)
    }
  };
  
  const run = await client.actor(ACTOR_ID).call(input, { timeout: 60 });
  
  if (run.status !== 'SUCCEEDED') {
    throw new Error(`Apify gagal dengan status: ${run.status}`);
  }

  const { items } = await client.dataset(run.defaultDatasetId).listItems({ limit: maxItems });
  
  if (items.length === 0) {
    throw new Error("TikTok Shop tidak mengembalikan produk untuk keyword ini. Coba keyword lain (misal: serum, dress, skincare).");
  }

  return items;
}