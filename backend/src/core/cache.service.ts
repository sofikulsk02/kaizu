import { Redis } from "@upstash/redis";
import { upstashRedisRestUrl, upstashRedisRestToken } from "../config";

let redisClient: Redis | null = null;
let isRedisAvailable = false;

if (upstashRedisRestUrl && upstashRedisRestToken) {
  try {
    redisClient = new Redis({
      url: upstashRedisRestUrl,
      token: upstashRedisRestToken,
    });
    isRedisAvailable = true;
    console.log("⚡ [Cache] Upstash Redis client initialized successfully.");
  } catch (err) {
    console.warn("⚠️ [Cache] Failed to initialize Upstash Redis:", err);
    redisClient = null;
    isRedisAvailable = false;
  }
} else {
  console.log("ℹ️ [Cache] Upstash Redis credentials not provided, running in bypass mode.");
}

export class CacheService {
  /**
   * Check if Redis is configured and available
   */
  public static isConnected(): boolean {
    return isRedisAvailable && redisClient !== null;
  }

  /**
   * Get parsed JSON data from cache
   */
  public static async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected() || !redisClient) return null;
    try {
      const data = await redisClient.get<T>(key);
      if (data !== null && data !== undefined) {
        return data as T;
      }
      return null;
    } catch (error) {
      console.warn(`⚠️ [Cache Get Error] Key: "${key}":`, error);
      return null;
    }
  }

  /**
   * Store data in cache with TTL (in seconds)
   * Default TTL is 300 seconds (5 minutes)
   */
  public static async set<T>(key: string, value: T, ttlSeconds: number = 300): Promise<void> {
    if (!this.isConnected() || !redisClient) return;
    try {
      await redisClient.set(key, value, { ex: ttlSeconds });
    } catch (error) {
      console.warn(`⚠️ [Cache Set Error] Key: "${key}":`, error);
    }
  }

  /**
   * Delete a single cache key
   */
  public static async del(key: string): Promise<void> {
    if (!this.isConnected() || !redisClient) return;
    try {
      await redisClient.del(key);
    } catch (error) {
      console.warn(`⚠️ [Cache Del Error] Key: "${key}":`, error);
    }
  }

  /**
   * Delete multiple keys or keys matching a wildcard pattern
   */
  public static async delPattern(pattern: string): Promise<void> {
    if (!this.isConnected() || !redisClient) return;
    try {
      const keys = await redisClient.keys(pattern);
      if (keys && keys.length > 0) {
        await redisClient.del(...keys);
      }
    } catch (error) {
      console.warn(`⚠️ [Cache DelPattern Error] Pattern: "${pattern}":`, error);
    }
  }

  /**
   * High-level cache fetcher: returns cached data if available;
   * otherwise calls fetchFn, caches result, and returns it.
   */
  public static async fetchOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlSeconds: number = 300
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const fresh = await fetchFn();
    if (fresh !== null && fresh !== undefined) {
      // Background non-blocking cache set
      this.set(key, fresh, ttlSeconds).catch(() => {});
    }
    return fresh;
  }

  // --- Domain-Specific Invalidation Helpers ---

  public static async invalidateUserSubjects(userId: string): Promise<void> {
    await this.delPattern(`kaizu:user:${userId}:subjects*`);
  }

  public static async invalidateUserGoals(userId: string): Promise<void> {
    await this.delPattern(`kaizu:user:${userId}:goals*`);
  }

  public static async invalidateUserProjects(userId: string): Promise<void> {
    await this.delPattern(`kaizu:user:${userId}:projects*`);
  }

  public static async invalidateUserAll(userId: string): Promise<void> {
    await this.delPattern(`kaizu:user:${userId}:*`);
  }
}
