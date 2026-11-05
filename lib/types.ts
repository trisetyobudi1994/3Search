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
}

export interface FunnelResult {
  query: string;
  stage1: number;
  stage2: number;
  stage3: number;
  stage4: number;
  products: Product[];
}
