import { Redis } from "@upstash/redis";
import type { FunnelResult } from "./types";

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

const TTL_SECONDS = 60 * 60 * 6; // 6 jam

function key(query: string, region: string) {
  return `analyze:${region}:${query.toLowerCase().trim()}`;
}

export async function getCached(
  query: string,
  region: string
): Promise<FunnelResult | null> {
  if (!redis) return null;
  try {
    const data = await redis.get<FunnelResult>(key(query, region));
    return data ?? null;
  } catch (err) {
    console.warn("Cache get error:", err);
    return null;
  }
}

export async function setCached(
  query: string,
  region: string,
  result: FunnelResult
): Promise<void> {
  if (!redis) return;
  try {
    await redis.set(key(query, region), result, { ex: TTL_SECONDS });
  } catch (err) {
    console.warn("Cache set error:", err);
  }
}