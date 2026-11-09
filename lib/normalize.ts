import type { Product, RegionCode } from "./types";
import { currencyForRegion } from "./regions";

const TITLE_KEYS = [
  "title",
  "product_name",
  "productName",
  "name",
  "product_title",
  "item_name",
];
const ID_KEYS = ["product_id", "productId", "id", "item_id", "itemId", "sku_id"];
const PRICE_KEYS = [
  "price",
  "sale_price",
  "salePrice",
  "discounted_price",
  "current_price",
  "min_price",
  "price_value",
];
const ORIGINAL_PRICE_KEYS = [
  "original_price",
  "originalPrice",
  "price_before",
  "list_price",
  "max_price",
];
const SOLD_KEYS = [
  "sold_count",
  "soldCount",
  "sold",
  "sales",
  "total_sold",
  "historical_sold",
  "sold_quantity",
  "units_sold",
];
const REVIEW_KEYS = [
  "review_count",
  "reviewCount",
  "reviews",
  "rating_count",
  "comment_count",
  "comments",
  "total_review",
];
const RATING_KEYS = ["rating", "rating_star", "ratingStar", "star", "avg_rating"];
const SHOP_KEYS = [
  "seller_name",
  "sellerName",
  "shop_name",
  "shopName",
  "seller",
  "shop",
  "store_name",
  "author_name",
];
const IMAGE_KEYS = [
  "main_image",
  "mainImage",
  "image_url",
  "imageUrl",
  "cover",
  "cover_url",
  "thumbnail",
  "product_image",
  "image",
];
const URL_KEYS = [
  "product_url",
  "productUrl",
  "url",
  "product_link",
  "productLink",
  "link",
];
const STOCK_KEYS = [
  "stock",
  "quantity",
  "available_quantity",
  "inventory",
  "stock_count",
  "stock_total",
];
const CATEGORY_KEYS = ["category", "category_name", "categoryName", "cate_name", "industry"];
const DISCOUNT_KEYS = ["discount", "discount_percent", "discountPercent", "discount_rate"];
const FREE_SHIPPING_KEYS = ["is_free_shipping", "free_shipping", "freeShipping"];

type Raw = Record<string, unknown>;

function asObject(value: unknown): Raw {
  return value && typeof value === "object" ? (value as Raw) : {};
}

function pick(raw: Raw, keys: string[]): unknown {
  for (const key of keys) {
    const value = raw[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
}

function pickString(raw: Raw, keys: string[]): string | undefined {
  const value = pick(raw, keys);
  if (typeof value === "string") {
    const clean = value.trim();
    return clean || undefined;
  }
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return undefined;
}

function parseCount(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) && value > 0 ? value : 0;
  if (typeof value === "string") {
    const normalized = value.toLowerCase().replace(/,/g, "");
    const match = normalized.match(/([\d.]+)\s*(k|rb|ribu|jt|juta|m)?/);
    if (!match) return 0;
    const base = parseFloat(match[1]);
    if (!Number.isFinite(base)) return 0;
    const unit = match[2];
    if (unit === "k" || unit === "rb" || unit === "ribu") return Math.round(base * 1_000);
    if (unit === "jt" || unit === "juta") return Math.round(base * 1_000_000);
    if (unit === "m") return Math.round(base * 1_000_000);
    return Math.round(base);
  }
  return 0;
}

export function parseMoney(value: unknown): number {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? value : 0;
  }
  if (typeof value !== "string") return 0;

  let s = value.replace(/[^\d.,]/g, "").trim();
  if (!s) return 0;

  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");

  if (lastComma > -1 && lastDot > -1) {
    // Format Indonesia: 1.234,56 — format Inggris: 1,234.56
    s = lastComma > lastDot
      ? s.replace(/\./g, "").replace(",", ".")
      : s.replace(/,/g, "");
  } else if (lastComma > -1) {
    const decimals = s.length - lastComma - 1;
    s = decimals === 3 ? s.replace(/,/g, "") : s.replace(",", ".");
  } else if (lastDot > -1) {
    const parts = s.split(".");
    if (parts.length > 2) s = s.replace(/\./g, "");
    else if (parts[1]?.length === 3) s = s.replace(".", "");
  }

  const parsed = parseFloat(s);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function parseRating(value: unknown): number {
  const numeric =
    typeof value === "number" ? value : typeof value === "string" ? parseFloat(value.replace(",", ".")) : 0;
  if (!Number.isFinite(numeric) || numeric <= 0) return 0;
  // Sebagian aktor memberi rating 0–10 atau persentase.
  if (numeric > 5 && numeric <= 10) return Math.min(5, numeric / 2);
  if (numeric > 10) return 0;
  return Math.min(5, Math.max(0, numeric));
}

function absoluteUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value, "https://www.tiktok.com");
    if (url.protocol !== "http:" && url.protocol !== "https:") return undefined;
    return url.toString();
  } catch {
    return undefined;
  }
}

function categoryName(raw: Raw): string | undefined {
  const direct = pickString(raw, CATEGORY_KEYS);
  if (direct) return direct;

  // Actor default mengirim category_path: [{ id, name }, ...] root → leaf.
  const path = raw.category_path;
  if (Array.isArray(path) && path.length > 0) {
    const names = path
      .map((entry) =>
        typeof entry === "string" ? entry : pickString(asObject(entry), ["name", "title"])
      )
      .filter((name): name is string => Boolean(name));
    if (names.length > 0) return names[names.length - 1].slice(0, 80);
  }
  return undefined;
}

function firstImage(raw: Raw): string | undefined {
  const direct = pickString(raw, IMAGE_KEYS);
  if (direct) return absoluteUrl(direct);

  for (const key of ["image_urls", "images", "image_list", "cover_list"]) {
    const value = raw[key];
    if (Array.isArray(value) && value.length > 0) {
      const first = value[0];
      if (typeof first === "string") return absoluteUrl(first);
      if (first && typeof first === "object") {
        const nested = pickString(asObject(first), ["url", "image_url", "src"]);
        if (nested) return absoluteUrl(nested);
      }
    }
  }
  return undefined;
}

function cleanTitle(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 140);
}

function pickDiscount(raw: Raw, price: number): number | undefined {
  const direct = parseCount(pick(raw, DISCOUNT_KEYS));
  if (direct > 0 && direct <= 100) return Math.round(direct);

  const original = parseMoney(pick(raw, ORIGINAL_PRICE_KEYS));
  if (original > price && price > 0) {
    const percent = Math.round(((original - price) / original) * 100);
    if (percent > 0 && percent <= 95) return percent;
  }
  return undefined;
}

function pickBoolean(raw: Raw, keys: string[]): boolean | undefined {
  const value = pick(raw, keys);
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 0 ? true : value === 1 ? true : undefined;
  if (typeof value === "string") {
    const lowered = value.toLowerCase();
    if (["true", "yes", "1", "free", "gratis"].includes(lowered)) return true;
    if (["false", "no", "0", "paid"].includes(lowered)) return false;
  }
  const shipping = parseMoney(raw.shipping_fee);
  if (shipping === 0 && raw.shipping_fee !== undefined) return true;
  return undefined;
}

/**
 * Mengubah satu item mentah dari actor Apify menjadi Product ternormalisasi.
 * Mengembalikan null jika item tidak punya judul maupun harga.
 */
export function normalizeProduct(
  input: unknown,
  index: number,
  region: RegionCode
): Product | null {
  if (!input || typeof input !== "object") return null;
  const raw = asObject(input);

  const title = pickString(raw, TITLE_KEYS);
  const price = parseMoney(pick(raw, PRICE_KEYS));
  if (!title || price <= 0) return null;

  const id =
    pickString(raw, ID_KEYS) ?? `item-${index}-${title.toLowerCase().slice(0, 24).replace(/\W+/g, "-")}`;

  return {
    id,
    name: cleanTitle(title),
    price,
    currency: currencyForRegion(region),
    score: 0,
    confidence: "low",
    reasons: [],
    risks: [],
    sold: Math.round(parseCount(pick(raw, SOLD_KEYS))),
    rating: parseRating(pick(raw, RATING_KEYS)),
    reviews: Math.round(parseCount(pick(raw, REVIEW_KEYS))),
    stock: pick(raw, STOCK_KEYS) !== undefined ? Math.round(parseCount(pick(raw, STOCK_KEYS))) : undefined,
    discountPercent: pickDiscount(raw, price),
    freeShipping: pickBoolean(raw, FREE_SHIPPING_KEYS),
    category: categoryName(raw),
    shop: pickString(raw, SHOP_KEYS),
    image: firstImage(raw),
    url: absoluteUrl(pickString(raw, URL_KEYS)),
  };
}
