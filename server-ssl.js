import express from "express"
import mongoose from "mongoose"
import cors from "cors"
import https from "https"
import fs from "fs"
import path from "path"
import { performance } from "perf_hooks"
import cluster from "cluster"
import os from "os"

import productionConfig from "./config/production.js"
import authRoutes from "./routes/auth.js"
import parcelRoutes from "./routes/parcels.js"
import adminRoutes from "./routes/admin.js"
import scheduledUpdatesRoutes from "./routes/scheduled-updates.js"
import monitoringRoutes from "./routes/monitoring.js"
import emailTemplatesRoutes from "./routes/email-templates.js"

import { authMiddleware } from "./middleware/auth.js"
import { securityHeaders, ipBlocker, detectSuspiciousActivity, auditLogger, sanitizeInput } from "./middleware/security.js"
import { apiLimiter, authLimiter, adminLimiter } from "./middleware/rateLimit.js"
import { responseTimeTracker, addResponseTimeHeader, slowQueryLogger } from "./middleware/responseTime.js"
import schedulerService from "./services/scheduler.js"
import CacheService from "./services/cache.js"

// Validate production configuration
productionConfig.validateProductionConfig()

// Cluster mode for better performance
if (cluster.isMaster && productionConfig.performance.enableCluster) {
  const numCPUs = os.cpus().length
  console.log(`🚀 Master process ${process.pid} is running`)
  console.log(`📊 Forking ${numCPUs} workers...`)

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork()
  }

  // Handle worker exits
  cluster.on('exit', (worker, code, signal) => {
    console.log(`❌ Worker ${worker.process.pid} died with code: ${code}, signal: ${signal}`)
    console.log(`🔄 Restarting worker...`)
    cluster.fork()
  })

  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully')
    for (const id in cluster.workers) {
      cluster.workers[id].kill('SIGTERM')
    }
    process.exit(0)
  })

} else {
  const app = express()

  // Performance monitoring middleware
  app.use((req, res, next) => {
    const start = performance.now()
    res.on('finish', () => {
      const duration = performance.now() - start
      console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration.toFixed(2)}ms`)
    })
    next()
  })

  // Security middleware
  app.use(securityHeaders)
  app.use(ipBlocker)
  app.use(detectSuspiciousActivity)
  app.use(auditLogger)
  app.use(sanitizeInput)

  // Performance middleware
  app.use(responseTimeTracker)
  app.use(addResponseTimeHeader)
  app.use(slowQueryLogger(1000))

  // Rate limiting
  app.use('/api', apiLimiter)
  app.use('/api/auth', authLimiter)

  // CORS configuration
  app.use(cors({
    origin: productionConfig.security.corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  }))

  // Body parsing with size limits
  app.use(express.json({ 
    limit: `${productionConfig.performance.maxRequestSize}b`,
    verify: (req, res, buf) => {
      try {
        JSON.parse(buf)
      } catch (e) {
        res.status(400).json({ error: 'Invalid JSON' })
        return
      }
    }
  }))
  app.use(express.urlencoded({ 
    extended: true, 
    limit: `${productionConfig.performance.maxRequestSize}b` 
  }))

  // Compression
  if (productionConfig.performance.enableCompression) {
    const compression = require('compression')
    app.use(compression({
      threshold: productionConfig.performance.compressionThreshold,
      filter: (req, res) => {
        if (req.headers['x-no-compression']) {
          return false
        }
        return compression.filter(req, res)
      }
    }))
  }

  // ETag
  if (productionConfig.performance.enableEtag) {
    app.set('etag', 'strong')
  }

  // Static files with CDN support
  if (productionConfig.cdn.enabled) {
    app.use('/static', express.static('public', {
      maxAge: productionConfig.cdn.cacheTtl * 1000,
      etag: true,
      lastModified: true,
      setHeaders: (res, path) => {
        if (productionConfig.cdn.staticAssetUrl) {
          res.setHeader('X-CDN-URL', productionConfig.cdn.staticAssetUrl)
        }
      }
    }))
  }

  // Database Connection with replica set
  mongoose.connect(productionConfig.database.uri, productionConfig.database.options)
    .then(() => {
      console.log("✅ MongoDB connected to production cluster")
      console.log(`📊 Read Preference: ${productionConfig.database.options.readPreference}`)
      console.log(`📝 Write Concern: ${productionConfig.database.options.writeConcern.w}`)
    })
    .catch((err) => {
      console.error("❌ MongoDB connection error:", err)
      process.exit(1)
    })

  // Redis Cluster Connection
  CacheService.connectCluster(productionConfig.redis)
    .then(() => {
      console.log("✅ Redis cluster connected")
    })
    .catch((err) => {
      console.error("❌ Redis connection error:", err)
      process.exit(1)
    })

  // Routes
  app.use("/api/auth", authRoutes)
  app.use("/api/parcels", authMiddleware, parcelRoutes)
  app.use("/api/admin", authMiddleware, adminRoutes)
  app.use("/api/scheduled-updates", scheduledUpdatesRoutes)
  app.use("/api/monitoring", monitoringRoutes)
  app.use("/api/email-templates", emailTemplatesRoutes)

  // Enhanced health check
  app.get("/api/health", async (req, res) => {
    try {
      const startTime = performance.now()
      
      // Database health
      const dbHealth = await mongoose.connection.db.admin().ping()
      
      // Redis health
      const cacheHealth = await CacheService.healthCheck()
      
      // Scheduler status
      const schedulerStatus = schedulerService.getStatus()
      
      // Memory usage
      const memoryUsage = process.memoryUsage()
      
      // Uptime
      const uptime = process.uptime()
      
      // Response time
      const responseTime = performance.now() - startTime

      const health = {
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: Math.floor(uptime),
        environment: productionConfig.NODE_ENV,
        version: process.env.npm_package_version || "2.0.0",
        responseTime: `${responseTime.toFixed(2)}ms`,
        services: {
          database: {
            status: dbHealth ? "connected" : "disconnected",
            ping: dbHealth ? "ok" : "failed"
          },
          cache: {
            status: cacheHealth.status,
            connected: cacheHealth.connected,
            nodes: cacheHealth.nodes
          },
          scheduler: {
            status: schedulerStatus.status,
            running: schedulerStatus.running,
            nextRun: schedulerStatus.nextRun
          }
        },
        system: {
          memory: {
            used: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
            total: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)}MB`,
            rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)}MB`
          },
          cpu: {
            loadAverage: os.loadavg(),
            cores: os.cpus().length
          },
          cluster: {
            isMaster: cluster.isMaster,
            workerId: cluster.worker ? cluster.worker.id : null,
            workers: Object.keys(cluster.workers || {}).length
          }
        },
        performance: {
          compression: productionConfig.performance.enableCompression,
          etag: productionConfig.performance.enableEtag,
          rateLimiting: productionConfig.features.apiRateLimiting,
          cacheEnabled: productionConfig.cache.compression
        }
      }

      // Check if any service is unhealthy
      const unhealthyServices = Object.entries(health.services)
        .filter(([_, service]) => service.status !== "connected" && service.status !== "healthy")
      
      if (unhealthyServices.length > 0) {
        health.status = "degraded"
        res.status(503).json(health)
      } else {
        res.json(health)
      }
    } catch (error) {
      res.status(500).json({
        status: "unhealthy",
        error: error.message,
        timestamp: new Date().toISOString()
      })
    }
  })

  // SSL Configuration
  let server
  if (productionConfig.security.ssl.certPath && productionConfig.security.ssl.keyPath) {
    try {
      const sslOptions = {
        key: fs.readFileSync(productionConfig.security.ssl.keyPath),
        cert: fs.readFileSync(productionConfig.security.ssl.certPath),
        ca: productionConfig.security.ssl.caPath ? 
          fs.readFileSync(productionConfig.security.ssl.caPath) : undefined,
        minVersion: 'TLSv1.2',
        ciphers: [
          'ECDHE-RSA-AES128-GCM-SHA256',
          'ECDHE-RSA-AES256-GCM-SHA384',
          'ECDHE-RSA-AES128-SHA256',
          'ECDHE-RSA-AES256-SHA384',
          'AES128-GCM-SHA256',
          'AES256-GCM-SHA384',
          'AES128-SHA256',
          'AES256-SHA384'
        ].join(':'),
        honorCipherOrder: true
      }

      server = https.createServer(sslOptions, app)
      console.log("🔒 SSL/HTTPS enabled")
    } catch (error) {
      console.error("❌ SSL configuration error:", error)
      console.log("🔄 Falling back to HTTP")
      server = require('http').createServer(app)
    }
  } else {
    server = require('http').createServer(app)
    console.log("⚠️  SSL certificates not found, running in HTTP mode")
  }

  // Start server
  server.listen(productionConfig.PORT, () => {
    console.log(`🚀 FreightSight Enterprise Server running on port ${productionConfig.PORT}`)
    console.log(`🌐 Environment: ${productionConfig.NODE_ENV}`)
    console.log(`🔗 Health Check: http${productionConfig.security.ssl.certPath ? 's' : ''}://localhost:${productionConfig.PORT}/api/health`)
    console.log(`👥 Worker ID: ${cluster.worker ? cluster.worker.id : 'master'}`)
    console.log(`📊 Process ID: ${process.pid}`)
  })

  // Start scheduler service
  try {
    schedulerService.start()
    console.log('✅ Scheduled update service started')
  } catch (error) {
    console.error('❌ Failed to start scheduler service:', error)
  }

  // Graceful shutdown
  const gracefulShutdown = async (signal) => {
    console.log(`🛑 ${signal} received, shutting down gracefully`)
    
    // Stop accepting new connections
    server.close(async () => {
      console.log('✅ HTTP server closed')
      
      try {
        // Stop scheduler
        schedulerService.stop()
        console.log('✅ Scheduler service stopped')
        
        // Close cache connections
        await CacheService.close()
        console.log('✅ Cache connections closed')
        
        // Close database connections
        await mongoose.connection.close()
        console.log('✅ Database connections closed')
        
        // Exit worker
        if (cluster.worker) {
          cluster.worker.kill()
        }
        
        process.exit(0)
      } catch (error) {
        console.error('❌ Error during shutdown:', error)
        process.exit(1)
      }
    })
    
    // Force shutdown after 30 seconds
    setTimeout(() => {
      console.log('❌ Forced shutdown after timeout')
      process.exit(1)
    }, 30000)
  }

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
  process.on('SIGINT', () => gracefulShutdown('SIGINT'))

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error)
    gracefulShutdown('uncaughtException')
  })

  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason)
    gracefulShutdown('unhandledRejection')
  })
}
