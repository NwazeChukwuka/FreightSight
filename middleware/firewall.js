import rateLimit from "express-rate-limit"
import helmet from "helmet"
import { Request, Response, NextFunction } from "express"
import { performance } from "perf_hooks"
import fs from "fs"
import path from "path"

// Enhanced security headers
export const enhancedSecurityHeaders = (req, res, next) => {
  // Basic Helmet protection
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        scriptSrc: ["'self'", "'unsafe-eval'", "https://www.googletagmanager.com"],
        imgSrc: ["'self'", "data:", "https:", "https://maps.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        connectSrc: ["'self'", "https://api.freightsight.com", "wss://api.freightsight.com"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        manifestSrc: ["'self'"],
        workerSrc: ["'self'", "blob:"]
      }
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    noSniff: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    permittedCrossDomainPolicies: false,
    xssFilter: true
  })(req, res, next)
}

// Advanced rate limiting with dynamic limits
export const createAdvancedRateLimiter = (options = {}) => {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutes
    max: options.max || 100, // Limit each IP to 100 requests per windowMs
    message: {
      error: "Too many requests from this IP, please try again later.",
      retryAfter: Math.ceil(options.windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      // Use IP + User-Agent for more accurate limiting
      return `${req.ip}:${req.get('User-Agent')}`
    },
    skip: (req) => {
      // Skip rate limiting for trusted IPs
      const trustedIPs = process.env.TRUSTED_IPS?.split(',') || []
      return trustedIPs.includes(req.ip)
    },
    onLimitReached: (req, res, options) => {
      console.warn(`🚨 Rate limit exceeded for IP: ${req.ip}, User-Agent: ${req.get('User-Agent')}`)
      
      // Log to audit file
      const auditLog = {
        timestamp: new Date().toISOString(),
        type: 'RATE_LIMIT_EXCEEDED',
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method,
        headers: req.headers
      }
      
      fs.appendFile(
        path.join(process.cwd(), 'logs', 'security.log'),
        JSON.stringify(auditLog) + '\n',
        (err) => {
          if (err) console.error('Failed to write security log:', err)
        }
      )
    }
  })
}

// IP whitelist/blacklist middleware
export const ipFilter = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress
  
  // Check blacklist
  const blacklistedIPs = process.env.BLACKLISTED_IPS?.split(',') || []
  if (blacklistedIPs.includes(clientIP)) {
    console.warn(`🚫 Blacklisted IP attempted access: ${clientIP}`)
    return res.status(403).json({ error: 'Access denied' })
  }
  
  // Check whitelist (if configured)
  const whitelistedIPs = process.env.WHITELISTED_IPS?.split(',') || []
  if (whitelistedIPs.length > 0 && !whitelistedIPs.includes(clientIP)) {
    console.warn(`🚫 Non-whitelisted IP attempted access: ${clientIP}`)
    return res.status(403).json({ error: 'Access denied' })
  }
  
  next()
}

// Geographic IP filtering
export const geoIPFilter = async (req, res, next) => {
  try {
    const clientIP = req.ip || req.connection.remoteAddress
    const allowedCountries = process.env.ALLOWED_COUNTRIES?.split(',') || []
    const blockedCountries = process.env.BLOCKED_COUNTRIES?.split(',') || []
    
    if (allowedCountries.length > 0 || blockedCountries.length > 0) {
      // Simple IP geolocation (in production, use a proper GeoIP database)
      // This is a placeholder - implement with MaxMind GeoIP2 or similar
      const geoData = await getGeoIPData(clientIP)
      
      if (geoData && geoData.country) {
        if (allowedCountries.length > 0 && !allowedCountries.includes(geoData.country)) {
          console.warn(`🌍 Blocked country access: ${geoData.country} from IP: ${clientIP}`)
          return res.status(403).json({ error: 'Access denied from your location' })
        }
        
        if (blockedCountries.includes(geoData.country)) {
          console.warn(`🌍 Blocked country access: ${geoData.country} from IP: ${clientIP}`)
          return res.status(403).json({ error: 'Access denied from your location' })
        }
      }
    }
    
    next()
  } catch (error) {
    console.error('GeoIP filter error:', error)
    next() // Allow request on error
  }
}

// Placeholder for GeoIP data - implement with proper service
async function getGeoIPData(ip) {
  // In production, implement with:
  // - MaxMind GeoIP2 database
  // - IP-API service
  // - GeoJS.io service
  // - Or similar
  
  // For now, return null to allow all requests
  return null
}

// Request size and content validation
export const requestValidator = (req, res, next) => {
  const contentLength = parseInt(req.get('Content-Length') || '0')
  const maxRequestSize = parseInt(process.env.MAX_REQUEST_SIZE) || 10 * 1024 * 1024 // 10MB
  
  if (contentLength > maxRequestSize) {
    return res.status(413).json({ 
      error: 'Request too large',
      maxSize: `${maxRequestSize / 1024 / 1024}MB`
    })
  }
  
  // Validate content type for POST/PUT requests
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.get('Content-Type')
    const allowedTypes = [
      'application/json',
      'application/x-www-form-urlencoded',
      'multipart/form-data'
    ]
    
    if (!allowedTypes.some(type => contentType?.startsWith(type))) {
      return res.status(415).json({ error: 'Unsupported Media Type' })
    }
  }
  
  next()
}

// Suspicious activity detection
export const suspiciousActivityDetector = (req, res, next) => {
  const suspiciousPatterns = [
    /\.\./,  // Path traversal
    /<script/i,  // XSS attempts
    /union.*select/i,  // SQL injection attempts
    /javascript:/i,  // JavaScript protocol
    /data:.*base64/i,  // Base64 data URLs
    /eval\(/i,  // eval() attempts
    /exec\(/i,  // exec() attempts
  ]
  
  const checkValue = (value) => {
    if (typeof value === 'string') {
      return suspiciousPatterns.some(pattern => pattern.test(value))
    }
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(v => checkValue(v))
    }
    return false
  }
  
  // Check query parameters
  if (checkValue(req.query)) {
    console.warn(`🚨 Suspicious query parameters detected from IP: ${req.ip}`)
    return res.status(400).json({ error: 'Invalid request parameters' })
  }
  
  // Check request body
  if (checkValue(req.body)) {
    console.warn(`🚨 Suspicious request body detected from IP: ${req.ip}`)
    return res.status(400).json({ error: 'Invalid request body' })
  }
  
  // Check headers
  if (checkValue(req.headers)) {
    console.warn(`🚨 Suspicious headers detected from IP: ${req.ip}`)
    return res.status(400).json({ error: 'Invalid request headers' })
  }
  
  next()
}

// API key validation for sensitive endpoints
export const apiKeyValidator = (req, res, next) => {
  const apiKey = req.get('X-API-Key')
  const validApiKeys = process.env.VALID_API_KEYS?.split(',') || []
  
  // Skip validation for non-sensitive endpoints
  const publicPaths = ['/api/health', '/api/auth/login', '/api/auth/register']
  if (publicPaths.some(path => req.path.startsWith(path))) {
    return next()
  }
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' })
  }
  
  if (!validApiKeys.includes(apiKey)) {
    console.warn(`🚫 Invalid API key used from IP: ${req.ip}`)
    return res.status(401).json({ error: 'Invalid API key' })
  }
  
  next()
}

// Request timeout middleware
export const requestTimeout = (timeout = 30000) => {
  return (req, res, next) => {
    const start = performance.now()
    
    const timeoutId = setTimeout(() => {
      if (!res.headersSent) {
        console.warn(`⏰ Request timeout for ${req.method} ${req.path} from IP: ${req.ip}`)
        res.status(408).json({ error: 'Request timeout' })
      }
    }, timeout)
    
    res.on('finish', () => {
      clearTimeout(timeoutId)
      const duration = performance.now() - start
      
      // Log slow requests
      if (duration > 5000) {
        console.warn(`🐌 Slow request: ${req.method} ${req.path} took ${duration.toFixed(2)}ms from IP: ${req.ip}`)
      }
    })
    
    next()
  }
}

// CORS with strict validation
export const strictCORS = (req, res, next) => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || []
  const origin = req.get('Origin')
  
  if (allowedOrigins.length > 0) {
    if (!origin || !allowedOrigins.includes(origin)) {
      console.warn(`🚫 CORS violation: Origin ${origin} not allowed from IP: ${req.ip}`)
      return res.status(403).json({ error: 'CORS policy violation' })
    }
    
    res.setHeader('Access-Control-Allow-Origin', origin)
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Max-Age', '86400')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  next()
}

// Bot detection middleware
export const botDetector = (req, res, next) => {
  const userAgent = req.get('User-Agent') || ''
  const suspiciousBots = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /java/i,
    /perl/i,
    /php/i,
    /ruby/i,
    /go/i,
    /node/i
  ]
  
  const isBot = suspiciousBots.some(pattern => pattern.test(userAgent))
  
  if (isBot) {
    console.warn(`🤖 Bot detected: ${userAgent} from IP: ${req.ip}`)
    
    // Allow legitimate bots (Googlebot, Bingbot, etc.)
    const legitimateBots = [
      /googlebot/i,
      /bingbot/i,
      /slurp/i,  // Yahoo
      /duckduckbot/i,
      /baiduspider/i
    ]
    
    const isLegitimateBot = legitimateBots.some(pattern => pattern.test(userAgent))
    
    if (!isLegitimateBot) {
      // Rate limit bots more strictly
      req.isBot = true
      req.botRateLimit = 10 // 10 requests per window
    }
  }
  
  next()
}

// Export all security middleware
export const securityMiddleware = [
  enhancedSecurityHeaders,
  ipFilter,
  geoIPFilter,
  requestValidator,
  suspiciousActivityDetector,
  botDetector,
  requestTimeout(),
  strictCORS
]

// Export individual middleware for specific use
export {
  createAdvancedRateLimiter,
  enhancedSecurityHeaders,
  ipFilter,
  geoIPFilter,
  requestValidator,
  suspiciousActivityDetector,
  apiKeyValidator,
  requestTimeout,
  strictCORS,
  botDetector
}
