import type { FunnelResult } from "./types";
import { getRegion } from "./regions";
import { toIDR } from "./currency";

function download(filename: string, content: string, mime: string) {
  if (typeof window === "undefined") return;
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2_000);
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "hasil"
  );
}

function csvCell(value: string | number | undefined): string {
  if (value === undefined || value === null) return '""';
  return `"${String(value).replace(/"/g, '""')}"`;
}

export function resultToCsv(result: FunnelResult): string {
  const header = [
    "Peringkat",
    "Produk",
    "Toko",
    "Harga (IDR)",
    "Harga Asli",
    "Mata Uang",
    "Terjual",
    "Rating",
    "Ulasan",
    "Skor",
    "Kepercayaan",
    "Alasan",
    "Risiko",
    "URL",
  ];

  const rows = result.products.map((p, index) =>
    [
      index + 1,
      p.name,
      p.shop ?? "",
      p.priceIDR ?? toIDR(p.price, p.currency),
      p.price,
      p.currency,
      p.sold,
      p.rating > 0 ? p.rating.toFixed(1) : "",
      p.reviews,
      p.score,
      p.confidence,
      p.reasons.join(" | "),
      p.risks.join(" | "),
      p.url ?? "",
    ]
      .map(csvCell)
      .join(",")
  );

  return [header.map(csvCell).join(","), ...rows].join("\r\n");
}

export function exportResultCsv(result: FunnelResult): void {
  const date = new Date(result.generatedAt).toISOString().slice(0, 10);
  // BOM agar Excel membaca UTF-8 dengan benar.
  download(
    `3search-${slugify(result.query)}-${date}.csv`,
    `\uFEFF${resultToCsv(result)}`,
    "text/csv;charset=utf-8"
  );
}

export function exportResultJson(result: FunnelResult): void {
  const date = new Date(result.generatedAt).toISOString().slice(0, 10);
  download(
    `3search-${slugify(result.query)}-${date}.json`,
    JSON.stringify(
      {
        ...result,
        exportedAt: new Date().toISOString(),
        source:
          result.mode === "live"
            ? "Apify TikTok Shop scraper"
            : "Dataset demo (simulasi)",
      },
      null,
      2
    ),
    "application/json"
  );
}

export function resultShareUrl(result: FunnelResult): string {
  if (typeof window === "undefined") return "";
  const url = new URL(window.location.origin + "/");
  url.searchParams.set("q", result.query);
  url.searchParams.set("region", result.region);
  return url.toString();
}

export function regionLabel(region: string): string {
  return getRegion(region).label;
}
