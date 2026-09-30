import { NextResponse } from "next/server";

interface RateLimitRecord {
  timestamps: number[];
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetInSeconds: number;
}

// In-memory sliding window store
const rateLimitStore = new Map<string, RateLimitRecord>();

let lastCleanup = Date.now();
function cleanupExpired(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < 60_000) return;
  lastCleanup = now;

  for (const [key, record] of rateLimitStore.entries()) {
    record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);
    if (record.timestamps.length === 0) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Checks if the request under `key` exceeds `limit` within `windowSeconds`.
 */
export function checkRateLimit(
  key: string,
  limit = 60,
  windowSeconds = 60,
): RateLimitResult {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  cleanupExpired(windowMs);

  let record = rateLimitStore.get(key);
  if (!record) {
    record = { timestamps: [] };
    rateLimitStore.set(key, record);
  }

  // Filter timestamps outside current sliding window
  record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (record.timestamps.length >= limit) {
    const oldestTimestamp = record.timestamps[0];
    const resetMs = Math.max(0, oldestTimestamp + windowMs - now);
    const resetInSeconds = Math.ceil(resetMs / 1000) || 1;

    return {
      success: false,
      limit,
      remaining: 0,
      resetInSeconds,
    };
  }

  // Record hit
  record.timestamps.push(now);

  const remaining = Math.max(0, limit - record.timestamps.length);
  return {
    success: true,
    limit,
    remaining,
    resetInSeconds: windowSeconds,
  };
}

/**
 * Extracts a client IP address from standard headers or request object.
 */
export function getClientIp(request: Request): string {
  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp.trim();

  const xRealIp = request.headers.get("x-real-ip");
  if (xRealIp) return xRealIp.trim();

  const xForwardedFor = request.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    const first = xForwardedFor.split(",")[0].trim();
    if (first) return first;
  }

  return "127.0.0.1";
}

/**
 * Creates a standard HTTP 429 Too Many Requests response with rate limit headers.
 */
export function createRateLimitResponse(
  result: RateLimitResult,
  origin?: string | null,
): NextResponse {
  const headers: Record<string, string> = {
    "Retry-After": result.resetInSeconds.toString(),
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": "0",
    "X-RateLimit-Reset": result.resetInSeconds.toString(),
  };

  if (origin) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Methods"] =
      "GET, POST, PUT, PATCH, DELETE, OPTIONS";
    headers["Access-Control-Allow-Headers"] =
      "Content-Type, Authorization, X-Requested-With, X-Api-Key";
  }

  return NextResponse.json(
    {
      success: false,
      error: `Too many requests. Please try again after ${result.resetInSeconds} seconds.`,
      retryAfter: result.resetInSeconds,
    },
    {
      status: 429,
      headers,
    },
  );
}
