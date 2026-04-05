/**
 * Redis caching layer for parser results
 * 
 * Dual-layer cache strategy:
 * 1. In-memory cache (fast, always available, lost on restart)
 * 2. Redis cache (persistent, survives restarts, shared across instances)
 * 
 * Flow:
 * - On cache miss: Check in-memory, then Redis, then parse fresh
 * - On cache hit: Return from in-memory (fastest)
 * - On successful parse: Save to both in-memory and Redis
 * - If Redis unavailable: Graceful fallback to in-memory only
 */

import type { ProductData } from "./types"

interface RedisConfig {
    host: string
    port: number
    db: number
    password?: string
    connectTimeout: number  // ms
    commandTimeout: number  // ms
}

export interface CacheEntry {
    data: ProductData
    timestamp: number
}

const DEFAULT_CONFIG: RedisConfig = {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379", 10),
    db: parseInt(process.env.REDIS_DB || "0", 10),
    password: process.env.REDIS_PASSWORD,
    connectTimeout: 500,   // Fast timeout to fall back to in-memory
    commandTimeout: 1000,  // Slow operations still fall back
}

const CACHE_TTL_SECONDS = 3600  // 1 hour, same as in-memory
const COMPRESSION_THRESHOLD = 10000  // Only compress if > 10KB
const CACHE_KEY_PREFIX = "parser:url:"

let redisClient: any = null
let isRedisAvailable = false
let lastRedisCheckTime = 0
let hasSuccessfullyConnected = false
const REDIS_CHECK_INTERVAL = 30000  // Re-check every 30s

/**
 * Initialize Redis connection (lazy, only when needed)
 */
async function initRedis(): Promise<boolean> {
    if (isRedisAvailable && redisClient) {
        return true
    }

    // Don't retry too frequently
    const now = Date.now()
    if (now - lastRedisCheckTime < REDIS_CHECK_INTERVAL) {
        return isRedisAvailable
    }
    lastRedisCheckTime = now

    try {
        // Lazy import to avoid adding hard dependency
        let redis: any
        try {
            // @ts-ignore - redis module may not be installed
            redis = await import("redis")
        } catch (e) {
            console.warn("[RedisCache] Redis module not installed. Skipping Redis cache.")
            console.warn("[RedisCache] To enable: npm install redis")
            isRedisAvailable = false
            return false
        }
        
        if (!redisClient) {
            const url = process.env.REDIS_URL || 
                       `redis://${DEFAULT_CONFIG.password ? `:${DEFAULT_CONFIG.password}@` : ''}${DEFAULT_CONFIG.host}:${DEFAULT_CONFIG.port}/${DEFAULT_CONFIG.db}`
            
            redisClient = redis.createClient({ 
                url,
                socket: {
                    connectTimeout: DEFAULT_CONFIG.connectTimeout,
                    reconnectStrategy: (retries: number) => Math.min(retries * 50, 500),
                }
            })

            redisClient.on('error', (err: Error) => {
                isRedisAvailable = false
                // Only log if Redis was previously working (unexpected disconnect)
                // Initial connection failures are silent since Redis is optional
                if (hasSuccessfullyConnected) {
                    console.warn("[RedisCache] Connection error:", err.message)
                }
            })

            redisClient.on('connect', () => {
                hasSuccessfullyConnected = true
                isRedisAvailable = true
                console.log("[RedisCache] ✅ Connected to Redis")
            })

            // Connect with timeout - failures are silent since Redis is optional
            await Promise.race([
                redisClient.connect(),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error("Redis connection timeout")), DEFAULT_CONFIG.connectTimeout)
                )
            ]).catch(() => {
                // Connection failed - that's ok, Redis is optional
                // Error handler and 'error' event will handle it silently
            })

            // Note: isRedisAvailable will be set by the 'connect' or 'error' event handlers
            if (isRedisAvailable) {
                console.log("[RedisCache] 🔗 Redis cache initialized")
            }
        }

        return isRedisAvailable
    } catch (error) {
        // Silently fail - Redis is optional
        isRedisAvailable = false
        redisClient = null
        return false
    }
}

/**
 * Compress data for storage (gzip if large)
 */
async function compressData(data: string): Promise<Buffer> {
    if (data.length < COMPRESSION_THRESHOLD) {
        return Buffer.from(data, 'utf-8')
    }

    try {
        const zlib = await import("zlib")
        const util = await import("util")
        const gzip = util.promisify(zlib.gzip)
        return await gzip(data)
    } catch (error) {
        console.warn("[RedisCache] Compression failed, storing uncompressed")
        return Buffer.from(data, 'utf-8')
    }
}

/**
 * Decompress data from storage
 */
async function decompressData(buffer: Buffer): Promise<string> {
    // Check if data looks like gzip (magic bytes 1f 8b)
    if (buffer[0] === 0x1f && buffer[1] === 0x8b) {
        try {
            const zlib = await import("zlib")
            const util = await import("util")
            const gunzip = util.promisify(zlib.gunzip)
            const decompressed = await gunzip(buffer)
            return decompressed.toString('utf-8')
        } catch (error) {
            console.warn("[RedisCache] Decompression failed")
            return buffer.toString('utf-8')
        }
    }

    return buffer.toString('utf-8')
}

/**
 * Generate cache key for a URL
 */
function getCacheKey(url: string): string {
    // Create deterministic hash of URL for key
    const hash = require('crypto')
        .createHash('sha256')
        .update(url)
        .digest('hex')
        .substring(0, 16)  // Use first 16 chars of hash
    
    return `${CACHE_KEY_PREFIX}${hash}`
}

/**
 * Get data from Redis cache
 */
export async function getFromRedisCache(url: string): Promise<ProductData | null> {
    if (!isRedisAvailable && !await initRedis() || !redisClient) {
        return null
    }

    try {
        const cacheKey = getCacheKey(url)
        
        // Set timeout for this operation
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Redis get timeout")), DEFAULT_CONFIG.commandTimeout)
        )

        const result = await Promise.race([
            redisClient.getBuffer(cacheKey),
            timeoutPromise
        ]) as Buffer | null

        if (!result) {
            return null
        }

        const decompressed = await decompressData(result)
        const cached = JSON.parse(decompressed) as CacheEntry
        
        // Check if entry is still valid (TTL)
        const age = (Date.now() - cached.timestamp) / 1000
        if (age > CACHE_TTL_SECONDS) {
            // Expired, delete it
            try {
                await redisClient.del(cacheKey)
            } catch (e) {
                // Ignore delete errors
            }
            return null
        }

        console.log(`[RedisCache] 🎯 Cache HIT for ${url} (from Redis, age: ${Math.round(age)}s)`)
        return cached.data
    } catch (error) {
        console.debug("[RedisCache] Get operation failed:", (error as Error).message)
        // Silently fail, will fall back to parsing
        return null
    }
}

/**
 * Save data to Redis cache
 */
export async function saveToRedisCache(url: string, data: ProductData): Promise<void> {
    if (!isRedisAvailable && !await initRedis() || !redisClient) {
        return  // Silently fail, in-memory cache is sufficient
    }

    try {
        const cacheKey = getCacheKey(url)
        const entry: CacheEntry = {
            data,
            timestamp: Date.now()
        }
        
        const jsonData = JSON.stringify(entry)
        const compressedData = await compressData(jsonData)

        // Set timeout for this operation
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Redis set timeout")), DEFAULT_CONFIG.commandTimeout)
        )

        await Promise.race([
            redisClient.setEx(cacheKey, CACHE_TTL_SECONDS, compressedData),
            timeoutPromise
        ])

        console.log(`[RedisCache] 💾 Cached to Redis: ${url}`)
    } catch (error) {
        console.debug("[RedisCache] Save operation failed:", (error as Error).message)
        // Silently fail, in-memory cache is sufficient
    }
}

/**
 * Clear all cache entries from Redis
 */
export async function clearRedisCache(): Promise<void> {
    if (!isRedisAvailable || !redisClient) {
        return
    }

    try {
        const pattern = `${CACHE_KEY_PREFIX}*`
        const keys = await redisClient.keys(pattern)
        
        if (keys.length > 0) {
            await redisClient.del(keys)
            console.log(`[RedisCache] 🗑️ Cleared ${keys.length} entries from Redis`)
        }
    } catch (error) {
        console.warn("[RedisCache] Clear operation failed:", (error as Error).message)
    }
}

/**
 * Get Redis connection stats
 */
export async function getRedisStats(): Promise<{
    connected: boolean
    info?: object
}> {
    if (!isRedisAvailable || !redisClient) {
        return { connected: false }
    }

    try {
        const info = await redisClient.info("stats")
        const lines = info.split("\r\n")
        const stats: any = {}
        
        lines.forEach((line: string) => {
            if (line && !line.startsWith("#")) {
                const [key, value] = line.split(":")
                stats[key] = value
            }
        })

        return {
            connected: true,
            info: stats
        }
    } catch (error) {
        return { connected: false }
    }
}

/**
 * Graceful shutdown
 */
export async function closeRedis(): Promise<void> {
    if (redisClient) {
        try {
            await redisClient.quit()
            console.log("[RedisCache] 🛑 Redis connection closed")
        } catch (error) {
            console.warn("[RedisCache] Error closing Redis:", (error as Error).message)
        }
        redisClient = null
        isRedisAvailable = false
    }
}

// Graceful shutdown on process exit
process.on('SIGINT', async () => {
    await closeRedis()
})

process.on('exit', () => {
    if (redisClient) {
        try {
            redisClient.quit()
        } catch (e) {
            // Ignore
        }
    }
})
