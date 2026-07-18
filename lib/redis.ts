import Redis from "ioredis"

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined
}

// Use lazyConnect so the module can be imported during Next.js build without
// a live Redis connection. Connection errors surface at runtime, not build time.
export const redis =
  globalForRedis.redis ??
  new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", { 
    lazyConnect: true,
    maxRetriesPerRequest: process.env.REDIS_URL ? 20 : 0,
  })

redis.on("error", (err) => console.error("[Redis]", err.message))

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis
