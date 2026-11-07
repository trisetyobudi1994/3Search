import { NextResponse } from "next/server";
import { ApifyClient } from "apify-client";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET() {
  const token = process.env.APIFY_TOKEN;
  const actor = process.env.APIFY_ACTOR || "toolzerhub/tiktok-shop-scraper";

  const result: any = {
    tokenSet: !!token,
    tokenPreview: token ? token.slice(0, 15) + "..." : null,
    actor,
  };

  if (!token) {
    result.error = "APIFY_TOKEN tidak diset";
    return NextResponse.json(result);
  }

  try {
    const client = new ApifyClient({ token });
    // Coba ambil info actor dulu
    const actorInfo = await client.actor(actor).get();
    result.actorExists = true;
    result.actorName = actorInfo?.name;
    result.actorUsername = actorInfo?.username;
  } catch (err: any) {
    result.actorExists = false;
    result.actorError = err?.message || "Actor tidak ditemukan";
    return NextResponse.json(result);
  }

  return NextResponse.json(result);
}