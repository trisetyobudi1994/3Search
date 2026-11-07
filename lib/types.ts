export type Confidence = "high" | "medium" | "low";

export interface Product {
  id: string;
  name: string;
  emoji: string;
  price: number;
  score: number;
  confidence: Confidence;
  reasons: string[];
  risks: string[];
  margin: number;
  sellers: number;
  velocity: number;
  image?: string;
  seller?: string;
  url?: string;
  rec_id?: string; // <-- Tambahan untuk learning loop
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
  saturationLevel: number;
  saturationLabel: string;
  brands: BrandShare[];
  playbook: { title: string; detail: string; type: "do" | "dont" | "info" }[];
}

export interface FunnelResult {
  query: string;
  stage1: number;
  stage2: number;
  stage3: number;
  stage4: number;
  products: Product[];
  insights?: Insights;
}