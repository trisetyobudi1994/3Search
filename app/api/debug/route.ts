import { NextRequest, NextResponse } from "next/server";
import { ApifyClient } from "apify-client";
import { ACTOR_ID } from "@/lib/apify";

export const runtime = "nodejs";
export const maxDuration = 30;

// Hanya aktif jika DEBUG_KEY diset, akses: /api/debug?key=<DEBUG_KEY>
export async function GET(req: NextRequest) {
  const debugKey = process.env.DEBUG_KEY;
  if (!debugKey || req.nextUrl.searchParams.get("key") !== debugKey) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const token = process.env.APIFY_TOKEN;
  const result: any = {
    apifyTokenSet: !!token,
    actor: ACTOR_ID,
    supabaseSet: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    redisSet: !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN),
  };

  if (token) {
    try {
      const info = await new ApifyClient({ token }).actor(ACTOR_ID).get();
      result.actorExists = !!info;
      result.actorName = info?.name;
    } catch (err: any) {
      result.actorExists = false;
      result.actorError = err?.message;
    }
  }
  return NextResponse.json(result);
}
