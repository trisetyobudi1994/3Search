import { ApifyClient } from "apify-client";

const client = new ApifyClient({ token: process.env.APIFY_TOKEN });
const ACTOR_ID = process.env.APIFY_ACTOR || "toolzerhub/tiktok-shop-scraper";

export async function fetchTikTokProducts(
  keyword: string,
  region = "ID",
  maxItems = 100
): Promise<any[]> {
  if (!process.env.APIFY_TOKEN) {
    throw new Error("APIFY_TOKEN belum diset di .env.local");
  }
  
  const input = { 
    keyword, 
    country: region, // Gunakan country, bukan region, untuk actor ini
    maxItems 
  };
  
  const run = await client.actor(ACTOR_ID).call(input);
  const { items } = await client
    .dataset(run.defaultDatasetId)
    .listItems({ limit: maxItems });
    
  return items;
}