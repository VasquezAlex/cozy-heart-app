import { Redis } from "@upstash/redis"

const fallbackCounters = new Map<string, { count: number; expiresAt: number }>()

function getRedisClient() {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    return null
  }

  return new Redis({ url, token })
}

export async function rateLimit(
  identifier: string,
  max: number = 10,
  windowSeconds: number = 60
) {
  const redis = getRedisClient()
  const key = `rate-limit:${identifier}`

  if (redis) {
    const current = await redis.incr(key)

    if (current === 1) {
      await redis.expire(key, windowSeconds)
    }

    return {
      success: current <= max,
      remaining: Math.max(0, max - current),
      reset: windowSeconds,
    }
  }

  const now = Date.now()
  const state = fallbackCounters.get(key)
  const expiresAt = now + windowSeconds * 1000

  if (!state || state.expiresAt <= now) {
    fallbackCounters.set(key, { count: 1, expiresAt })

    return {
      success: true,
      remaining: Math.max(0, max - 1),
      reset: windowSeconds,
    }
  }

  const nextCount = state.count + 1
  fallbackCounters.set(key, { count: nextCount, expiresAt: state.expiresAt })

  return {
    success: nextCount <= max,
    remaining: Math.max(0, max - nextCount),
    reset: Math.max(1, Math.ceil((state.expiresAt - now) / 1000)),
  }
}
