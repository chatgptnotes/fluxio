/**
 * In-memory sliding window rate limiter.
 * Tracks request timestamps per key (IP, API key, etc.) and enforces
 * configurable limits within a time window.
 *
 * Note: In-memory state resets on serverless cold starts. This is acceptable
 * for Vercel because it still prevents sustained abuse within a single
 * instance lifetime, and the TRB246 gateway sends ~1 req/min (well under limits).
 */

interface RateLimitEntry {
  timestamps: number[]
  blockedUntil?: number
}

interface RateLimiterConfig {
  /** Maximum number of requests allowed within the window */
  maxRequests: number
  /** Time window in milliseconds */
  windowMs: number
  /** Optional: block duration in ms after limit is exceeded (default: same as windowMs) */
  blockDurationMs?: number
}

const stores = new Map<string, Map<string, RateLimitEntry>>()

// Periodic cleanup every 5 minutes to prevent unbounded memory growth
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000
let cleanupTimer: ReturnType<typeof setInterval> | null = null

function startCleanup() {
  if (cleanupTimer) return
  cleanupTimer = setInterval(() => {
    const now = Date.now()
    for (const [, store] of stores) {
      for (const [key, entry] of store) {
        // Remove entries with no recent timestamps and no active block
        const hasRecentTimestamps = entry.timestamps.some(t => now - t < 60 * 60 * 1000)
        const isBlocked = entry.blockedUntil && entry.blockedUntil > now
        if (!hasRecentTimestamps && !isBlocked) {
          store.delete(key)
        }
      }
    }
  }, CLEANUP_INTERVAL_MS)
  // Allow Node process to exit without waiting for this timer
  if (cleanupTimer && typeof cleanupTimer === 'object' && 'unref' in cleanupTimer) {
    cleanupTimer.unref()
  }
}

export function createRateLimiter(name: string, config: RateLimiterConfig) {
  if (!stores.has(name)) {
    stores.set(name, new Map())
  }
  startCleanup()

  const store = stores.get(name)!
  const { maxRequests, windowMs, blockDurationMs } = config
  const effectiveBlockMs = blockDurationMs ?? windowMs

  return {
    /**
     * Check if a request is allowed for the given key.
     * Returns { allowed, remaining, retryAfterMs }.
     */
    check(key: string): { allowed: boolean; remaining: number; retryAfterMs: number } {
      const now = Date.now()
      let entry = store.get(key)

      if (!entry) {
        entry = { timestamps: [] }
        store.set(key, entry)
      }

      // Check if currently blocked
      if (entry.blockedUntil && entry.blockedUntil > now) {
        return {
          allowed: false,
          remaining: 0,
          retryAfterMs: entry.blockedUntil - now,
        }
      }

      // Clear expired block
      if (entry.blockedUntil && entry.blockedUntil <= now) {
        entry.blockedUntil = undefined
      }

      // Prune timestamps outside the window
      entry.timestamps = entry.timestamps.filter(t => now - t < windowMs)

      if (entry.timestamps.length >= maxRequests) {
        // Rate limit exceeded, apply block
        entry.blockedUntil = now + effectiveBlockMs
        return {
          allowed: false,
          remaining: 0,
          retryAfterMs: effectiveBlockMs,
        }
      }

      // Allow the request
      entry.timestamps.push(now)
      return {
        allowed: true,
        remaining: maxRequests - entry.timestamps.length,
        retryAfterMs: 0,
      }
    },

    /**
     * Manually reset the rate limit for a key (e.g., after successful login).
     */
    reset(key: string): void {
      store.delete(key)
    },

    /**
     * Manually block a key for a specified duration.
     */
    block(key: string, durationMs: number): void {
      const entry = store.get(key) || { timestamps: [] }
      entry.blockedUntil = Date.now() + durationMs
      store.set(key, entry)
    },
  }
}

// Pre-configured rate limiters for the application

/** Login: 5 attempts per IP per 15 minutes */
export const loginRateLimiter = createRateLimiter('login', {
  maxRequests: 5,
  windowMs: 15 * 60 * 1000,
  blockDurationMs: 15 * 60 * 1000,
})

/** Ingest API: 120 requests per minute per API key */
export const ingestRateLimiter = createRateLimiter('ingest', {
  maxRequests: 120,
  windowMs: 60 * 1000,
})

/** Registration: 3 attempts per IP per hour */
export const registrationRateLimiter = createRateLimiter('registration', {
  maxRequests: 3,
  windowMs: 60 * 60 * 1000,
})

/** Password change: 5 attempts per IP per 15 minutes */
export const passwordChangeRateLimiter = createRateLimiter('password-change', {
  maxRequests: 5,
  windowMs: 15 * 60 * 1000,
  blockDurationMs: 15 * 60 * 1000,
})

/** Admin user creation: 10 per IP per hour */
export const adminUserCreationRateLimiter = createRateLimiter('admin-user-creation', {
  maxRequests: 10,
  windowMs: 60 * 60 * 1000,
})
