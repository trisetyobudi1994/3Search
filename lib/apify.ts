import { ApifyClient } from "apify-client";

export type ScraperErrorCode =
  | "missing_token"
  | "actor_failed"
  | "empty"
  | "timeout"
  | "unknown";

export class ScraperError extends Error {
  code: ScraperErrorCode;

  constructor(code: ScraperErrorCode, message: string) {
    super(message);
    this.name = "ScraperError";
    this.code = code;
  }
}

const DEFAULT_ACTOR = "herus13/tiktok-shop-scraper";

export function getActorId(): string {
  return process.env.APIFY_ACTOR?.trim() || DEFAULT_ACTOR;
}

export function isApifyConfigured(): boolean {
  return Boolean(process.env.APIFY_TOKEN?.trim());
}

function readExtraInput(): Record<string, unknown> {
  const raw = process.env.APIFY_ACTOR_INPUT;
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  } catch {
    console.warn("APIFY_ACTOR_INPUT bukan JSON valid — diabaikan.");
    return {};
  }
}

function runTimeoutSeconds(): number {
  const value = Number(process.env.APIFY_TIMEOUT_SECONDS);
  if (!Number.isFinite(value) || value <= 0) return 45;
  // Route analisis dibatasi 60 detik, jadi run aktor tidak boleh lebih lama.
  return Math.min(50, Math.max(10, Math.round(value)));
}

/**
 * Menjalankan actor Apify dan mengambil item dari dataset-nya.
 * Melempar ScraperError dengan kode yang bisa dipetakan ke pesan UI.
 */
export async function fetchTikTokProducts(
  keyword: string,
  region = "ID",
  maxItems = 100
): Promise<unknown[]> {
  const token = process.env.APIFY_TOKEN?.trim();
  if (!token) {
    throw new ScraperError(
      "missing_token",
      "APIFY_TOKEN belum diset. Aplikasi berjalan dalam mode demo."
    );
  }

  const client = new ApifyClient({ token });
  const actorId = getActorId();
  const timeout = runTimeoutSeconds();

  // Skema actor default (herus13/tiktok-shop-scraper): search_terms + max_results.
  // APIFY_ACTOR_INPUT di-merge terakhir bila perlu menimpa field lain.
  const input = {
    search_terms: [keyword],
    region,
    max_results: maxItems,
    ...readExtraInput(),
  };

  let run;
  try {
    // `timeout` membatasi durasi run, sedangkan `waitSecs` mencegah polling
    // tanpa batas bila aktor tidak pernah selesai.
    run = await client.actor(actorId).call(input, {
      timeout,
      waitSecs: Math.min(59, timeout + 5),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/timeout|timed out|ECONNABORTED/i.test(message)) {
      throw new ScraperError("timeout", `Actor ${actorId} melewati batas ${timeout} detik.`);
    }
    throw new ScraperError("actor_failed", message);
  }

  if (!run) {
    throw new ScraperError("actor_failed", "Actor tidak mengembalikan status run.");
  }

  if (run.status !== "SUCCEEDED") {
    throw new ScraperError(
      "actor_failed",
      `Actor ${actorId} selesai dengan status ${run.status ?? "UNKNOWN"}.`
    );
  }

  const { items } = await client
    .dataset(run.defaultDatasetId)
    .listItems({ limit: maxItems });

  if (!items || items.length === 0) {
    throw new ScraperError(
      "empty",
      `Actor ${actorId} tidak menemukan produk untuk "${keyword}".`
    );
  }

  return items;
}
