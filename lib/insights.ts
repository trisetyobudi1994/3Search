import type { Product, Insights, BrandShare } from "./types";

function extractBrand(name: string): string {
  const clean = name.replace(/[^\w\s]/g, "").trim();
  const words = clean.split(/\s+/);
  if (words.length === 0) return "Unknown";
  if (words[0].length >= 4) return words[0];
  return words.slice(0, 2).join(" ");
}

export function generateInsights(products: Product[]): Insights {
  if (!products.length) {
    return { opportunityScore: 0, opportunityLabel: "NETRAL", opportunityColor: "amber", opportunityReason: "Data tidak cukup", totalProducts: 0, totalSellers: 0, avgPrice: 0, priceRange: { min: 0, max: 0 }, saturationLevel: 50, saturationLabel: "Tidak diketahui", brands: [], playbook: [] };
  }
  const totalProducts = products.length;
  const prices = products.map((p) => p.price).filter((p) => p > 0);
  const avgPrice = prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;
  const priceRange = { min: prices.length ? Math.min(...prices) : 0, max: prices.length ? Math.max(...prices) : 0 };
  const brandMap = new Map<string, { count: number; ratings: number[] }>();
  products.forEach((p) => {
    const brand = extractBrand(p.name);
    const entry = brandMap.get(brand) || { count: 0, ratings: [] };
    entry.count += 1;
    entry.ratings.push(p.score / 20);
    brandMap.set(brand, entry);
  });
  const brands: BrandShare[] = Array.from(brandMap.entries()).map(([brand, data]) => ({ brand, count: data.count, percent: Math.round((data.count / totalProducts) * 100), avgRating: data.ratings.length ? Math.round((data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length) * 10) / 10 : 0 })).sort((a, b) => b.count - a.count).slice(0, 5);
  const totalSellers = products.reduce((a, p) => a + (p.sellers || 1), 0);
  const uniqueBrands = brandMap.size;
  const saturationLevel = Math.min(100, Math.round((Math.min(totalSellers, 100) / 100) * 50 + (uniqueBrands > 10 ? 30 : uniqueBrands * 3)));
  let saturationLabel = "Seimbang";
  if (saturationLevel < 35) saturationLabel = "Masih Lengang";
  else if (saturationLevel < 65) saturationLabel = "Seimbang";
  else saturationLabel = "Sudah Ramai";
  const avgScore = products.reduce((a, p) => a + p.score, 0) / Math.max(products.length, 1);
  const scoreComponent = (avgScore / 100) * 40;
  const saturationComponent = ((100 - saturationLevel) / 100) * 40;
  const brandComponent = uniqueBrands >= 3 ? 20 : uniqueBrands * 6.6;
  const opportunityScore = Math.round(scoreComponent + saturationComponent + brandComponent);
  let opportunityLabel: Insights["opportunityLabel"] = "NETRAL";
  let opportunityColor: Insights["opportunityColor"] = "amber";
  let opportunityReason = "";
  if (opportunityScore >= 70) { opportunityLabel = "PELUANG BAGUS"; opportunityColor = "green"; opportunityReason = `Skor produk tinggi (${Math.round(avgScore)}/100) & saturasi masih wajar (${saturationLevel}/100). Waktu yang tepat untuk masuk.`; }
  else if (opportunityScore >= 45) { opportunityLabel = "NETRAL"; opportunityColor = "amber"; opportunityReason = `Pasar sudah cukup ramai (saturasi ${saturationLevel}/100). Bisa masuk dengan diferensiasi jelas.`; }
  else { opportunityLabel = "HATI-HATI"; opportunityColor = "red"; opportunityReason = `Saturasi tinggi (${saturationLevel}/100). Butuh strategi berbeda.`; }
  const playbook: Insights["playbook"] = [];
  const dominantBrand = brands[0];
  if (dominantBrand && dominantBrand.percent >= 40) { playbook.push({ type: "info", title: `${dominantBrand.brand} dominan (${dominantBrand.percent}%)`, detail: `Merek ini kuasai kategori. Jangan bertarung head-on.` }); }
  else if (brands.length >= 3) { playbook.push({ type: "do", title: "Pasar terfragmentasi", detail: `${brands.length} merek berbagi pasar. Peluang merek baru masuk.` }); }
  if (avgPrice < 100000) { playbook.push({ type: "do", title: `Sweet spot Rp ${Math.round(avgPrice / 1000)}rb`, detail: `Harga rata-rata < Rp 100rb = zona impulse buy.` }); }
  else if (avgPrice > 200000) { playbook.push({ type: "info", title: "Segmen premium", detail: `Harga rata-rata Rp ${Math.round(avgPrice / 1000)}rb. Butuh branding lebih kuat.` }); }
  if (saturationLevel > 65) { playbook.push({ type: "dont", title: "Hindari harga rata-rata", detail: `Saturasi tinggi. Coba harga 20% lebih murah atau 30% lebih mahal.` }); }
  else if (saturationLevel < 35) { playbook.push({ type: "do", title: "First mover advantage", detail: `Kategori lengang. Yang masuk pertama sering dapat momentum FYP.` }); }
  return { opportunityScore, opportunityLabel, opportunityColor, opportunityReason, totalProducts, totalSellers, avgPrice, priceRange, saturationLevel, saturationLabel, brands, playbook: playbook.slice(0, 3) };
}
