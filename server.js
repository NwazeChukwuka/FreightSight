import express from "express"
import mongoose from "mongoose"
import cors from "cors"
import dotenv from "dotenv"
import authRoutes from "./routes/auth.js"
import parcelRoutes from "./routes/parcels.js"
import adminRoutes from "./routes/admin.js"
import scheduledUpdatesRoutes from "./routes/scheduled-updates.js"
import monitoringRoutes from "./routes/monitoring.js"
import { authMiddleware } from "./middleware/auth.js"
import { securityHeaders, ipBlocker, detectSuspiciousActivity, auditLogger, sanitizeInput } from "./middleware/security.js"
import { apiLimiter, authLimiter, adminLimiter } from "./middleware/rateLimit.js"
import { responseTimeTracker, addResponseTimeHeader, slowQueryLogger } from "./middleware/responseTime.js"
import schedulerService from "./services/scheduler.js"
import CacheService from "./services/cache.js"

dotenv.config()

const app = express()

// Security middleware
app.use(securityHeaders)
app.use(ipBlocker)
app.use(detectSuspiciousActivity)
app.use(auditLogger)
app.use(sanitizeInput)

// Performance monitoring
app.use(responseTimeTracker)
app.use(addResponseTimeHeader)
app.use(slowQueryLogger(1000)) // Log requests over 1 second

// Rate limiting
app.use('/api', apiLimiter)
app.use('/api/auth', authLimiter)

// Basic middleware
app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Database Connection
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/freightsight")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB connection error:", err))

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/parcels", authMiddleware, parcelRoutes)
app.use("/api/admin", authMiddleware, adminRoutes)
app.use("/api/scheduled-updates", scheduledUpdatesRoutes)
app.use("/api/monitoring", monitoringRoutes)

// Health check with enterprise monitoring
app.get("/api/health", async (req, res) => {
  try {
    const cacheHealth = await CacheService.healthCheck()
    const schedulerStatus = schedulerService.getStatus()
    
    res.json({
      status: "Backend is running",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cache: cacheHealth,
      scheduler: schedulerStatus,
      environment: process.env.NODE_ENV || 'development'
    })
  } catch (error) {
    res.status(500).json({
      status: "Error",
      message: error.message
    })
  }
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully')
  
  schedulerService.stop()
  await CacheService.close()
  
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully')
  
  schedulerService.stop()
  await CacheService.close()
  
  process.exit(0)
})

const PORT = process.env.PORT || 5000

// Start server and services
app.listen(PORT, async () => {
  console.log(`🚀 FreightSight Enterprise Server running on port ${PORT}`)
  
  // Start scheduler service
  try {
    schedulerService.start()
    console.log('✅ Scheduled update service started')
  } catch (error) {
    console.error('❌ Failed to start scheduler service:', error)
  }
  
  // Initialize cache
  try {
    await CacheService.healthCheck()
    console.log('✅ Cache service initialized')
  } catch (error) {
    console.error('❌ Failed to initialize cache service:', error)
  }
  
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`🔗 API Health: http://localhost:${PORT}/api/health`)
})
