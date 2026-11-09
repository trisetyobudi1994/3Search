import type { Product, RegionCode, ScorePart } from "./types";
import { formatCompact, formatNumber, getRegion } from "./regions";
import { formatIDR, toIDR } from "./currency";

export const SCORE_THRESHOLD = 55;

const clamp = (value: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));

function priceFit(price: number, region: RegionCode): number {
  const { sweetSpot } = getRegion(region);
  if (price <= 0) return 0;
  if (price >= sweetSpot.min && price <= sweetSpot.max) return 1;
  if (price < sweetSpot.min) {
    // Terlalu murah: margin tipis, tapi masih menarik untuk impulse buy.
    return clamp(price / sweetSpot.min) * 0.75;
  }
  // Di atas zona impulse: makin mahal makin butuh justifikasi.
  return clamp(1 - (price - sweetSpot.max) / (sweetSpot.max * 2)) * 0.8;
}

function confidenceFor(p: Product): Product["confidence"] {
  if (p.stock === 0) return "low";
  if (p.reviews >= 120 && p.rating >= 4.5 && p.sold >= 250) return "high";
  if (p.reviews >= 25 && p.rating >= 4.1 && p.sold >= 40) return "medium";
  return "low";
}

export function scoreProduct(product: Product, region: RegionCode): Product {
  const { sweetSpot } = getRegion(region);
  const sold = Math.max(0, product.sold);
  const reviews = Math.max(0, product.reviews);
  const rating = clamp(product.rating, 0, 5);
  const priceIDR = product.priceIDR ?? toIDR(product.price, product.currency);
  const money = (value: number) => formatIDR(value, { compact: true });
  const locale =
    product.currency === "USD" ? "en-US" : product.currency === "MYR" ? "ms-MY" : "id-ID";
  const count = (value: number) => formatCompact(value, locale);

  const salesRatio = clamp(Math.log10(sold + 1) / Math.log10(25_000));
  const salesPoints = salesRatio * 35;

  const reviewTrust = clamp(Math.log10(reviews + 1) / Math.log10(3_000));
  // Rating tanpa ulasan tidak boleh dipercaya penuh.
  const ratingPoints = rating > 0
    ? clamp((rating - 3.5) / 1.5) * (0.5 + 0.5 * reviewTrust) * 25
    : 0;
  const reviewPoints = reviewTrust * 15;

  const fit = priceFit(product.price, region);
  const pricePoints = fit * 15;

  const knownFields = [
    product.shop,
    product.category,
    product.image,
    product.stock,
    product.url,
  ].filter(Boolean).length;
  const completenessPoints = (knownFields / 5) * 6;
  const shippingPoints = product.freeShipping ? 4 : 0;
  const trustPoints = completenessPoints + shippingPoints;

  const breakdown: ScorePart[] = [
    { label: "Volume penjualan", points: Math.round(salesPoints), max: 35 },
    { label: "Rating", points: Math.round(ratingPoints), max: 25 },
    { label: "Kedalaman ulasan", points: Math.round(reviewPoints), max: 15 },
    { label: "Kesesuaian harga", points: Math.round(pricePoints), max: 15 },
    { label: "Kelengkapan data", points: Math.round(trustPoints), max: 10 },
  ];

  const total = Math.round(
    salesPoints + ratingPoints + reviewPoints + pricePoints + trustPoints
  );
  const score = Math.min(100, Math.max(1, total));

  const reasons: string[] = [];
  const risks: string[] = [];

  if (sold >= 500) reasons.push(`Terjual ${count(sold)} unit — permintaan terbukti`);
  else if (sold >= 100) reasons.push(`Terjual ${count(sold)} unit, di atas rata-rata kategori`);
  else if (sold > 0) reasons.push(`Sudah ${sold} unit terjual — sinyal awal ada`);

  if (rating >= 4.7) reasons.push(`Rating ${rating.toFixed(1)}/5${reviews > 0 ? ` dari ${formatNumber(reviews, locale)} ulasan` : ""}`);
  else if (rating >= 4.4) reasons.push(`Rating sehat ${rating.toFixed(1)}/5`);

  if (reviews >= 1_000) reasons.push(`${formatNumber(reviews, locale)} ulasan — bukti sosial kuat`);
  else if (reviews >= 100) reasons.push(`${formatNumber(reviews, locale)} ulasan menandakan pembeli aktif`);

  if (fit >= 0.95) reasons.push(`Harga ${money(priceIDR)} di zona impulse buy ${getRegion(region).short}`);
  if (product.freeShipping) reasons.push("Gratis ongkir — mengurangi hambatan checkout");
  if (product.stock !== undefined && product.stock > 500) reasons.push("Stok pemasok tebal");

  if (sold < 50) risks.push("Volume penjualan masih rendah — validasi permintaan dulu");
  if (reviews < 20) risks.push("Ulasan sedikit — bukti sosial belum kuat");
  if (rating > 0 && rating < 4.3) risks.push(`Rating ${rating.toFixed(1)} di bawah rata-rata`);
  if (rating === 0) risks.push("Rating belum tersedia — cek kualitas produk");
  if (product.price > sweetSpot.max * 2) {
    risks.push(`Harga jauh di atas zona impulse (${money(priceIDR)}) — konversi lebih lambat`);
  }
  if (product.stock === 0) risks.push("Stok sedang habis — cek ketersediaan supplier");
  else if (product.stock !== undefined && product.stock <= 10) {
    risks.push("Stok tersisa sangat sedikit");
  }
  if ((product.discountPercent ?? 0) >= 40) risks.push("Diskon besar — margin bisa tipis");
  if (sold > 1_000 && reviews < 20) risks.push("Penjualan tinggi tapi ulasan minim — cek keaslian data");

  if (reasons.length === 0) reasons.push("Lolos filter kualitas dasar — kandidat awal");
  if (risks.length === 0) risks.push("Validasi supplier & stok sebelum order besar");

  return {
    ...product,
    score,
    confidence: confidenceFor(product),
    reasons: reasons.slice(0, 3),
    risks: risks.slice(0, 2),
    breakdown,
  };
}
