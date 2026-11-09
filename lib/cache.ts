import { Redis } from "@upstash/redis";
import type { FunnelResult } from "./types";

const TTL_SECONDS = Math.max(
  60,
  Number(process.env.CACHE_TTL_MINUTES ?? 360) * 60
);

const MEMORY_MAX_ENTRIES = 100;

interface MemoryEntry {
  value: FunnelResult;
  expiresAt: number;
}

// Fallback in-memory: berguna di lokal / single instance saat Redis belum diset.
const memory = new Map<string, MemoryEntry>();

let redisClient: Redis | null | undefined;

function getRedis(): Redis | null {
  if (redisClient !== undefined) return redisClient;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  redisClient = url && token ? new Redis({ url, token }) : null;
  return redisClient;
}

export function cacheBackend(): "redis" | "memory" {
  return getRedis() ? "redis" : "memory";
}

function key(query: string, region: string): string {
  const normalized = query.toLowerCase().replace(/\s+/g, "-").slice(0, 80);
  return `analyze:${region}:${normalized}`;
}

function readMemory(cacheKey: string): FunnelResult | null {
  const entry = memory.get(cacheKey);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    memory.delete(cacheKey);
    return null;
  }
  // Refresh urutan LRU sederhana.
  memory.delete(cacheKey);
  memory.set(cacheKey, entry);
  return entry.value;
}

function writeMemory(cacheKey: string, value: FunnelResult) {
  if (memory.size >= MEMORY_MAX_ENTRIES) {
    const oldest = memory.keys().next().value;
    if (oldest) memory.delete(oldest);
  }
  memory.set(cacheKey, {
    value,
    expiresAt: Date.now() + TTL_SECONDS * 1000,
  });
}

export async function getCached(
  query: string,
  region: string
): Promise<FunnelResult | null> {
  const cacheKey = key(query, region);
  const redis = getRedis();

  if (redis) {
    try {
      const data = await redis.get<FunnelResult>(cacheKey);
      if (data) return data;
    } catch (error) {
      console.warn("Cache get error:", error);
    }
  }

  return readMemory(cacheKey);
}

export async function setCached(
  query: string,
  region: string,
  result: FunnelResult
): Promise<void> {
  const cacheKey = key(query, region);
  writeMemory(cacheKey, result);

  const redis = getRedis();
  if (!redis) return;

  try {
    await redis.set(cacheKey, result, { ex: TTL_SECONDS });
  } catch (error) {
    console.warn("Cache set error:", error);
  }
}

export function clearMemoryCache(): void {
  memory.clear();
}
