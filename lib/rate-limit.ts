import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const hasRedis = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
);
const redis = hasRedis ? Redis.fromEnv() : null;

if (!hasRedis && process.env.NODE_ENV === "production") {
  console.warn(
    "Rate limiting is using in-memory storage. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.",
  );
}

const limiters = new Map<string, Ratelimit>();

function redisLimiter(name: string, limit: number, windowSec: number) {
  const id = `${name}:${limit}:${windowSec}`;
  let l = limiters.get(id);
  if (!l) {
    l = new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.slidingWindow(limit, `${windowSec} s` as `${number} s`),
      prefix: `picskrypt:rl:${name}`,
      timeout: 2000, 
    });
    limiters.set(id, l);
  }
  return l;
}

const hits = new Map<string, { count: number; resetAt: number }>();

function memoryLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || entry.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    if (hits.size > 10_000) {
      for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
    }
    return true;
  }

  entry.count += 1;
  return entry.count <= limit;
}

export async function rateLimit(
  name: string,
  key: string,
  limit: number,
  windowSec: number,
): Promise<boolean> {
  if (!redis) return memoryLimit(`${name}:${key}`, limit, windowSec * 1000);

  try {
    const { success } = await redisLimiter(name, limit, windowSec).limit(key);
    return success;
  } catch (err) {
    console.error("Rate limit backend error, failing open:", err);
    return true;
  }
}

export function getClientIp(req: Request): string {
  return (
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}