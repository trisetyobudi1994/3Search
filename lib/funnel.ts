import type { FunnelResult } from "./types";
import { PRODUCT_POOL } from "./mock-data";

export async function analyze(query: string): Promise<FunnelResult> {
  try {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, region: "ID" }),
    });

    if (!res.ok) throw new Error("API gagal");

    const data = (await res.json()) as FunnelResult;
    if (!data.products?.length) throw new Error("Data kosong");
    return data;
  } catch (err) {
    console.warn("Fallback ke mock:", err);

    const q = query.toLowerCase().trim();
    let products = PRODUCT_POOL.fallback;
    if (q.includes("skincare") || q.includes("kulit") || q.includes("serum"))
      products = PRODUCT_POOL.skincare;
    else if (q.includes("gadget") || q.includes("elektronik") || q.includes("tws"))
      products = PRODUCT_POOL.gadget;
    else if (q.includes("fashion") || q.includes("baju") || q.includes("pakaian"))
      products = PRODUCT_POOL.fashion;

    return { query, stage1: 100, stage2: 50, stage3: 10, stage4: 3, products };
  }
}