import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { RATE_LIMITS } from "@vibe-planning/shared";

let redis: Redis | null = null;
let emailRateLimiter: Ratelimit | null = null;
let smsRateLimiter: Ratelimit | null = null;

function getRedis(): Redis | null {
  if (!redis) {
    const url = process.env.UPSTASH_REDIS_URL;
    const token = process.env.UPSTASH_REDIS_TOKEN;

    if (!url || !token) {
      console.warn("Upstash Redis not configured - rate limiting disabled");
      return null;
    }

    redis = new Redis({ url, token });
  }
  return redis;
}

export function getEmailRatelimit(): Ratelimit | null {
  const redisClient = getRedis();
  if (!redisClient) return null;

  if (!emailRateLimiter) {
    emailRateLimiter = new Ratelimit({
      redis: redisClient,
      limiter: Ratelimit.slidingWindow(RATE_LIMITS.email, "1 d"),
      prefix: "ratelimit:email",
    });
  }
  return emailRateLimiter;
}

export function getSmsRatelimit(): Ratelimit | null {
  const redisClient = getRedis();
  if (!redisClient) return null;

  if (!smsRateLimiter) {
    smsRateLimiter = new Ratelimit({
      redis: redisClient,
      limiter: Ratelimit.slidingWindow(RATE_LIMITS.sms, "1 d"),
      prefix: "ratelimit:sms",
    });
  }
  return smsRateLimiter;
}

export async function checkRateLimit(
  limiter: Ratelimit | null,
): Promise<{ success: boolean; remaining: number }> {
  if (!limiter) {
    return { success: true, remaining: 999 };
  }
  const { success, remaining } = await limiter.limit("global");
  return { success, remaining };
}
