import dotenv from "dotenv"

// Load production environment variables
dotenv.config({ path: ".env.production" })

export const productionConfig = {
  // Environment
  NODE_ENV: process.env.NODE_ENV || "production",
  PORT: parseInt(process.env.PORT) || 5000,
  
  // Database Configuration
  database: {
    uri: process.env.MONGODB_URI,
    testUri: process.env.MONGODB_TEST_URI,
    options: {
      maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE) || 50,
      minPoolSize: parseInt(process.env.DB_MIN_POOL_SIZE) || 5,
      maxIdleTimeMS: parseInt(process.env.DB_MAX_IDLE_TIME_MS) || 30000,
      readPreference: process.env.DB_READ_PREFERENCE || "secondaryPreferred",
      writeConcern: {
        w: process.env.DB_WRITE_CONCERN || "majority",
        j: true
      },
      readConcern: {
        level: process.env.DB_READ_CONCERN || "majority"
      },
      retryWrites: true,
      retryReads: true
    }
  },

  // Redis Configuration
  redis: {
    url: process.env.REDIS_URL,
    clusterNodes: process.env.REDIS_CLUSTER_NODES?.split(",") || [],
    password: process.env.REDIS_PASSWORD,
    options: {
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      keepAlive: 30000,
      connectTimeout: 10000,
      commandTimeout: 5000
    }
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || "24h",
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d"
  },

  // Email Configuration
  email: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    from: process.env.SMTP_FROM,
    fromName: process.env.SMTP_FROM_NAME || "FreightSight"
  },

  // Security Configuration
  security: {
    corsOrigin: process.env.CORS_ORIGIN,
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    rateLimitAuthMaxRequests: parseInt(process.env.RATE_LIMIT_AUTH_MAX_REQUESTS) || 5,
    sessionSecret: process.env.SESSION_SECRET,
    ssl: {
      certPath: process.env.SSL_CERT_PATH,
      keyPath: process.env.SSL_KEY_PATH,
      caPath: process.env.SSL_CA_PATH
    }
  },

  // Monitoring Configuration
  monitoring: {
    enabled: process.env.MONITORING_ENABLED === "true",
    logLevel: process.env.LOG_LEVEL || "info",
    logFilePath: process.env.LOG_FILE_PATH,
    errorLogPath: process.env.ERROR_LOG_PATH,
    healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL) || 30000
  },

  // Backup Configuration
  backup: {
    enabled: process.env.BACKUP_ENABLED === "true",
    schedule: process.env.BACKUP_SCHEDULE,
    retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS) || 30,
    s3: {
      bucket: process.env.BACKUP_S3_BUCKET,
      region: process.env.BACKUP_S3_REGION,
      accessKey: process.env.BACKUP_S3_ACCESS_KEY,
      secretKey: process.env.BACKUP_S3_SECRET_KEY
    }
  },

  // Performance Configuration
  performance: {
    enableCompression: process.env.ENABLE_COMPRESSION === "true",
    compressionThreshold: parseInt(process.env.COMPRESSION_THRESHOLD) || 1024,
    enableEtag: process.env.ENABLE_ETAG === "true",
    maxRequestSize: parseInt(process.env.MAX_REQUEST_SIZE) || 10485760,
    connectionTimeout: parseInt(process.env.CONNECTION_TIMEOUT) || 30000,
    keepAliveTimeout: parseInt(process.env.KEEP_ALIVE_TIMEOUT) || 5000
  },

  // CDN Configuration
  cdn: {
    enabled: process.env.CDN_ENABLED === "true",
    url: process.env.CDN_URL,
    cacheTtl: parseInt(process.env.CDN_CACHE_TTL) || 86400,
    staticAssetUrl: process.env.STATIC_ASSET_URL
  },

  // Cache Configuration
  cache: {
    defaultTtl: parseInt(process.env.CACHE_DEFAULT_TTL) || 300,
    maxSize: parseInt(process.env.CACHE_MAX_SIZE) || 1000,
    strategy: process.env.CACHE_STRATEGY || "lru",
    compression: process.env.CACHE_COMPRESSION === "true"
  },

  // Alert Configuration
  alerts: {
    email: {
      enabled: process.env.ALERT_EMAIL_ENABLED === "true",
      to: process.env.ALERT_EMAIL_TO?.split(",") || []
    },
    slack: {
      webhook: process.env.ALERT_SLACK_WEBHOOK
    },
    discord: {
      webhook: process.env.ALERT_DISCORD_WEBHOOK
    }
  },

  // Feature Flags
  features: {
    advancedAnalytics: process.env.ENABLE_ADVANCED_ANALYTICS === "true",
    realTimeUpdates: process.env.ENABLE_REAL_TIME_UPDATES === "true",
    bulkOperations: process.env.ENABLE_BULK_OPERATIONS === "true",
    apiRateLimiting: process.env.ENABLE_API_RATE_LIMITING === "true",
    auditLogging: process.env.ENABLE_AUDIT_LOGGING === "true"
  },

  // Compliance Configuration
  compliance: {
    gdpr: process.env.GDPR_COMPLIANCE === "true",
    dataRetentionDays: parseInt(process.env.DATA_RETENTION_DAYS) || 2555,
    cookie: {
      secure: process.env.COOKIE_SECURE === "true",
      sameSite: process.env.COOKIE_SAME_SITE || "strict",
      httpOnly: process.env.COOKIE_HTTP_ONLY === "true"
    }
  },

  // External APIs
  apis: {
    googleMaps: process.env.GOOGLE_MAPS_API_KEY,
    aftership: process.env.AFTERSHIP_API_KEY
  },

  // Frontend URLs
  frontend: {
    url: process.env.FRONTEND_URL,
    apiUrl: process.env.NEXT_PUBLIC_API_URL
  }
}

// Validation helper
export const validateProductionConfig = () => {
  const required = [
    "JWT_SECRET",
    "MONGODB_URI",
    "REDIS_URL",
    "SMTP_HOST",
    "SMTP_USER",
    "SMTP_PASS"
  ]

  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`)
  }

  // Validate JWT secret length
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters long")
  }

  // Validate session secret length
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length < 32) {
    throw new Error("SESSION_SECRET must be at least 32 characters long")
  }

  console.log("✅ Production configuration validated successfully")
}

export default productionConfig
