import mongoose from "mongoose"
import { productionConfig } from "../config/production.js"

class DatabaseReplicaService {
  constructor() {
    this.primaryConnection = null
    this.secondaryConnections = new Map()
    this.readPreference = productionConfig.database.options.readPreference
    this.writeConcern = productionConfig.database.options.writeConcern
    this.readConcern = productionConfig.database.options.readConcern
    this.connectionPool = {
      primary: { active: 0, total: 0, waiting: 0 },
      secondary: { active: 0, total: 0, waiting: 0 }
    }
    this.metrics = {
      readOperations: 0,
      writeOperations: 0,
      readFromPrimary: 0,
      readFromSecondary: 0,
      connectionErrors: 0,
      failoverEvents: 0
    }
  }

  async initialize() {
    try {
      console.log("🔧 Initializing database replica service...")
      
      // Connect to primary with replica set configuration
      await this.connectToPrimary()
      
      // Connect to secondary nodes
      await this.connectToSecondaries()
      
      // Set up replica set monitoring
      this.setupReplicaSetMonitoring()
      
      // Start health checks
      this.startHealthChecks()
      
      console.log("✅ Database replica service initialized")
    } catch (error) {
      console.error("❌ Failed to initialize database replica service:", error)
      throw error
    }
  }

  async connectToPrimary() {
    try {
      const options = {
        ...productionConfig.database.options,
        readPreference: 'primary',
        replicaSet: this.extractReplicaSetName()
      }

      this.primaryConnection = await mongoose.createConnection(
        productionConfig.database.uri,
        options
      )

      this.primaryConnection.on('connected', () => {
        console.log("✅ Connected to primary database")
      })

      this.primaryConnection.on('error', (error) => {
        console.error("❌ Primary database error:", error)
        this.metrics.connectionErrors++
        this.handlePrimaryFailover()
      })

      this.primaryConnection.on('disconnected', () => {
        console.warn("⚠️ Primary database disconnected")
        this.handlePrimaryFailover()
      })

      // Monitor connection pool
      this.monitorConnectionPool('primary', this.primaryConnection)
      
    } catch (error) {
      console.error("❌ Failed to connect to primary database:", error)
      throw error
    }
  }

  async connectToSecondaries() {
    try {
      const secondaryNodes = this.getSecondaryNodes()
      
      for (const node of secondaryNodes) {
        try {
          const connection = await mongoose.createConnection(node, {
            ...productionConfig.database.options,
            readPreference: 'secondary',
            replicaSet: this.extractReplicaSetName()
          })

          this.secondaryConnections.set(node, connection)
          
          connection.on('connected', () => {
            console.log(`✅ Connected to secondary: ${node}`)
          })

          connection.on('error', (error) => {
            console.error(`❌ Secondary error (${node}):`, error)
            this.metrics.connectionErrors++
            this.handleSecondaryFailover(node)
          })

          connection.on('disconnected', () => {
            console.warn(`⚠️ Secondary disconnected: ${node}`)
            this.handleSecondaryFailover(node)
          })

          this.monitorConnectionPool('secondary', connection)
          
        } catch (error) {
          console.error(`❌ Failed to connect to secondary (${node}):`, error)
        }
      }
      
      console.log(`📊 Connected to ${this.secondaryConnections.size} secondary nodes`)
    } catch (error) {
      console.error("❌ Failed to connect to secondary nodes:", error)
    }
  }

  extractReplicaSetName() {
    const uri = productionConfig.database.uri
    const match = uri.match(/replicaSet=([^&]+)/)
    return match ? match[1] : null
  }

  getSecondaryNodes() {
    // Extract secondary nodes from connection string or configuration
    // This is a simplified implementation
    const uri = productionConfig.database.uri
    const hosts = uri.match(/mongodb:\/\/([^\/]+)/)
    
    if (hosts) {
      const hostList = hosts[1].split(',')
      return hostList.map(host => `mongodb://${host}/${this.getDatabaseName()}`)
    }
    
    return []
  }

  getDatabaseName() {
    const uri = productionConfig.database.uri
    const match = uri.match(/\/([^?]+)/)
    return match ? match[1] : 'freightsight'
  }

  setupReplicaSetMonitoring() {
    if (!this.primaryConnection) return

    // Monitor replica set status
    setInterval(async () => {
      try {
        const admin = this.primaryConnection.db.admin()
        const status = await admin.command({ replSetGetStatus: 1 })
        
        this.processReplicaSetStatus(status)
      } catch (error) {
        console.error("❌ Failed to get replica set status:", error)
      }
    }, 30000) // Check every 30 seconds
  }

  processReplicaSetStatus(status) {
    if (!status.members) return

    const members = status.members
    const primary = members.find(member => member.state === 1)
    const secondaries = members.filter(member => member.state === 2)
    const arbiters = members.filter(member => member.state === 7)

    console.log(`📊 Replica Set Status: ${members.length} members (${secondaries.length} secondaries, ${arbiters.length} arbiters)`)
    
    if (primary) {
      console.log(`👑 Primary: ${primary.name} (${primary.health === 1 ? 'healthy' : 'unhealthy'})`)
    }

    secondaries.forEach(secondary => {
      console.log(`🔄 Secondary: ${secondary.name} (${secondary.health === 1 ? 'healthy' : 'unhealthy'})`)
    })
  }

  async handlePrimaryFailover() {
    console.warn("🔄 Primary failover initiated...")
    this.metrics.failoverEvents++

    try {
      // Promote a secondary to primary
      const newPrimary = await this.promoteSecondaryToPrimary()
      
      if (newPrimary) {
        console.log("✅ New primary elected:", newPrimary)
        await this.reconfigureConnections(newPrimary)
      }
    } catch (error) {
      console.error("❌ Primary failover failed:", error)
    }
  }

  async promoteSecondaryToPrimary() {
    // This would typically be handled automatically by MongoDB replica set
    // Here we simulate the process
    
    const healthySecondaries = Array.from(this.secondaryConnections.entries())
      .filter(([_, connection]) => connection.readyState === 1)
    
    if (healthySecondaries.length === 0) {
      throw new Error("No healthy secondary available for promotion")
    }

    // Select the first healthy secondary
    const [newPrimaryNode, newPrimaryConnection] = healthySecondaries[0]
    
    // Update connection configuration
    this.primaryConnection = newPrimaryConnection
    this.secondaryConnections.delete(newPrimaryNode)
    
    return newPrimaryNode
  }

  async reconfigureConnections(newPrimary) {
    // Reconfigure read preferences and connections
    console.log("🔄 Reconfiguring database connections...")
    
    // Update mongoose default connection
    await mongoose.connect(productionConfig.database.uri, {
      ...productionConfig.database.options,
      readPreference: this.readPreference,
      retryWrites: true
    })
  }

  async handleSecondaryFailover(node) {
    console.warn(`⚠️ Secondary failover for: ${node}`)
    
    // Attempt to reconnect to the failed secondary
    setTimeout(async () => {
      try {
        console.log(`🔄 Attempting to reconnect to secondary: ${node}`)
        await this.connectToSingleSecondary(node)
      } catch (error) {
        console.error(`❌ Failed to reconnect to secondary (${node}):`, error)
      }
    }, 5000) // Retry after 5 seconds
  }

  async connectToSingleSecondary(node) {
    const connection = await mongoose.createConnection(node, {
      ...productionConfig.database.options,
      readPreference: 'secondary',
      replicaSet: this.extractReplicaSetName()
    })

    this.secondaryConnections.set(node, connection)
    return connection
  }

  monitorConnectionPool(type, connection) {
    setInterval(() => {
      const poolStats = this.getConnectionPoolStats(connection)
      this.connectionPool[type] = poolStats
    }, 10000) // Monitor every 10 seconds
  }

  getConnectionPoolStats(connection) {
    // This would typically use connection pool statistics
    // For now, we'll return simulated stats
    return {
      active: Math.floor(Math.random() * 10) + 1,
      total: Math.floor(Math.random() * 20) + 10,
      waiting: Math.floor(Math.random() * 5)
    }
  }

  startHealthChecks() {
    setInterval(async () => {
      await this.performHealthCheck()
    }, 60000) // Health check every minute
  }

  async performHealthCheck() {
    const health = {
      primary: await this.checkNodeHealth(this.primaryConnection),
      secondaries: {}
    }

    for (const [node, connection] of this.secondaryConnections) {
      health.secondaries[node] = await this.checkNodeHealth(connection)
    }

    return health
  }

  async checkNodeHealth(connection) {
    try {
      if (!connection || connection.readyState !== 1) {
        return { status: 'disconnected', responseTime: null }
      }

      const startTime = Date.now()
      await connection.db.admin().ping()
      const responseTime = Date.now() - startTime

      return {
        status: 'healthy',
        responseTime: `${responseTime}ms`,
        lastCheck: new Date().toISOString()
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        lastCheck: new Date().toISOString()
      }
    }
  }

  // Read operation with replica set awareness
  async executeReadOperation(query, options = {}) {
    this.metrics.readOperations++

    try {
      let connection
      let readFrom = 'primary'

      // Determine read target based on read preference
      if (this.readPreference === 'secondaryPreferred' || this.readPreference === 'secondary') {
        connection = this.getOptimalReadConnection()
        if (connection !== this.primaryConnection) {
          readFrom = 'secondary'
          this.metrics.readFromSecondary++
        } else {
          this.metrics.readFromPrimary++
        }
      } else {
        connection = this.primaryConnection
        this.metrics.readFromPrimary++
      }

      const result = await connection.db.collection(options.collection || 'parcels')
        .find(query)
        .readConcern(this.readConcern)
        .maxTimeMS(options.maxTimeMS || 30000)
        .toArray()

      return {
        data: result,
        readFrom,
        connectionStats: this.getConnectionPoolStats(connection)
      }
    } catch (error) {
      console.error("❌ Read operation failed:", error)
      throw error
    }
  }

  // Write operation with replica set awareness
  async executeWriteOperation(operation, data, options = {}) {
    this.metrics.writeOperations++

    try {
      if (!this.primaryConnection || this.primaryConnection.readyState !== 1) {
        throw new Error("Primary connection not available for write operations")
      }

      const collection = this.primaryConnection.db.collection(options.collection || 'parcels')
      
      let result
      switch (operation) {
        case 'insert':
          result = await collection.insertOne(data, { writeConcern: this.writeConcern })
          break
        case 'update':
          result = await collection.updateOne(data.query, data.update, { 
            writeConcern: this.writeConcern,
            upsert: options.upsert || false
          })
          break
        case 'delete':
          result = await collection.deleteOne(data, { writeConcern: this.writeConcern })
          break
        default:
          throw new Error(`Unknown write operation: ${operation}`)
      }

      return {
        data: result,
        writeConcern: this.writeConcern,
        connectionStats: this.getConnectionPoolStats(this.primaryConnection)
      }
    } catch (error) {
      console.error("❌ Write operation failed:", error)
      throw error
    }
  }

  getOptimalReadConnection() {
    // Select the best secondary for read operations
    const healthySecondaries = Array.from(this.secondaryConnections.entries())
      .filter(([_, connection]) => connection.readyState === 1)
    
    if (healthySecondaries.length === 0) {
      return this.primaryConnection
    }

    // Select secondary with lowest response time (simplified)
    return healthySecondaries[0][1]
  }

  // Get comprehensive metrics
  getMetrics() {
    return {
      ...this.metrics,
      connectionPool: this.connectionPool,
      readPreference: this.readPreference,
      writeConcern: this.writeConcern,
      readConcern: this.readConcern,
      replicaSet: {
        primary: this.primaryConnection ? 'connected' : 'disconnected',
        secondaries: this.secondaryConnections.size,
        totalNodes: this.secondaryConnections.size + 1
      }
    }
  }

  // Get connection status
  async getStatus() {
    const health = await this.performHealthCheck()
    
    return {
      status: health.primary.status === 'healthy' ? 'healthy' : 'degraded',
      primary: health.primary,
      secondaries: health.secondaries,
      metrics: this.getMetrics(),
      configuration: {
        readPreference: this.readPreference,
        writeConcern: this.writeConcern,
        readConcern: this.readConcern
      }
    }
  }

  // Close all connections
  async close() {
    console.log("🔄 Closing database replica connections...")
    
    if (this.primaryConnection) {
      await this.primaryConnection.close()
    }
    
    for (const [node, connection] of this.secondaryConnections) {
      await connection.close()
    }
    
    this.secondaryConnections.clear()
    console.log("✅ All database connections closed")
  }
}

// Singleton instance
const databaseReplicaService = new DatabaseReplicaService()

export default databaseReplicaService
