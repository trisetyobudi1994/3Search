/**
 * Konversi mata uang ke Rupiah.
 *
 * Aplikasi menampilkan harga dan simulasi profit dalam IDR. Untuk region US/MY,
 * harga asli dikonversi memakai kurs estimasi. Kurs bisa dioverride di server
 * lewat IDR_RATE_USD / IDR_RATE_MYR tanpa mengubah kode.
 */

export const DEFAULT_IDR_RATES: Record<string, number> = {
  IDR: 1,
  USD: 16_500,
  MYR: 3_700,
};

function positiveNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/** Kurs efektif di server (env) atau default di browser. */
export function getIdrRates(): Record<string, number> {
  return {
    IDR: 1,
    USD: positiveNumber(process.env.IDR_RATE_USD, DEFAULT_IDR_RATES.USD),
    MYR: positiveNumber(process.env.IDR_RATE_MYR, DEFAULT_IDR_RATES.MYR),
  };
}

export function toIDR(
  amount: number,
  currency: string,
  rates: Record<string, number> = getIdrRates()
): number {
  if (!Number.isFinite(amount)) return 0;
  const rate = rates[currency] ?? 1;
  return Math.round(amount * rate);
}

export function formatIDR(
  value: number,
  opts: { compact?: boolean } = {}
): string {
  if (!Number.isFinite(value)) return "—";
  try {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      notation: opts.compact ? "compact" : "standard",
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `Rp ${Math.round(value).toLocaleString("id-ID")}`;
  }
}

/** Label kurs, mis. "Rp16.500/US$". */
export function formatRate(currency: string, rates: Record<string, number>): string {
  const rate = rates[currency] ?? 1;
  const symbol = currency === "USD" ? "US$" : currency === "MYR" ? "RM" : currency;
  return `${formatIDR(rate)}/${symbol}`;
}
