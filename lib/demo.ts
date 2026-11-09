import type { RegionCode } from "./types";
import { DEFAULT_IDR_RATES } from "./currency";

/**
 * Generator data demo deterministik. Dipakai hanya ketika APIFY_TOKEN belum
 * diset atau sumber live gagal, supaya alur produk tetap bisa dicoba.
 * Data ini SIMULASI — tidak boleh dipakai untuk keputusan bisnis.
 */

interface DemoCategory {
  key: string;
  match: string[];
  emoji: string;
  label: string;
  nouns: string[];
  brands: string[];
  priceBand: [number, number];
  adjectives: string[];
}

const CATEGORIES: DemoCategory[] = [
  {
    key: "skincare",
    match: ["serum", "skincare", "sunscreen", "toner", "moisturizer", "pelembab", "wajah", "acne", "jerawat", "niacinamide", "sunscreen", "spf"],
    emoji: "🧴",
    label: "Perawatan Kulit",
    nouns: ["Niacinamide 10%", "Hyaluronic Acid", "Centella Calming", "Glow Bright", "SPF 50 PA++++", "Retinol 0.5%", "Salicylic Acid 2%", "Vitamin C 15%"],
    brands: ["Glad2Glow", "Skintific", "Somethinc", "Azarine", "Avoskin", "Implora", "Wardah", "The Originote", "ElsheSkin", "Hanavie"],
    priceBand: [35_000, 210_000],
    adjectives: ["Viral", "BPOM", "Original", "Terlaris", "New", "Travel Size", "Best Seller"],
  },
  {
    key: "makeup",
    match: ["lip", "makeup", "bedak", "lipstik", "lipstick", "mascara", "cushion", "blush", "eyeliner", "foundation", "kosmetik"],
    emoji: "💄",
    label: "Makeup",
    nouns: ["Lip Tint Matte", "Cushion Glow", "Mascara Waterproof", "Blush Cream", "Lip Cream Velvet", "Eyeliner Presisi"],
    brands: ["Hanavie", "Implora", "Somethinc", "Dear Me Beauty", "Rollover Reaction", "ESQA", "Make Over"],
    priceBand: [29_000, 185_000],
    adjectives: ["Long Lasting", "Viral", "Transfer Proof", "Best Seller", "Shade Baru"],
  },
  {
    key: "fashion",
    match: ["fashion", "baju", "cardigan", "celana", "kemeja", "dress", "kaos", "outfit", "korean", "rajut", "cargo", "sandal", "sepatu", "tas", "hijab"],
    emoji: "🧥",
    label: "Fashion",
    nouns: ["Cardigan Oversize", "Celana Cargo Baggy", "Kemeja Linen", "Dress Midi", "Kaos Oversize", "Sandal Slides", "Tote Bag Kanvas", "Hijab Voal"],
    brands: ["Aruna", "Kanaya", "Mood Studio", "Rusty", "The Executive", "Cotton Ink", "Zahra Modest"],
    priceBand: [45_000, 320_000],
    adjectives: ["Korea Style", "Premium", "Unisex", "Best Seller", "New Arrival"],
  },
  {
    key: "gadget",
    match: ["gadget", "tws", "earphone", "headset", "powerbank", "smartwatch", "charger", "kabel", "kamera", "hp", "laptop", "mouse", "keyboard", "bluetooth", "speaker"],
    emoji: "🎧",
    label: "Elektronik",
    nouns: ["TWS Bluetooth 5.3", "Powerbank 10000mAh", "Smartwatch AMOLED", "Charger GaN 65W", "Speaker Mini", "Webcam 1080p", "Mouse Wireless"],
    brands: ["Soundcore", "Baseus", "Ugreen", "Anker", "Xiaomi", "Robot", "Vivan"],
    priceBand: [79_000, 650_000],
    adjectives: ["Low Latency", "Fast Charging", "Original", "Garansi Resmi", "Viral"],
  },
  {
    key: "home",
    match: ["home", "dapur", "rak", "organizer", "lampu", "kasur", "bantal", "vacuum", "air fryer", "tumbler", "peralatan", "rumah"],
    emoji: "🏠",
    label: "Rumah Tangga",
    nouns: ["Rak Serbaguna", "Organizer Dapur", "Lampu LED Sensor", "Tumbler 1L", "Vacuum Mini", "Bantal Memory Foam"],
    brands: ["Lion Star", "Maspion", "LocknLock", "Tupperware", "Nagata", "Kris"],
    priceBand: [39_000, 480_000],
    adjectives: ["Praktis", "Viral", "Hemat Tempat", "Best Seller", "Anti Bocor"],
  },
  {
    key: "food",
    match: ["makanan", "snack", "kopi", "minuman", "sambal", "keripik", "coklat", "food", "cemilan", "bumbu"],
    emoji: "🍫",
    label: "Makanan",
    nouns: ["Sambal Bawang", "Keripik Pisang", "Kopi Arabika 250g", "Cokelat Almond", "Bumbu Instan", "Snack Pedas"],
    brands: ["Sambal Nusantara", "Kopi Kita", "Coklat Kita", "Dapur Ibu", "Snack Hub"],
    priceBand: [18_000, 120_000],
    adjectives: ["Pedas", "Homemade", "Best Seller", "Viral", "Halal"],
  },
];

const SHOPS = [
  "Official Store",
  "Beauty Hub",
  "Prima Store",
  "Nusantara Mart",
  "Mega Shop",
  "Urban Store",
  "Star Commerce",
  "Glow Center",
];

const REGION_PRICE_MULTIPLIER: Record<RegionCode, number> = {
  ID: 1,
  US: 1 / DEFAULT_IDR_RATES.USD,
  MY: 1 / DEFAULT_IDR_RATES.MYR,
};

function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function titleCase(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function pickCategory(query: string, rand: () => number): DemoCategory {
  const lower = query.toLowerCase();
  const matched = CATEGORIES.filter((c) =>
    c.match.some((keyword) => lower.includes(keyword))
  );
  if (matched.length > 0) return matched[Math.floor(rand() * matched.length)];
  return CATEGORIES[Math.floor(rand() * CATEGORIES.length)];
}

function roundPrice(value: number, region: RegionCode): number {
  if (region === "ID") {
    const rounded = Math.round(value / 1_000) * 1_000;
    return Math.max(9_000, rounded - 1_000);
  }
  if (region === "US") {
    return Math.max(1.99, Math.round(value) - 0.01);
  }
  return Math.max(2.9, Math.round(value) - 0.1);
}

export interface DemoRawProduct {
  product_id: string;
  title: string;
  price: number;
  sold_count: number;
  rating: number;
  review_count: number;
  seller_name: string;
  category: string;
  product_url: string;
  stock: number;
  discount_percent: number;
  is_free_shipping: boolean;
}

export function buildDemoDataset(
  query: string,
  region: RegionCode
): DemoRawProduct[] {
  // Seed berubah setiap 6 jam mengikuti TTL cache, jadi terasa "segar"
  // tetapi tetap konsisten selama satu sesi.
  const window = Math.floor(Date.now() / (6 * 60 * 60 * 1000));
  const rand = mulberry32(hashString(`${query.toLowerCase()}|${region}|${window}`));
  const count = 84 + Math.floor(rand() * 28);
  const titleQuery = titleCase(query);
  const multiplier = REGION_PRICE_MULTIPLIER[region];

  const items: DemoRawProduct[] = [];

  for (let i = 0; i < count; i++) {
    const category = pickCategory(query, rand);
    const brand = category.brands[Math.floor(rand() * category.brands.length)];
    const noun = category.nouns[Math.floor(rand() * category.nouns.length)];
    const adjective = category.adjectives[Math.floor(rand() * category.adjectives.length)];

    const shop =
      rand() < 0.5
        ? `${brand} ${SHOPS[0]}`
        : `${SHOPS[1 + Math.floor(rand() * (SHOPS.length - 1))]}`;

    // Distribusi log-uniform: sebagian besar produk kecil, sedikit yang besar.
    const junk = rand() < 0.14;
    const sold = junk
      ? Math.floor(rand() * 9)
      : Math.floor(Math.exp(Math.log(20) + rand() * Math.log(45_000 / 20)));

    const ratingMissing = rand() < 0.05;
    const rating = ratingMissing
      ? 0
      : Math.round(Math.min(5, Math.max(3.4, 4.25 + (rand() - 0.4) * 1.05)) * 10) / 10;

    const reviewBase = rand();
    const reviews =
      sold < 10
        ? reviewBase < 0.6
          ? 0
          : Math.floor(rand() * 5)
        : reviewBase < 0.08
        ? 0
        : Math.round(sold * (0.01 + rand() * 0.11));

    const band = category.priceBand;
    const rawPrice = band[0] + (band[1] - band[0]) * Math.pow(rand(), 1.6);
    const price = roundPrice(rawPrice * multiplier, region);

    const stock = rand() < 0.04 ? 0 : 5 + Math.floor(rand() * 4_000);
    const discountPercent = rand() < 0.5 ? 0 : 5 + Math.floor(rand() * 50);

    const suffix = [noun, adjective].filter(Boolean).join(" ");
    const name = `${brand} ${titleQuery} ${suffix}`.replace(/\s+/g, " ").trim().slice(0, 120);

    items.push({
      product_id: `demo-${hashString(query)}-${i}`,
      title: name,
      price,
      sold_count: sold,
      rating,
      review_count: reviews,
      seller_name: shop,
      category: category.label,
      product_url: `https://www.tiktok.com/search?q=${encodeURIComponent(query)}`,
      stock,
      discount_percent: discountPercent,
      is_free_shipping: rand() < 0.62,
    });
  }

  return items;
}
