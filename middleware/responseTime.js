import monitoringService from '../services/monitoring.js'

// Middleware to track response time for all requests
export const responseTimeTracker = (req, res, next) => {
  const startTime = Date.now()

  // Override res.end to capture response time
  const originalEnd = res.end
  res.end = function(...args) {
    const responseTime = Date.now() - startTime
    
    // Log to monitoring service
    monitoringService.logRequest(req, res, responseTime)
    
    // Call original end
    originalEnd.apply(this, args)
  }

  next()
}

// Middleware to add response time header
export const addResponseTimeHeader = (req, res, next) => {
  const startTime = Date.now()

  res.on('finish', () => {
    const responseTime = Date.now() - startTime
    res.set('X-Response-Time', `${responseTime}ms`)
  })

  next()
}

// Middleware to log slow queries
export const slowQueryLogger = (threshold = 1000) => {
  return (req, res, next) => {
    const startTime = Date.now()

    res.on('finish', () => {
      const responseTime = Date.now() - startTime
      
      if (responseTime > threshold) {
        monitoringService.logWarning('Slow request detected', {
          url: req.url,
          method: req.method,
          responseTime,
          threshold,
          userAgent: req.get('User-Agent'),
          ip: req.ip
        })
      }
    })

    next()
  }
}
