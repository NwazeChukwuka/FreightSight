import { createClient } from 'redis'

// Redis client configuration
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  retry_strategy: (options) => {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      console.error('Redis server connection refused')
      return new Error('Redis server connection refused')
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      console.error('Redis retry time exhausted')
      return new Error('Retry time exhausted')
    }
    if (options.attempt > 10) {
      console.error('Redis retry attempts exhausted')
      return undefined
    }
    return Math.min(options.attempt * 100, 3000)
  }
})

redisClient.on('error', (err) => console.log('Redis Client Error:', err))
redisClient.on('connect', () => console.log('Redis Client Connected'))
redisClient.on('ready', () => console.log('Redis Client Ready'))

// Initialize Redis connection
const initRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect()
  }
}

// Cache service
export class CacheService {
  static async get(key) {
    try {
      await initRedis()
      const value = await redisClient.get(key)
      return value ? JSON.parse(value) : null
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }

  static async set(key, value, ttl = 3600) {
    try {
      await initRedis()
      await redisClient.setEx(key, ttl, JSON.stringify(value))
      return true
    } catch (error) {
      console.error('Cache set error:', error)
      return false
    }
  }

  static async del(key) {
    try {
      await initRedis()
      await redisClient.del(key)
      return true
    } catch (error) {
      console.error('Cache delete error:', error)
      return false
    }
  }

  static async invalidatePattern(pattern) {
    try {
      await initRedis()
      const keys = await redisClient.keys(pattern)
      if (keys.length > 0) {
        await redisClient.del(keys)
      }
      return keys.length
    } catch (error) {
      console.error('Cache invalidate pattern error:', error)
      return 0
    }
  }

  // Parcel-specific caching
  static async getCachedParcel(trackingId) {
    return this.get(`parcel:${trackingId}`)
  }

  static async setCachedParcel(trackingId, parcelData, ttl = 1800) {
    return this.set(`parcel:${trackingId}`, parcelData, ttl)
  }

  static async invalidateParcel(trackingId) {
    return this.del(`parcel:${trackingId}`)
  }

  // User session caching
  static async getUserSession(userId) {
    return this.get(`session:${userId}`)
  }

  static async setUserSession(userId, sessionData, ttl = 7200) {
    return this.set(`session:${userId}`, sessionData, ttl)
  }

  static async invalidateUserSession(userId) {
    return this.del(`session:${userId}`)
  }

  // API response caching
  static async getCachedResponse(endpoint, params = '') {
    return this.get(`api:${endpoint}:${params}`)
  }

  static async setCachedResponse(endpoint, params, response, ttl = 300) {
    return this.set(`api:${endpoint}:${params}`, response, ttl)
  }

  // Analytics caching
  static async getCachedAnalytics(type, period) {
    return this.get(`analytics:${type}:${period}`)
  }

  static async setCachedAnalytics(type, period, data, ttl = 600) {
    return this.set(`analytics:${type}:${period}`, data, ttl)
  }

  // Rate limiting cache
  static async incrementRateLimit(key, ttl = 60) {
    try {
      await initRedis()
      const count = await redisClient.incr(key)
      if (count === 1) {
        await redisClient.expire(key, ttl)
      }
      return count
    } catch (error) {
      console.error('Rate limit increment error:', error)
      return 0
    }
  }

  // Health check
  static async healthCheck() {
    try {
      await initRedis()
      await redisClient.ping()
      return { status: 'healthy', message: 'Redis connection successful' }
    } catch (error) {
      return { status: 'unhealthy', message: error.message }
    }
  }

  // Close connection
  static async close() {
    if (redisClient.isOpen) {
      await redisClient.quit()
    }
  }
}

export default CacheService
