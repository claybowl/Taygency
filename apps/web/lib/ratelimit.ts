import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

let redis: Redis | null = null;
let emailRateLimiter: Ratelimit | null = null;
let smsRateLimiter: Ratelimit | null = null;

function getRedis(): Redis {
  if (!redis) {
    const url = process.env.UPSTASH_REDIS_URL;
    const token = process.env.UPSTASH_REDIS_TOKEN;

    if (!url || !token) {
      throw new Error('Upstash Redis credentials not configured');
    }

    redis = new Redis({ url, token });
  }
  return redis;
}

export function getEmailRatelimit(): Ratelimit {
  if (!emailRateLimiter) {
    emailRateLimiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(20, '1 d'),
      prefix: 'ratelimit:email',
    });
  }
  return emailRateLimiter;
}

export function getSmsRatelimit(): Ratelimit {
  if (!smsRateLimiter) {
    smsRateLimiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(10, '1 d'),
      prefix: 'ratelimit:sms',
    });
  }
  return smsRateLimiter;
}

export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<{ success: boolean; remaining: number }> {
  const { success, remaining } = await limiter.limit(identifier);
  return { success, remaining };
}
