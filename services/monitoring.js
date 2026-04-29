import fs from 'fs'
import path from 'path'
import CacheService from './cache.js'

class MonitoringService {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        success: 0,
        error: 0,
        rateLimit: 0
      },
      parcels: {
        created: 0,
        updated: 0,
        searched: 0
      },
      scheduledUpdates: {
        created: 0,
        executed: 0,
        failed: 0
      },
      performance: {
        avgResponseTime: 0,
        slowQueries: 0,
        cacheHitRate: 0
      },
      errors: []
    }
    this.startTime = Date.now()
  }

  // Log request metrics
  logRequest(req, res, responseTime) {
    this.metrics.requests.total++
    
    if (res.statusCode >= 200 && res.statusCode < 300) {
      this.metrics.requests.success++
    } else if (res.statusCode === 429) {
      this.metrics.requests.rateLimit++
    } else {
      this.metrics.requests.error++
    }

    // Update performance metrics
    this.updatePerformanceMetrics(responseTime, req.url)
  }

  // Log parcel operations
  logParcelOperation(operation, trackingId, userId) {
    this.metrics.parcels[operation] = (this.metrics.parcels[operation] || 0) + 1
    
    this.logEvent('parcel_operation', {
      operation,
      trackingId,
      userId,
      timestamp: new Date().toISOString()
    })
  }

  // Log scheduled update operations
  logScheduledUpdate(operation, updateId, trackingId, success = true) {
    if (operation === 'executed') {
      if (success) {
        this.metrics.scheduledUpdates.executed++
      } else {
        this.metrics.scheduledUpdates.failed++
      }
    } else if (operation === 'created') {
      this.metrics.scheduledUpdates.created++
    }

    this.logEvent('scheduled_update', {
      operation,
      updateId,
      trackingId,
      success,
      timestamp: new Date().toISOString()
    })
  }

  // Log errors
  logError(error, context = {}) {
    const errorLog = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      level: 'error'
    }

    this.metrics.errors.push(errorLog)

    // Keep only last 100 errors in memory
    if (this.metrics.errors.length > 100) {
      this.metrics.errors = this.metrics.errors.slice(-100)
    }

    // Log to file
    this.writeToLog('error', errorLog)
  }

  // Log warnings
  logWarning(message, context = {}) {
    const warningLog = {
      message,
      context,
      timestamp: new Date().toISOString(),
      level: 'warning'
    }

    this.writeToLog('warning', warningLog)
  }

  // Log info events
  logEvent(type, data) {
    const eventLog = {
      type,
      data,
      timestamp: new Date().toISOString(),
      level: 'info'
    }

    this.writeToLog('info', eventLog)
  }

  // Update performance metrics
  updatePerformanceMetrics(responseTime, url) {
    // Calculate rolling average response time
    const totalRequests = this.metrics.requests.total
    const currentAvg = this.metrics.performance.avgResponseTime
    this.metrics.performance.avgResponseTime = 
      (currentAvg * (totalRequests - 1) + responseTime) / totalRequests

    // Track slow queries (> 2 seconds)
    if (responseTime > 2000) {
      this.metrics.performance.slowQueries++
      this.logWarning('Slow request detected', {
        url,
        responseTime,
        threshold: 2000
      })
    }
  }

  // Get system health
  async getHealthStatus() {
    try {
      const uptime = Date.now() - this.startTime
      const memoryUsage = process.memoryUsage()
      const cacheHealth = await CacheService.healthCheck()

      return {
        status: 'healthy',
        uptime,
        memory: {
          rss: memoryUsage.rss,
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          external: memoryUsage.external
        },
        cache: cacheHealth,
        metrics: this.metrics,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      this.logError(error, { context: 'health_check' })
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      }
    }
  }

  // Get detailed metrics
  getMetrics() {
    const uptime = Date.now() - this.startTime
    const requestsPerSecond = this.metrics.requests.total / (uptime / 1000)
    const errorRate = this.metrics.requests.total > 0 
      ? (this.metrics.requests.error / this.metrics.requests.total) * 100 
      : 0

    return {
      uptime,
      requestsPerSecond: requestsPerSecond.toFixed(2),
      errorRate: errorRate.toFixed(2),
      ...this.metrics
    }
  }

  // Write logs to file
  writeToLog(level, data) {
    try {
      const logDir = path.join(process.cwd(), 'logs')
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true })
      }

      const logFile = path.join(logDir, `${level}.log`)
      const logLine = JSON.stringify(data) + '\n'
      
      fs.appendFileSync(logFile, logLine)
    } catch (error) {
      console.error('Failed to write to log file:', error)
    }
  }

  // Clean up old log files (older than 7 days)
  cleanupOldLogs() {
    try {
      const logDir = path.join(process.cwd(), 'logs')
      if (!fs.existsSync(logDir)) return

      const files = fs.readdirSync(logDir)
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)

      files.forEach(file => {
        const filePath = path.join(logDir, file)
        const stats = fs.statSync(filePath)
        
        if (stats.mtime.getTime() < sevenDaysAgo) {
          fs.unlinkSync(filePath)
          console.log(`Deleted old log file: ${file}`)
        }
      })
    } catch (error) {
      this.logError(error, { context: 'log_cleanup' })
    }
  }

  // Generate performance report
  generateReport() {
    const metrics = this.getMetrics()
    const uptimeHours = Math.floor(metrics.uptime / (1000 * 60 * 60))

    return {
      summary: {
        uptime: `${uptimeHours}h`,
        totalRequests: metrics.requests.total,
        requestsPerSecond: metrics.requestsPerSecond,
        errorRate: `${metrics.errorRate}%`,
        avgResponseTime: `${metrics.performance.avgResponseTime.toFixed(0)}ms`
      },
      requests: {
        total: metrics.requests.total,
        success: metrics.requests.success,
        error: metrics.requests.error,
        rateLimit: metrics.requests.rateLimit
      },
      parcels: metrics.parcels,
      scheduledUpdates: metrics.scheduledUpdates,
      performance: {
        avgResponseTime: metrics.performance.avgResponseTime,
        slowQueries: metrics.performance.slowQueries,
        cacheHitRate: metrics.performance.cacheHitRate
      },
      recentErrors: metrics.errors.slice(-10),
      generatedAt: new Date().toISOString()
    }
  }

  // Reset metrics (useful for testing or periodic reset)
  resetMetrics() {
    this.metrics = {
      requests: {
        total: 0,
        success: 0,
        error: 0,
        rateLimit: 0
      },
      parcels: {
        created: 0,
        updated: 0,
        searched: 0
      },
      scheduledUpdates: {
        created: 0,
        executed: 0,
        failed: 0
      },
      performance: {
        avgResponseTime: 0,
        slowQueries: 0,
        cacheHitRate: 0
      },
      errors: []
    }
    this.startTime = Date.now()
  }
}

// Create singleton instance
const monitoringService = new MonitoringService()

export default monitoringService
