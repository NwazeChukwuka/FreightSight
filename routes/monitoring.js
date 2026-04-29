import express from 'express'
import monitoringService from '../services/monitoring.js'
import CacheService from '../services/cache.js'
import schedulerService from '../services/scheduler.js'
import { authMiddleware, roleMiddleware } from '../middleware/auth.js'
import { adminLimiter } from '../middleware/rateLimit.js'

const router = express.Router()

// Apply auth middleware to all routes
router.use(authMiddleware)

// Get system health status (admin only)
router.get('/health', roleMiddleware(['Admin']), async (req, res) => {
  try {
    const health = await monitoringService.getHealthStatus()
    res.json(health)
  } catch (error) {
    console.error('Health check error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get detailed metrics (admin only)
router.get('/metrics', roleMiddleware(['Admin']), adminLimiter, async (req, res) => {
  try {
    const metrics = monitoringService.getMetrics()
    res.json(metrics)
  } catch (error) {
    console.error('Metrics error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get performance report (admin only)
router.get('/report', roleMiddleware(['Admin']), adminLimiter, async (req, res) => {
  try {
    const report = monitoringService.generateReport()
    res.json(report)
  } catch (error) {
    console.error('Report generation error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get recent logs (admin only)
router.get('/logs', roleMiddleware(['Admin']), adminLimiter, async (req, res) => {
  try {
    const { level = 'error', limit = 50 } = req.query
    
    // Get logs from monitoring service
    const logs = level === 'error' 
      ? monitoringService.metrics.errors.slice(-limit)
      : [] // For other levels, we'd need to implement log storage
    
    res.json({
      level,
      logs,
      count: logs.length
    })
  } catch (error) {
    console.error('Logs retrieval error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Reset metrics (admin only)
router.post('/reset', roleMiddleware(['Admin']), adminLimiter, async (req, res) => {
  try {
    monitoringService.resetMetrics()
    res.json({ message: 'Metrics reset successfully' })
  } catch (error) {
    console.error('Metrics reset error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get cache statistics (admin only)
router.get('/cache', roleMiddleware(['Admin']), async (req, res) => {
  try {
    const cacheHealth = await CacheService.healthCheck()
    
    // Get additional cache stats if available
    const stats = {
      health: cacheHealth,
      timestamp: new Date().toISOString()
    }
    
    res.json(stats)
  } catch (error) {
    console.error('Cache stats error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get scheduler status (admin only)
router.get('/scheduler', roleMiddleware(['Admin']), async (req, res) => {
  try {
    const status = schedulerService.getStatus()
    res.json(status)
  } catch (error) {
    console.error('Scheduler status error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Trigger manual cleanup (admin only)
router.post('/cleanup', roleMiddleware(['Admin']), adminLimiter, async (req, res) => {
  try {
    monitoringService.cleanupOldLogs()
    
    // Clean up cache if needed
    const invalidatedKeys = await CacheService.invalidatePattern('temp:*')
    
    res.json({
      message: 'Cleanup completed',
      invalidatedCacheKeys: invalidatedKeys,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Cleanup error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get database statistics (admin only)
router.get('/database', roleMiddleware(['Admin']), async (req, res) => {
  try {
    // This would require MongoDB admin access
    // For now, return basic connection info
    const stats = {
      status: 'connected',
      timestamp: new Date().toISOString(),
      note: 'Detailed database statistics require MongoDB admin privileges'
    }
    
    res.json(stats)
  } catch (error) {
    console.error('Database stats error:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
