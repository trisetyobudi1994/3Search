export type Confidence = "high" | "medium" | "low";
export type RegionCode = "ID" | "US" | "MY";
export type DataMode = "live" | "demo";

export interface ScorePart {
  label: string;
  points: number;
  max: number;
}

export interface Product {
  id: string;
  name: string;
  emoji?: string;
  price: number;
  currency: string;
  /** Harga setara Rupiah untuk tampilan dan simulasi profit. */
  priceIDR?: number;
  score: number;
  confidence: Confidence;
  reasons: string[];
  risks: string[];
  /** Unit terjual (historis) menurut sumber data. */
  sold: number;
  /** Rating rata-rata 0–5. 0 berarti tidak tersedia. */
  rating: number;
  reviews: number;
  stock?: number;
  discountPercent?: number;
  freeShipping?: boolean;
  category?: string;
  shop?: string;
  image?: string;
  url?: string;
  /** ID baris rekomendasi di database, dipakai untuk feedback. */
  rec_id?: string;
  breakdown?: ScorePart[];
}

export interface BrandShare {
  brand: string;
  count: number;
  percent: number;
  avgRating: number;
}

export interface Insights {
  opportunityScore: number;
  opportunityLabel: "PELUANG BAGUS" | "NETRAL" | "HATI-HATI";
  opportunityColor: "green" | "amber" | "red";
  opportunityReason: string;
  totalProducts: number;
  totalSellers: number;
  avgPrice: number;
  priceRange: { min: number; max: number };
  /** Rata-rata dan rentang harga dalam Rupiah. */
  avgPriceIDR: number;
  priceRangeIDR: { min: number; max: number };
  saturationLevel: number;
  saturationLabel: string;
  brands: BrandShare[];
  playbook: { title: string; detail: string; type: "do" | "dont" | "info" }[];
}

export interface FunnelResult {
  query: string;
  region: RegionCode;
  currency: string;
  mode: DataMode;
  stage1: number;
  stage2: number;
  stage3: number;
  stage4: number;
  products: Product[];
  insights?: Insights;
  generatedAt: string;
  durationMs: number;
  cached: boolean;
  totalAnalyzed: number;
  warnings: string[];
  /** Kurs IDR yang dipakai server saat analisis ini dibuat. */
  idrRates?: Record<string, number>;
}

export interface TrendPoint {
  date: string;
  success: number;
  failed: number;
  total: number;
  rate: number | null;
}

export interface StatsResponse {
  database: boolean;
  totalSearches: number;
  totalRecommendations: number;
  totalFeedback: number;
  success: number;
  failed: number;
  hitRate: number;
  trend: TrendPoint[];
  topQueries: { query: string; count: number }[];
  updatedAt: string;
}

export interface RecentSearch {
  query: string;
  region: RegionCode;
  at: number;
}

export interface LocalStats {
  analyses: number;
  feedback: number;
  success: number;
  failed: number;
  hitRate: number;
}

export interface HealthResponse {
  ok: boolean;
  dataSource: DataMode;
  database: boolean;
  cache: "redis" | "memory";
  version: string;
  scraper: { configured: boolean; actor: string };
  idrRates: Record<string, number>;
}
