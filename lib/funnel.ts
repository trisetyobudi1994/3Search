import type { FunnelResult } from "./types";

export async function analyze(query: string): Promise<FunnelResult> {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, region: "ID" }),
  });

  const json = await res.json();

  if (!res.ok || json.error) {
    throw new Error(json.error || "Gagal terhubung ke server.");
  }

  if (!json.products || json.products.length === 0) {
    throw new Error("Tidak ada produk TikTok Shop yang ditemukan untuk kata kunci ini.");
  }

  return json as FunnelResult;
}