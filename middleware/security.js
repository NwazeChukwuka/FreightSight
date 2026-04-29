import helmet from 'helmet'
import { createClient } from 'redis'

// Redis client for security monitoring
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
})

redisClient.on('error', (err) => console.log('Redis Client Error:', err))

// Initialize Redis connection
const initRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect()
  }
}

// Security headers middleware
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "maps.googleapis.com"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://maps.googleapis.com"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
})

// IP blocking middleware
export const ipBlocker = async (req, res, next) => {
  await initRedis()
  
  const clientIP = req.ip || req.connection.remoteAddress
  const key = `blocked_ip:${clientIP}`
  
  try {
    const isBlocked = await redisClient.get(key)
    if (isBlocked) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Your IP has been temporarily blocked due to suspicious activity'
      })
    }
    next()
  } catch (error) {
    console.error('IP blocking error:', error)
    next() // Continue if Redis fails
  }
}

// Suspicious activity detector
export const detectSuspiciousActivity = async (req, res, next) => {
  await initRedis()
  
  const clientIP = req.ip || req.connection.remoteAddress
  const endpoint = req.path
  const key = `activity:${clientIP}:${endpoint}`
  
  try {
    const requests = await redisClient.incr(key)
    await redisClient.expire(key, 300) // 5 minute window
    
    // Block if too many requests to sensitive endpoints
    if ((endpoint.includes('/auth/') || endpoint.includes('/admin/')) && requests > 10) {
      await redisClient.setEx(`blocked_ip:${clientIP}`, 3600, 'true') // Block for 1 hour
      return res.status(429).json({
        error: 'Too many requests',
        message: 'Your IP has been temporarily blocked'
      })
    }
    
    next()
  } catch (error) {
    console.error('Activity detection error:', error)
    next()
  }
}

// Request logger for audit trail
export const auditLogger = async (req, res, next) => {
  const startTime = Date.now()
  
  // Log request on completion
  res.on('finish', async () => {
    await initRedis()
    
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      statusCode: res.statusCode,
      responseTime: Date.now() - startTime,
      userId: req.user?.id || 'anonymous',
      role: req.user?.role || 'none'
    }
    
    try {
      // Store in Redis for recent logs (last 1000)
      await redisClient.lPush('audit_logs', JSON.stringify(logData))
      await redisClient.lTrim('audit_logs', 0, 999)
      
      // Also log to console for development
      if (process.env.NODE_ENV === 'development') {
        console.log('AUDIT:', logData)
      }
    } catch (error) {
      console.error('Audit logging error:', error)
    }
  })
  
  next()
}

// Input sanitization
export const sanitizeInput = (req, res, next) => {
  // Remove potential XSS from string inputs
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str
    return str
      .replace(/[<>]/g, '') // Remove < and >
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim()
  }
  
  const sanitizeObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj
    
    const sanitized = {}
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = sanitizeString(value)
      } else if (typeof value === 'object') {
        sanitized[key] = sanitizeObject(value)
      } else {
        sanitized[key] = value
      }
    }
    return sanitized
  }
  
  if (req.body) {
    req.body = sanitizeObject(req.body)
  }
  
  if (req.query) {
    req.query = sanitizeObject(req.query)
  }
  
  next()
}
