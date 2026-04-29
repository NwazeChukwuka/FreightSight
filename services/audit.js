import AuditLog from '../models/AuditLog.js'
import CacheService from './cache.js'

class AuditService {
  // Log an action
  static async log({
    userId,
    action,
    resource,
    resourceId,
    details = {},
    ipAddress,
    userAgent,
    sessionId,
    success = true,
    errorMessage
  }) {
    try {
      const auditLog = new AuditLog({
        userId,
        action,
        resource,
        resourceId,
        details,
        ipAddress,
        userAgent,
        sessionId,
        success,
        errorMessage
      })

      await auditLog.save()

      // Cache recent logs for quick access
      const cacheKey = `audit:user:${userId}:recent`
      const recentLogs = await CacheService.get(cacheKey) || []
      recentLogs.unshift({
        action,
        resource,
        resourceId,
        timestamp: auditLog.timestamp,
        success
      })
      
      // Keep only last 50 logs per user in cache
      await CacheService.set(cacheKey, recentLogs.slice(0, 50), 3600) // 1 hour

      return auditLog
    } catch (error) {
      console.error('Audit log error:', error)
      // Don't throw error to avoid breaking main functionality
    }
  }

  // Get audit logs for a user
  static async getUserLogs(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 50,
        action,
        resource,
        startDate,
        endDate
      } = options

      const query = { userId }

      if (action) query.action = action
      if (resource) query.resource = resource
      if (startDate || endDate) {
        query.timestamp = {}
        if (startDate) query.timestamp.$gte = new Date(startDate)
        if (endDate) query.timestamp.$lte = new Date(endDate)
      }

      const skip = (page - 1) * limit

      const logs = await AuditLog.find(query)
        .populate('userId', 'email firstName lastName')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)

      const total = await AuditLog.countDocuments(query)

      return {
        logs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    } catch (error) {
      console.error('Get user logs error:', error)
      throw error
    }
  }

  // Get system-wide audit logs (admin only)
  static async getSystemLogs(options = {}) {
    try {
      const {
        page = 1,
        limit = 100,
        action,
        resource,
        userId,
        startDate,
        endDate,
        ipAddress
      } = options

      const query = {}

      if (action) query.action = action
      if (resource) query.resource = resource
      if (userId) query.userId = userId
      if (ipAddress) query.ipAddress = ipAddress
      if (startDate || endDate) {
        query.timestamp = {}
        if (startDate) query.timestamp.$gte = new Date(startDate)
        if (endDate) query.timestamp.$lte = new Date(endDate)
      }

      const skip = (page - 1) * limit

      const logs = await AuditLog.find(query)
        .populate('userId', 'email firstName lastName role')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)

      const total = await AuditLog.countDocuments(query)

      return {
        logs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    } catch (error) {
      console.error('Get system logs error:', error)
      throw error
    }
  }

  // Get audit statistics
  static async getStatistics(options = {}) {
    try {
      const { startDate, endDate } = options

      const matchStage = {}
      if (startDate || endDate) {
        matchStage.timestamp = {}
        if (startDate) matchStage.timestamp.$gte = new Date(startDate)
        if (endDate) matchStage.timestamp.$lte = new Date(endDate)
      }

      const stats = await AuditLog.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalLogs: { $sum: 1 },
            successfulActions: { $sum: { $cond: ['$success', 1, 0] } },
            failedActions: { $sum: { $cond: ['$success', 0, 1] } },
            uniqueUsers: { $addToSet: '$userId' },
            uniqueIPs: { $addToSet: '$ipAddress' }
          }
        },
        {
          $project: {
            totalLogs: 1,
            successfulActions: 1,
            failedActions: 1,
            successRate: {
              $multiply: [
                { $divide: ['$successfulActions', '$totalLogs'] },
                100
              ]
            },
            uniqueUserCount: { $size: '$uniqueUsers' },
            uniqueIPCount: { $size: '$uniqueIPs' }
          }
        }
      ])

      const actionStats = await AuditLog.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$action',
            count: { $sum: 1 },
            successCount: { $sum: { $cond: ['$success', 1, 0] } }
          }
        },
        { $sort: { count: -1 } }
      ])

      const resourceStats = await AuditLog.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$resource',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ])

      return {
        summary: stats[0] || {
          totalLogs: 0,
          successfulActions: 0,
          failedActions: 0,
          successRate: 0,
          uniqueUserCount: 0,
          uniqueIPCount: 0
        },
        actionBreakdown: actionStats,
        resourceBreakdown: resourceStats
      }
    } catch (error) {
      console.error('Get audit statistics error:', error)
      throw error
    }
  }

  // Get compliance reports
  static async getComplianceReport(options = {}) {
    try {
      const { startDate, endDate } = options

      // GDPR compliance - data access logs
      const dataAccessLogs = await AuditLog.find({
        action: { $in: ['VIEW', 'PARCEL_VIEWED'] },
        ...(startDate || endDate ? {
          timestamp: {}
        } : {}),
        ...(startDate ? { 'timestamp.$gte': new Date(startDate) } : {}),
        ...(endDate ? { 'timestamp.$lte': new Date(endDate) } : {})
      }).populate('userId', 'email role')

      // Failed authentication attempts
      const failedAuthAttempts = await AuditLog.find({
        action: { $in: ['LOGIN'] },
        success: false,
        ...(startDate || endDate ? {
          timestamp: {}
        } : {}),
        ...(startDate ? { 'timestamp.$gte': new Date(startDate) } : {}),
        ...(endDate ? { 'timestamp.$lte': new Date(endDate) } : {})
      }).populate('userId', 'email')

      // Admin actions
      const adminActions = await AuditLog.find({
        action: { $in: ['ADMIN_ACTION', 'USER_CREATED', 'USER_UPDATED', 'USER_DELETED'] },
        ...(startDate || endDate ? {
          timestamp: {}
        } : {}),
        ...(startDate ? { 'timestamp.$gte': new Date(startDate) } : {}),
        ...(endDate ? { 'timestamp.$lte': new Date(endDate) } : {})
      }).populate('userId', 'email role')

      return {
        period: { startDate, endDate },
        dataAccessLogs: {
          count: dataAccessLogs.length,
          logs: dataAccessLogs.slice(0, 100) // Return last 100
        },
        securityEvents: {
          failedAuthAttempts: failedAuthAttempts.length,
          failedAuthLogs: failedAuthAttempts.slice(0, 50)
        },
        adminActivity: {
          count: adminActions.length,
          actions: adminActions.slice(0, 100)
        },
        generatedAt: new Date().toISOString()
      }
    } catch (error) {
      console.error('Get compliance report error:', error)
      throw error
    }
  }

  // Export audit logs (admin only)
  static async exportLogs(options = {}) {
    try {
      const { format = 'json', ...queryOptions } = options

      const { logs } = await this.getSystemLogs({
        ...queryOptions,
        limit: 10000 // Export limit
      })

      if (format === 'csv') {
        // Convert to CSV format
        const headers = ['Timestamp', 'User', 'Action', 'Resource', 'Resource ID', 'IP Address', 'Success', 'Details']
        const csvData = logs.map(log => [
          log.timestamp,
          log.userId?.email || 'System',
          log.action,
          log.resource,
          log.resourceId,
          log.ipAddress,
          log.success,
          JSON.stringify(log.details)
        ])

        return {
          format: 'csv',
          headers,
          data: csvData,
          filename: `audit_logs_${new Date().toISOString().split('T')[0]}.csv`
        }
      }

      return {
        format: 'json',
        data: logs,
        filename: `audit_logs_${new Date().toISOString().split('T')[0]}.json`
      }
    } catch (error) {
      console.error('Export logs error:', error)
      throw error
    }
  }

  // Clean up old audit logs (called by scheduler)
  static async cleanupOldLogs(daysToKeep = 365) {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

      const result = await AuditLog.deleteMany({
        timestamp: { $lt: cutoffDate }
      })

      console.log(`Cleaned up ${result.deletedCount} old audit logs`)
      return result.deletedCount
    } catch (error) {
      console.error('Cleanup audit logs error:', error)
      throw error
    }
  }

  // Search audit logs
  static async searchLogs(searchTerm, options = {}) {
    try {
      const { page = 1, limit = 50 } = options
      const skip = (page - 1) * limit

      const query = {
        $or: [
          { action: { $regex: searchTerm, $options: 'i' } },
          { resource: { $regex: searchTerm, $options: 'i' } },
          { resourceId: { $regex: searchTerm, $options: 'i' } },
          { details: { $regex: searchTerm, $options: 'i' } },
          { errorMessage: { $regex: searchTerm, $options: 'i' } }
        ]
      }

      const logs = await AuditLog.find(query)
        .populate('userId', 'email firstName lastName')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)

      const total = await AuditLog.countDocuments(query)

      return {
        logs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        searchTerm
      }
    } catch (error) {
      console.error('Search audit logs error:', error)
      throw error
    }
  }
}

export default AuditService
