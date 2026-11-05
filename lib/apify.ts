import { ApifyClient } from "apify-client";

const client = new ApifyClient({ token: process.env.APIFY_TOKEN });
const ACTOR_ID = process.env.APIFY_ACTOR || "toolzerhub/tiktok-shop-scraper";

export interface ApifyTikTokProduct {
  productId?: string;
  title?: string;
  price?: number | string;
  rating?: number;
  soldCount?: number | string;
  reviewCount?: number;
  [key: string]: any;
}

export async function fetchTikTokProducts(
  keyword: string,
  region = "ID",
  maxItems = 100
): Promise<ApifyTikTokProduct[]> {
  if (!process.env.APIFY_TOKEN) {
    throw new Error("APIFY_TOKEN belum diset di .env.local");
  }
  const input = { scraperType: "searchProducts", keyword, region, maxItems };
  const run = await client.actor(ACTOR_ID).call(input);
  const { items } = await client
    .dataset(run.defaultDatasetId)
    .listItems({ limit: maxItems });
  return items as ApifyTikTokProduct[];
}