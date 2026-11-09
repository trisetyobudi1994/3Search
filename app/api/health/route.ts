import { NextResponse } from "next/server";
import packageJson from "../../../package.json";
import { getActorId, isApifyConfigured } from "@/lib/apify";
import { getIdrRates } from "@/lib/currency";
import { cacheBackend } from "@/lib/cache";
import { isDatabaseConfigured } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Status konfigurasi yang aman untuk publik.
 * Tidak pernah mengembalikan nilai token atau kredensial.
 */
export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      dataSource: isApifyConfigured() ? "live" : "demo",
      database: isDatabaseConfigured(),
      cache: cacheBackend(),
      version: packageJson.version,
      scraper: {
        configured: isApifyConfigured(),
        actor: getActorId(),
      },
      idrRates: getIdrRates(),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
