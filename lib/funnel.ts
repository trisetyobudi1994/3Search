import type { FunnelResult } from "./types";

/**
 * Helper sisi-client: memanggil API route /api/analyze.
 * (Sebelumnya file ini duplikat lib/apify.ts dan tidak mengekspor `analyze`,
 * sehingga page.tsx gagal jalan di production.)
 */
export async function analyze(query: string, region = "ID"): Promise<FunnelResult> {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, region }),
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    // Vercel bisa mengembalikan HTML saat timeout (504)
    throw new Error(
      res.status === 504
        ? "Server timeout. Coba lagi sebentar atau pakai keyword lain."
        : `Respons server tidak valid (HTTP ${res.status})`
    );
  }

  if (!res.ok) throw new Error(data?.error || `Gagal (HTTP ${res.status})`);
  if (!data?.products?.length) throw new Error("Tidak ada produk ditemukan untuk keyword ini.");
  return data as FunnelResult;
}
