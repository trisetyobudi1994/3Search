import type {
  FunnelResult,
  HealthResponse,
  RegionCode,
  StatsResponse,
} from "./types";

export class ApiError extends Error {
  status: number;
  hint?: string;
  code?: string;

  constructor(message: string, status = 500, hint?: string, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.hint = hint;
    this.code = code;
  }
}

async function parseJson(response: Response): Promise<Record<string, unknown>> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new ApiError(
      "Server mengembalikan respons yang tidak dikenali.",
      response.status,
      "Coba lagi beberapa saat lagi."
    );
  }
  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    throw new ApiError("Respons server tidak valid.", response.status);
  }
}

export async function requestAnalysis(input: {
  query: string;
  region: RegionCode;
}): Promise<FunnelResult> {
  let response: Response;
  try {
    response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    throw new ApiError(
      "Tidak bisa menghubungi server analisis.",
      0,
      "Periksa koneksi internet lalu coba lagi."
    );
  }

  const payload = await parseJson(response);

  if (!response.ok) {
    throw new ApiError(
      typeof payload.error === "string" ? payload.error : "Analisis gagal.",
      response.status,
      typeof payload.hint === "string" ? payload.hint : undefined,
      typeof payload.code === "string" ? payload.code : undefined
    );
  }

  const result = payload as unknown as FunnelResult;
  if (!Array.isArray(result.products)) {
    throw new ApiError("Format hasil analisis tidak dikenali.", response.status);
  }

  return result;
}

export async function fetchStats(): Promise<StatsResponse> {
  const response = await fetch("/api/stats", { cache: "no-store" });
  const payload = await parseJson(response);
  if (!response.ok) {
    throw new ApiError(
      typeof payload.error === "string" ? payload.error : "Gagal memuat statistik.",
      response.status
    );
  }
  return payload as unknown as StatsResponse;
}

export async function fetchHealth(): Promise<HealthResponse | null> {
  try {
    const response = await fetch("/api/health", { cache: "no-store" });
    if (!response.ok) return null;
    return (await response.json()) as HealthResponse;
  } catch {
    return null;
  }
}

export async function sendFeedback(input: {
  rec_id: string;
  status: "success" | "failed";
}): Promise<{ stored: boolean; duplicate?: boolean; demo?: boolean }> {
  const response = await fetch("/api/analyze/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const payload = await parseJson(response);
  if (!response.ok) {
    throw new ApiError(
      typeof payload.error === "string" ? payload.error : "Gagal menyimpan feedback.",
      response.status
    );
  }

  return {
    stored: Boolean(payload.stored),
    duplicate: Boolean(payload.duplicate),
    demo: Boolean(payload.demo),
  };
}
