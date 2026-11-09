import type { RegionCode } from "./types";

export interface RegionMeta {
  code: RegionCode;
  label: string;
  short: string;
  flag: string;
  locale: string;
  currency: string;
  /** Zona harga impulse buy di pasar tersebut. */
  sweetSpot: { min: number; max: number };
}

export const REGIONS: RegionMeta[] = [
  {
    code: "ID",
    label: "Indonesia",
    short: "ID",
    flag: "🇮🇩",
    locale: "id-ID",
    currency: "IDR",
    sweetSpot: { min: 50_000, max: 200_000 },
  },
  {
    code: "US",
    label: "Amerika Serikat",
    short: "US",
    flag: "🇺🇸",
    locale: "en-US",
    currency: "USD",
    sweetSpot: { min: 8, max: 35 },
  },
  {
    code: "MY",
    label: "Malaysia",
    short: "MY",
    flag: "🇲🇾",
    locale: "ms-MY",
    currency: "MYR",
    sweetSpot: { min: 15, max: 80 },
  },
];

export const DEFAULT_REGION: RegionCode = "ID";

export function isRegionCode(value: unknown): value is RegionCode {
  return value === "ID" || value === "US" || value === "MY";
}

export function getRegion(code: string | undefined | null): RegionMeta {
  return REGIONS.find((r) => r.code === code) ?? REGIONS[0];
}

export function currencyForRegion(code: RegionCode): string {
  return getRegion(code).currency;
}

export function formatMoney(
  value: number,
  currency: string,
  opts: { compact?: boolean } = {}
): string {
  if (!Number.isFinite(value)) return "—";
  const locale =
    REGIONS.find((r) => r.currency === currency)?.locale ?? "en-US";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      notation: opts.compact ? "compact" : "standard",
      maximumFractionDigits: currency === "IDR" ? 0 : 2,
    }).format(value);
  } catch {
    return `${currency} ${Math.round(value).toLocaleString(locale)}`;
  }
}

export function formatNumber(value: number, locale = "id-ID"): string {
  if (!Number.isFinite(value)) return "—";
  try {
    return new Intl.NumberFormat(locale).format(value);
  } catch {
    return String(Math.round(value));
  }
}

export function formatCompact(value: number, locale = "id-ID"): string {
  if (!Number.isFinite(value)) return "—";
  try {
    return new Intl.NumberFormat(locale, {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  } catch {
    return String(Math.round(value));
  }
}

export function formatRelativeTime(iso: string): string {
  const date = new Date(iso).getTime();
  if (!Number.isFinite(date)) return "";
  const diff = Date.now() - date;
  if (diff < 45_000) return "baru saja";
  const minutes = Math.round(diff / 60_000);
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} hari lalu`;
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
