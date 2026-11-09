import type { BrandShare, Insights, Product, RegionCode } from "./types";
import { formatCompact, formatMoney, getRegion } from "./regions";
import { formatIDR, toIDR } from "./currency";

const clamp = (value: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));

function extractBrand(p: Product): string {
  if (p.shop && p.shop.trim().length > 0) return p.shop.trim();
  const first = p.name.split(/\s+/).slice(0, 2).join(" ");
  return first || "Tidak diketahui";
}

function emptyInsights(): Insights {
  return {
    opportunityScore: 0,
    opportunityLabel: "NETRAL",
    opportunityColor: "amber",
    opportunityReason: "Data tidak cukup untuk menyusun kesimpulan.",
    totalProducts: 0,
    totalSellers: 0,
    avgPrice: 0,
    priceRange: { min: 0, max: 0 },
    avgPriceIDR: 0,
    priceRangeIDR: { min: 0, max: 0 },
    saturationLevel: 50,
    saturationLabel: "Tidak diketahui",
    brands: [],
    playbook: [],
  };
}

/**
 * Menghasilkan insight pasar dari kandidat teratas (biasanya 20 produk).
 * Semua angka dihitung dari data yang benar-benar ada — tidak ada mock.
 */
export function generateInsights(
  products: Product[],
  region: RegionCode = "ID"
): Insights {
  if (products.length === 0) return emptyInsights();

  const meta = getRegion(region);
  const prices = products.map((p) => p.price).filter((p) => p > 0);
  const avgRaw = prices.length
    ? prices.reduce((a, b) => a + b, 0) / prices.length
    : 0;
  // IDR dibulatkan penuh; mata uang lain menyimpan 2 desimal agar konversi
  // Rupiah tetap konsisten dengan harga asli yang ditampilkan.
  const avgPrice = prices.length
    ? meta.currency === "IDR"
      ? Math.round(avgRaw)
      : Math.round(avgRaw * 100) / 100
    : 0;
  const priceRange = {
    min: prices.length ? Math.min(...prices) : 0,
    max: prices.length ? Math.max(...prices) : 0,
  };

  // Semua harga dipublikasikan dalam Rupiah. Region non-ID memakai kurs
  // yang sama dengan pipeline, sehingga angka konsisten sampai ekspor.
  const idrPrices = products
    .map((p) => p.priceIDR ?? toIDR(p.price, p.currency))
    .filter((p) => p > 0);
  const avgPriceIDR = idrPrices.length
    ? Math.round(idrPrices.reduce((a, b) => a + b, 0) / idrPrices.length)
    : 0;
  const priceRangeIDR = {
    min: idrPrices.length ? Math.min(...idrPrices) : 0,
    max: idrPrices.length ? Math.max(...idrPrices) : 0,
  };

  // Peta toko/merek memakai nama seller agar lebih akurat daripada menebak judul.
  const shopMap = new Map<string, { count: number; ratings: number[] }>();
  for (const p of products) {
    const brand = extractBrand(p);
    const entry = shopMap.get(brand) ?? { count: 0, ratings: [] };
    entry.count += 1;
    if (p.rating > 0) entry.ratings.push(p.rating);
    shopMap.set(brand, entry);
  }

  const brands: BrandShare[] = Array.from(shopMap.entries())
    .map(([brand, data]) => ({
      brand,
      count: data.count,
      percent: Math.round((data.count / products.length) * 100),
      avgRating: data.ratings.length
        ? Math.round(
            (data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length) * 10
          ) / 10
        : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const totalSellers = shopMap.size;
  const dominantShare = brands.length ? brands[0].percent / 100 : 0;

  // Saturasi = tekanan jumlah penjual + dominasi satu pemain.
  const sellerPressure = clamp(totalSellers / 25);
  const saturationLevel = Math.round(
    (sellerPressure * 0.6 + dominantShare * 0.4) * 100
  );

  let saturationLabel = "Seimbang";
  if (saturationLevel < 35) saturationLabel = "Masih Lengang";
  else if (saturationLevel >= 65) saturationLabel = "Sudah Ramai";

  const avgScore =
    products.reduce((a, p) => a + p.score, 0) / Math.max(products.length, 1);

  const priceInSweetSpot = prices.filter(
    (p) => p >= meta.sweetSpot.min && p <= meta.sweetSpot.max
  ).length;
  const priceFit = prices.length ? priceInSweetSpot / prices.length : 0;

  const totalSold = products.reduce((a, p) => a + p.sold, 0);
  const demandBreadth = clamp(totalSold / (products.length * 800));

  const opportunityScore = Math.round(
    clamp(avgScore / 100) * 45 +
      (1 - saturationLevel / 100) * 35 +
      priceFit * 10 +
      demandBreadth * 10
  );

  let opportunityLabel: Insights["opportunityLabel"] = "NETRAL";
  let opportunityColor: Insights["opportunityColor"] = "amber";
  let opportunityReason = "";

  if (opportunityScore >= 70) {
    opportunityLabel = "PELUANG BAGUS";
    opportunityColor = "green";
    opportunityReason = `Rata-rata skor kandidat ${Math.round(avgScore)}/100 dengan saturasi ${saturationLevel}/100. Permintaan ada, kompetisi masih bisa ditembus.`;
  } else if (opportunityScore >= 45) {
    opportunityLabel = "NETRAL";
    opportunityColor = "amber";
    opportunityReason = `Pasar cukup ramai (saturasi ${saturationLevel}/100). Masuk masih bisa, asal ada diferensiasi harga atau positioning.`;
  } else {
    opportunityLabel = "HATI-HATI";
    opportunityColor = "red";
    opportunityReason = `Saturasi tinggi (${saturationLevel}/100) dan skor kandidat moderat. Butuh sudut pandang produk yang benar-benar berbeda.`;
  }

  const playbook: Insights["playbook"] = [];
  const dominantBrand = brands[0];

  if (dominantBrand && dominantBrand.percent >= 40) {
    playbook.push({
      type: "info",
      title: `${dominantBrand.brand} dominan (${dominantBrand.percent}%)`,
      detail: "Satu pemain menguasai kategori. Hindari bertarung head-on; cari ceruk atau bundling.",
    });
  } else if (brands.length >= 3) {
    playbook.push({
      type: "do",
      title: "Pasar terfragmentasi",
      detail: `${totalSellers} toko berbagi permintaan. Peluang merek baru masuk masih terbuka.`,
    });
  }

  if (avgPrice > 0 && priceFit >= 0.5) {
    const localHint =
      meta.currency === "IDR"
        ? ""
        : ` (harga asli ${formatMoney(avgPrice, meta.currency)})`;
    playbook.push({
      type: "do",
      title: `Sweet spot ${formatIDR(avgPriceIDR, { compact: true })}${localHint}`,
      detail: `${Math.round(priceFit * 100)}% kandidat berada di zona impulse buy. Harga ini paling mudah diputuskan pembeli.`,
    });
  } else if (avgPrice > meta.sweetSpot.max) {
    const localHint =
      meta.currency === "IDR"
        ? ""
        : ` (harga asli ${formatMoney(avgPrice, meta.currency)})`;
    playbook.push({
      type: "info",
      title: "Segmen premium",
      detail: `Harga rata-rata ${formatIDR(avgPriceIDR)}${localHint} di atas zona impulse. Butuh konten edukasi dan bukti kualitas.`,
    });
  }

  if (saturationLevel > 65) {
    playbook.push({
      type: "dont",
      title: "Hindari harga rata-rata",
      detail: "Saturasi tinggi. Coba harga 20% lebih murah untuk volume, atau 30% lebih mahal dengan positioning berbeda.",
    });
  } else if (saturationLevel < 35) {
    playbook.push({
      type: "do",
      title: "First mover advantage",
      detail: "Kategori masih lengang. Masuk lebih awal memberi peluang lebih besar mendapat momentum FYP.",
    });
  }

  const avgRating =
    products.filter((p) => p.rating > 0).reduce((a, p) => a + p.rating, 0) /
    Math.max(products.filter((p) => p.rating > 0).length, 1);
  if (avgRating > 0 && avgRating < 4.4) {
    playbook.push({
      type: "dont",
      title: "Kualitas pemain rendah",
      detail: `Rata-rata rating hanya ${avgRating.toFixed(1)}/5. Kualitas dan layanan yang konsisten bisa jadi pembeda.`,
    });
  }

  if (totalSold > products.length * 500) {
    playbook.push({
      type: "do",
      title: "Permintaan terbukti",
      detail: `Total ${formatCompact(totalSold, meta.locale)} unit terjual dari ${products.length} kandidat teratas. Fokus pada stok dan kecepatan pengiriman.`,
    });
  }

  return {
    opportunityScore,
    opportunityLabel,
    opportunityColor,
    opportunityReason,
    totalProducts: products.length,
    totalSellers,
    avgPrice,
    priceRange,
    avgPriceIDR,
    priceRangeIDR,
    saturationLevel,
    saturationLabel,
    brands,
    playbook: playbook.slice(0, 3),
  };
}
