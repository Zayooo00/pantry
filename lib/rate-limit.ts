type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();

export type RateLimitArgs = {
  bucket: string;
  key: string;
  max: number;
  windowMs: number;
};

export type RateLimitResult =
  | { allowed: true; remaining: number; retryAfterSec: 0 }
  | { allowed: false; remaining: 0; retryAfterSec: number };

export function rateLimit(args: RateLimitArgs): RateLimitResult {
  if (process.env.E2E_BYPASS_RATE_LIMIT === "1") {
    return { allowed: true, remaining: args.max, retryAfterSec: 0 };
  }
  const composite = `${args.bucket}:${args.key}`;
  const now = Date.now();
  const existing = store.get(composite);
  if (!existing || existing.resetAt <= now) {
    store.set(composite, { count: 1, resetAt: now + args.windowMs });
    if (store.size > 5000) {
      sweep(now);
    }
    return { allowed: true, remaining: args.max - 1, retryAfterSec: 0 };
  }
  if (existing.count >= args.max) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }
  existing.count += 1;
  return { allowed: true, remaining: args.max - existing.count, retryAfterSec: 0 };
}

export function clientKey(req: { headers: Headers }): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function sweep(now: number) {
  for (const [k, v] of store) {
    if (v.resetAt <= now) {
      store.delete(k);
    }
  }
}
