import { ApifyClient } from "apify-client";

const client = new ApifyClient({ token: process.env.APIFY_TOKEN });
const ACTOR_ID = process.env.APIFY_ACTOR || "toolzerhub/tiktok-shop-search-scraper";

export async function fetchTikTokProducts(
  keyword: string,
  region = "ID",
  maxItems = 100
): Promise<any[]> {
  if (!process.env.APIFY_TOKEN) {
    throw new Error("APIFY_TOKEN belum diset");
  }
  
  // Actor ini menerima keyword dan region (ID, US, dll)
  const input = { 
    keyword: keyword, 
    region: region, 
    maxItems: maxItems 
  };
  
  const run = await client.actor(ACTOR_ID).call(input, { timeout: 50 });
  
  if (run.status !== 'SUCCEEDED') {
    throw new Error(`Apify gagal: ${run.status}`);
  }

  const { items } = await client
    .dataset(run.defaultDatasetId)
    .listItems({ limit: maxItems });
    
  return items;
}