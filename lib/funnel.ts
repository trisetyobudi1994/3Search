import type { FunnelResult } from "./types";
import { PRODUCT_POOL } from "./mock-data";

export function analyze(query: string): FunnelResult {
  const q = query.toLowerCase().trim();
  let products = PRODUCT_POOL.fallback;
  if (q.includes("skincare") || q.includes("kulit") || q.includes("serum")) products = PRODUCT_POOL.skincare;
  else if (q.includes("gadget") || q.includes("elektronik") || q.includes("tws")) products = PRODUCT_POOL.gadget;
  else if (q.includes("fashion") || q.includes("baju") || q.includes("pakaian")) products = PRODUCT_POOL.fashion;

  return { query, stage1: 100, stage2: 50, stage3: 10, stage4: 3, products };
}
