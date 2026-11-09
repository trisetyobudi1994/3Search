import { normalizeProduct } from "./normalize";
import { scoreProduct, SCORE_THRESHOLD } from "./scoring";
import { generateInsights } from "./insights";
import { currencyForRegion } from "./regions";
import { getIdrRates, toIDR } from "./currency";
import type { DataMode, FunnelResult, Product, RegionCode } from "./types";

export interface BuildFunnelOptions {
  query: string;
  region: RegionCode;
  mode: DataMode;
  startedAt: number;
  extraWarnings?: string[];
}

function passesQuality(product: Product): boolean {
  const stockOk = product.stock === undefined || product.stock > 0;
  const demandOk = product.sold >= 10 || product.reviews >= 5;
  const ratingOk = product.rating === 0 || product.rating >= 4;
  return stockOk && demandOk && ratingOk;
}

/**
 * Pipeline inti: normalisasi → dedupe → filter kualitas → skor sinyal → top 3.
 * Semua tahap dihitung dan dilaporkan apa adanya lewat angka funnel.
 */
export function buildFunnel(
  rawItems: unknown[],
  options: BuildFunnelOptions
): FunnelResult {
  const { query, region, mode, startedAt } = options;
  const warnings = [...(options.extraWarnings ?? [])];

  if (mode === "demo") {
    warnings.push(
      "Mode demo: angka berasal dari dataset simulasi, bukan data TikTok Shop asli."
    );
  }

  const idrRates = getIdrRates();
  const normalized: Product[] = [];
  let dropped = 0;
  rawItems.forEach((item, index) => {
    const product = normalizeProduct(item, index, region);
    if (product) {
      normalized.push({
        ...product,
        priceIDR: toIDR(product.price, product.currency, idrRates),
      });
    } else {
      dropped += 1;
    }
  });

  if (dropped > 0) {
    warnings.push(`${dropped} item dilewati karena judul atau harga tidak terbaca.`);
  }

  const byKey = new Map<string, Product>();
  for (const product of normalized) {
    const key = (product.id || product.name).toLowerCase().trim();
    const existing = byKey.get(key);
    if (!existing || product.sold + product.reviews > existing.sold + existing.reviews) {
      byKey.set(key, product);
    }
  }
  const unique = Array.from(byKey.values());
  if (unique.length !== normalized.length) {
    warnings.push(`${normalized.length - unique.length} duplikat produk digabung.`);
  }

  const stage1 = rawItems.length;
  let filtered = unique.filter(passesQuality);

  if (filtered.length < 3 && unique.length >= 3) {
    filtered = unique;
    warnings.push(
      "Filter kualitas terlalu ketat untuk kategori ini — seluruh kandidat ditampilkan."
    );
  }

  const scored = filtered
    .map((product) => scoreProduct(product, region))
    .sort((a, b) => b.score - a.score || b.sold - a.sold);

  const top = scored.slice(0, 3);
  const strong = scored.filter((p) => p.score >= SCORE_THRESHOLD).length;
  const stage3 = Math.max(strong, top.length);

  if (stage1 === 0) {
    warnings.push("Sumber data tidak mengembalikan produk untuk kata kunci ini.");
  } else if (top.length === 0) {
    warnings.push("Tidak ada produk yang lolos normalisasi. Coba kata kunci lain.");
  }

  const uniqueWarnings = Array.from(new Set(warnings));

  return {
    query,
    region,
    currency: currencyForRegion(region),
    mode,
    stage1,
    stage2: filtered.length,
    stage3,
    stage4: top.length,
    products: top,
    insights: generateInsights(scored.slice(0, 20), region),
    generatedAt: new Date().toISOString(),
    durationMs: Math.max(0, Date.now() - startedAt),
    cached: false,
    totalAnalyzed: unique.length,
    warnings: uniqueWarnings,
    idrRates,
  };
}
