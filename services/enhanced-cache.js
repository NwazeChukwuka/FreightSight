import Redis from "redis"
import { performance } from "perf_hooks"
import { productionConfig } from "../config/production.js"

class EnhancedCacheService {
  constructor() {
    this.redis = null
    this.cluster = null
    this.localCache = new Map()
    this.cacheStats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      avgResponseTime: 0,
      totalResponseTime: 0
    }
    this.compressionEnabled = productionConfig.cache.compression
    this.defaultTtl = productionConfig.cache.defaultTtl
    this.maxSize = productionConfig.cache.maxSize
    this.strategy = productionConfig.cache.strategy
    this.warmupQueries = []
    this.cacheTags = new Map() // For cache invalidation by tags
  }

  async initialize() {
    try {
      console.log("🔧 Initializing enhanced cache service...")
      
      // Connect to Redis cluster or single instance
      if (productionConfig.redis.clusterNodes.length > 0) {
        await this.connectToCluster()
      } else {
        await this.connectToSingle()
      }
      
      // Start cache warming
      await this.warmupCache()
      
      // Start cache monitoring
      this.startMonitoring()
      
      // Setup cache cleanup
      this.startCleanup()
      
      console.log("✅ Enhanced cache service initialized")
    } catch (error) {
      console.error("❌ Failed to initialize enhanced cache service:", error)
      throw error
    }
  }

  async connectToCluster() {
    try {
      this.cluster = new Redis.Cluster(productionConfig.redis.clusterNodes, {
        redisOptions: {
          password: productionConfig.redis.password,
          ...productionConfig.redis.options
        }
      })

      this.cluster.on('connect', () => {
        console.log("✅ Connected to Redis cluster")
      })

      this.cluster.on('error', (error) => {
        console.error("❌ Redis cluster error:", error)
        this.cacheStats.errors++
      })

      this.cluster.on('node:error', (error, node) => {
        console.error(`❌ Redis node error (${node.options.host}:${node.options.port}):`, error)
      })

      // Test connection
      await this.cluster.ping()
      console.log("✅ Redis cluster connection verified")
    } catch (error) {
      console.error("❌ Failed to connect to Redis cluster:", error)
      throw error
    }
  }

  async connectToSingle() {
    try {
      this.redis = new Redis({
        url: productionConfig.redis.url,
        password: productionConfig.redis.password,
        ...productionConfig.redis.options
      })

      this.redis.on('connect', () => {
        console.log("✅ Connected to Redis")
      })

      this.redis.on('error', (error) => {
        console.error("❌ Redis error:", error)
        this.cacheStats.errors++
      })

      // Test connection
      await this.redis.ping()
      console.log("✅ Redis connection verified")
    } catch (error) {
      console.error("❌ Failed to connect to Redis:", error)
      throw error
    }
  }

  // Enhanced get with multi-level caching
  async get(key, options = {}) {
    const startTime = performance.now()
    
    try {
      let value = null
      let source = 'miss'

      // Level 1: Local cache (fastest)
      if (this.strategy === 'lru' || options.useLocal) {
        value = this.getFromLocal(key)
        if (value !== null) {
          source = 'local'
          this.cacheStats.hits++
        }
      }

      // Level 2: Redis cache
      if (value === null) {
        value = await this.getFromRedis(key)
        if (value !== null) {
          source = 'redis'
          this.cacheStats.hits++
          
          // Update local cache
          if (this.strategy === 'lru') {
            this.setToLocal(key, value, options.ttl)
          }
        }
      }

      // Level 3: Cache miss
      if (value === null) {
        this.cacheStats.misses++
        
        // Try to fetch from data source if fetch function provided
        if (options.fetch) {
          value = await options.fetch(key)
          if (value !== null) {
            await this.set(key, value, options)
            source = 'fetch'
          }
        }
      }

      const responseTime = performance.now() - startTime
      this.updateResponseTime(responseTime)

      return {
        value,
        source,
        responseTime: `${responseTime.toFixed(2)}ms`,
        cached: source !== 'fetch'
      }
    } catch (error) {
      console.error(`❌ Cache get error for key ${key}:`, error)
      this.cacheStats.errors++
      throw error
    }
  }

  // Enhanced set with tagging and compression
  async set(key, value, options = {}) {
    const startTime = performance.now()
    
    try {
      const ttl = options.ttl || this.defaultTtl
      const tags = options.tags || []
      const compressed = this.compressionEnabled && options.compress !== false

      // Prepare data
      let data = {
        value,
        timestamp: Date.now(),
        tags,
        compressed
      }

      // Compress if enabled
      if (compressed) {
        data.value = await this.compressData(value)
      }

      // Set in Redis
      await this.setToRedis(key, data, ttl)

      // Set in local cache
      if (this.strategy === 'lru') {
        this.setToLocal(key, value, ttl)
      }

      // Update tags
      tags.forEach(tag => {
        if (!this.cacheTags.has(tag)) {
          this.cacheTags.set(tag, new Set())
        }
        this.cacheTags.get(tag).add(key)
      })

      this.cacheStats.sets++
      
      const responseTime = performance.now() - startTime
      this.updateResponseTime(responseTime)

      return {
        success: true,
        responseTime: `${responseTime.toFixed(2)}ms`,
        compressed,
        ttl
      }
    } catch (error) {
      console.error(`❌ Cache set error for key ${key}:`, error)
      this.cacheStats.errors++
      throw error
    }
  }

  // Delete with tag support
  async delete(key) {
    try {
      // Remove from Redis
      if (this.cluster) {
        await this.cluster.del(key)
      } else if (this.redis) {
        await this.redis.del(key)
      }

      // Remove from local cache
      this.localCache.delete(key)

      // Remove from tags
      this.removeFromTags(key)

      this.cacheStats.deletes++
      
      return { success: true }
    } catch (error) {
      console.error(`❌ Cache delete error for key ${key}:`, error)
      this.cacheStats.errors++
      throw error
    }
  }

  // Invalidate by tags
  async invalidateByTag(tag) {
    try {
      const keys = this.cacheTags.get(tag)
      if (!keys || keys.size === 0) {
        return { deleted: 0 }
      }

      const deletePromises = []
      
      for (const key of keys) {
        deletePromises.push(this.delete(key))
      }

      await Promise.all(deletePromises)
      
      this.cacheTags.delete(tag)
      
      return { deleted: keys.size }
    } catch (error) {
      console.error(`❌ Cache invalidation error for tag ${tag}:`, error)
      throw error
    }
  }

  // Local cache operations
  getFromLocal(key) {
    const item = this.localCache.get(key)
    if (!item) return null

    // Check TTL
    if (item.expires && Date.now() > item.expires) {
      this.localCache.delete(key)
      return null
    }

    // Update LRU order
    this.localCache.delete(key)
    this.localCache.set(key, item)
    
    return item.value
  }

  setToLocal(key, value, ttl) {
    // Check size limit
    if (this.localCache.size >= this.maxSize) {
      this.evictLRU()
    }

    const item = {
      value,
      expires: ttl ? Date.now() + (ttl * 1000) : null,
      accessed: Date.now()
    }

    this.localCache.set(key, item)
  }

  evictLRU() {
    if (this.localCache.size === 0) return

    let oldestKey = null
    let oldestTime = Date.now()

    for (const [key, item] of this.localCache) {
      if (item.accessed < oldestTime) {
        oldestTime = item.accessed
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.localCache.delete(oldestKey)
    }
  }

  // Redis operations
  async getFromRedis(key) {
    try {
      let data
      if (this.cluster) {
        data = await this.cluster.get(key)
      } else if (this.redis) {
        data = await this.redis.get(key)
      }

      if (!data) return null

      const parsed = JSON.parse(data)
      
      // Decompress if needed
      if (parsed.compressed) {
        parsed.value = await this.decompressData(parsed.value)
      }

      return parsed.value
    } catch (error) {
      console.error(`❌ Redis get error for key ${key}:`, error)
      return null
    }
  }

  async setToRedis(key, data, ttl) {
    try {
      const serialized = JSON.stringify(data)
      
      if (this.cluster) {
        await this.cluster.setex(key, ttl, serialized)
      } else if (this.redis) {
        await this.redis.setex(key, ttl, serialized)
      }
    } catch (error) {
      console.error(`❌ Redis set error for key ${key}:`, error)
      throw error
    }
  }

  // Compression utilities
  async compressData(data) {
    const zlib = require('zlib')
    const jsonString = JSON.stringify(data)
    return zlib.deflateSync(jsonString).toString('base64')
  }

  async decompressData(compressedData) {
    const zlib = require('zlib')
    const buffer = Buffer.from(compressedData, 'base64')
    const decompressed = zlib.inflateSync(buffer)
    return JSON.parse(decompressed.toString())
  }

  // Cache warming
  async warmupCache() {
    console.log("🔥 Warming up cache...")
    
    const warmupQueries = [
      { key: 'stats:dashboard', fetch: () => this.getDashboardStats(), ttl: 300 },
      { key: 'parcels:active', fetch: () => this.getActiveParcels(), ttl: 60 },
      { key: 'users:online', fetch: () => this.getOnlineUsers(), ttl: 30 },
      { key: 'system:health', fetch: () => this.getSystemHealth(), ttl: 60 }
    ]

    for (const query of warmupQueries) {
      try {
        await this.set(query.key, await query.fetch(), { ttl: query.ttl })
        console.log(`🔥 Warmed up cache: ${query.key}`)
      } catch (error) {
        console.error(`❌ Failed to warm up cache for ${query.key}:`, error)
      }
    }
    
    console.log("✅ Cache warming completed")
  }

  // Mock data fetchers (replace with actual implementations)
  async getDashboardStats() {
    return { activeParcels: 150, deliveredParcels: 1200, delayedParcels: 5 }
  }

  async getActiveParcels() {
    return [{ trackingId: 'TRK001', status: 'In Transit' }]
  }

  async getOnlineUsers() {
    return { count: 45, users: [] }
  }

  async getSystemHealth() {
    return { status: 'healthy', cpu: 45, memory: 67 }
  }

  // Monitoring
  startMonitoring() {
    setInterval(() => {
      this.logMetrics()
    }, 60000) // Log metrics every minute
  }

  logMetrics() {
    const hitRate = this.cacheStats.hits + this.cacheStats.misses > 0 
      ? (this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses)) * 100 
      : 0

    console.log(`📊 Cache Metrics: Hit Rate: ${hitRate.toFixed(2)}%, Hits: ${this.cacheStats.hits}, Misses: ${this.cacheStats.misses}, Sets: ${this.cacheStats.sets}, Errors: ${this.cacheStats.errors}`)
  }

  updateResponseTime(responseTime) {
    this.cacheStats.totalResponseTime += responseTime
    this.cacheStats.avgResponseTime = this.cacheStats.totalResponseTime / (this.cacheStats.hits + this.cacheStats.misses + this.cacheStats.sets)
  }

  // Cleanup
  startCleanup() {
    setInterval(() => {
      this.cleanupExpired()
    }, 300000) // Cleanup every 5 minutes
  }

  cleanupExpired() {
    const now = Date.now()
    let cleaned = 0

    for (const [key, item] of this.localCache) {
      if (item.expires && now > item.expires) {
        this.localCache.delete(key)
        cleaned++
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} expired cache entries`)
    }
  }

  removeFromTags(key) {
    for (const [tag, keys] of this.cacheTags) {
      keys.delete(key)
      if (keys.size === 0) {
        this.cacheTags.delete(tag)
      }
    }
  }

  // Advanced operations
  async mget(keys) {
    const results = {}
    
    for (const key of keys) {
      try {
        const result = await this.get(key)
        results[key] = result
      } catch (error) {
        results[key] = { error: error.message }
      }
    }
    
    return results
  }

  async mset(keyValuePairs, options = {}) {
    const results = {}
    
    for (const [key, value] of keyValuePairs) {
      try {
        const result = await this.set(key, value, options)
        results[key] = result
      } catch (error) {
        results[key] = { error: error.message }
      }
    }
    
    return results
  }

  async increment(key, amount = 1, options = {}) {
    try {
      let result
      
      if (this.cluster) {
        result = await this.cluster.incrby(key, amount)
      } else if (this.redis) {
        result = await this.redis.incrby(key, amount)
      }
      
      // Set TTL if provided
      if (options.ttl) {
        if (this.cluster) {
          await this.cluster.expire(key, options.ttl)
        } else if (this.redis) {
          await this.redis.expire(key, options.ttl)
        }
      }
      
      return { value: result }
    } catch (error) {
      console.error(`❌ Cache increment error for key ${key}:`, error)
      throw error
    }
  }

  // Get comprehensive statistics
  getStats() {
    const hitRate = this.cacheStats.hits + this.cacheStats.misses > 0 
      ? (this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses)) * 100 
      : 0

    return {
      ...this.cacheStats,
      hitRate: `${hitRate.toFixed(2)}%`,
      localCacheSize: this.localCache.size,
      tagCount: this.cacheTags.size,
      strategy: this.strategy,
      compression: this.compressionEnabled,
      redis: {
        connected: !!(this.redis || this.cluster),
        cluster: !!this.cluster,
        nodes: this.cluster ? this.cluster.nodes().length : 1
      }
    }
  }

  // Health check
  async healthCheck() {
    try {
      let redisHealth = { status: 'disconnected' }
      
      if (this.redis) {
        await this.redis.ping()
        redisHealth = { status: 'connected' }
      } else if (this.cluster) {
        await this.cluster.ping()
        redisHealth = { 
          status: 'connected',
          nodes: this.cluster.nodes().length
        }
      }

      return {
        status: redisHealth.status === 'connected' ? 'healthy' : 'degraded',
        redis: redisHealth,
        local: {
          size: this.localCache.size,
          maxSize: this.maxSize,
          utilization: `${((this.localCache.size / this.maxSize) * 100).toFixed(2)}%`
        },
        stats: this.getStats()
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      }
    }
  }

  // Close connections
  async close() {
    console.log("🔄 Closing cache connections...")
    
    if (this.redis) {
      await this.redis.quit()
    }
    
    if (this.cluster) {
      await this.cluster.quit()
    }
    
    this.localCache.clear()
    this.cacheTags.clear()
    
    console.log("✅ Cache connections closed")
  }
}

// Singleton instance
const enhancedCacheService = new EnhancedCacheService()

export default enhancedCacheService
