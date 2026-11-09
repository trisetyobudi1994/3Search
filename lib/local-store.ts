import type {
  LocalStats,
  Product,
  RecentSearch,
  RegionCode,
} from "./types";

const STORAGE_KEY = "3search.store.v1";
const MAX_RECENT = 6;
const MAX_SAVED = 12;
const MAX_FEEDBACK = 200;

type FeedbackStatus = "success" | "failed";

interface StoreShape {
  recent: RecentSearch[];
  saved: Product[];
  feedback: Record<string, FeedbackStatus>;
  analyses: number;
}

function freshStore(): StoreShape {
  return { recent: [], saved: [], feedback: {}, analyses: 0 };
}

function read(): StoreShape {
  if (typeof window === "undefined") return freshStore();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return freshStore();
    const parsed = JSON.parse(raw) as Partial<StoreShape>;
    return {
      recent: Array.isArray(parsed.recent) ? parsed.recent.slice(0, MAX_RECENT) : [],
      saved: Array.isArray(parsed.saved) ? parsed.saved.slice(0, MAX_SAVED) : [],
      feedback:
        parsed.feedback && typeof parsed.feedback === "object"
          ? (parsed.feedback as Record<string, FeedbackStatus>)
          : {},
      analyses: typeof parsed.analyses === "number" ? parsed.analyses : 0,
    };
  } catch {
    return freshStore();
  }
}

function write(store: StoreShape): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Storage penuh / diblokir: abaikan, fitur tetap jalan tanpa persistensi.
  }
}

export function getRecentSearches(limit = MAX_RECENT): RecentSearch[] {
  return read().recent.slice(0, limit);
}

export function recordAnalysis(query: string, region: RegionCode): void {
  const store = read();
  const normalized = query.trim();
  if (!normalized) return;

  store.analyses += 1;
  store.recent = [
    { query: normalized, region, at: Date.now() },
    ...store.recent.filter(
      (item) => item.query.toLowerCase() !== normalized.toLowerCase() || item.region !== region
    ),
  ].slice(0, MAX_RECENT);

  write(store);
}

export function clearRecentSearches(): void {
  const store = read();
  store.recent = [];
  write(store);
}

export function getSavedProducts(): Product[] {
  return read().saved;
}

export function isProductSaved(id: string): boolean {
  return read().saved.some((product) => product.id === id);
}

export function toggleSavedProduct(product: Product): boolean {
  const store = read();
  const exists = store.saved.some((item) => item.id === product.id);
  store.saved = exists
    ? store.saved.filter((item) => item.id !== product.id)
    : [product, ...store.saved].slice(0, MAX_SAVED);
  write(store);
  return !exists;
}

export function recordLocalFeedback(key: string, status: FeedbackStatus): void {
  const store = read();
  const entries = Object.entries(store.feedback);
  if (entries.length >= MAX_FEEDBACK && !(key in store.feedback)) {
    const oldest = entries[0]?.[0];
    if (oldest) delete store.feedback[oldest];
  }
  store.feedback[key] = status;
  write(store);
}

export function getLocalFeedback(): Record<string, FeedbackStatus> {
  return read().feedback;
}

export function getSessionStats(): LocalStats {
  const store = read();
  const statuses = Object.values(store.feedback);
  const success = statuses.filter((s) => s === "success").length;
  const failed = statuses.filter((s) => s === "failed").length;
  const total = success + failed;
  return {
    analyses: store.analyses,
    feedback: total,
    success,
    failed,
    hitRate: total > 0 ? Math.round((success / total) * 100) : 0,
  };
}

export function clearLocalData(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
