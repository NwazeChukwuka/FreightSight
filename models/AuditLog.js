import mongoose from 'mongoose'

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'CREATE', 'UPDATE', 'DELETE', 'VIEW', 'LOGIN', 'LOGOUT',
      'PARCEL_CREATED', 'PARCEL_UPDATED', 'PARCEL_DELETED', 'PARCEL_VIEWED',
      'SCHEDULED_UPDATE_CREATED', 'SCHEDULED_UPDATE_UPDATED', 'SCHEDULED_UPDATE_DELETED',
      'USER_CREATED', 'USER_UPDATED', 'USER_DELETED',
      'ADMIN_ACTION', 'SYSTEM_CONFIG_CHANGE'
    ]
  },
  resource: {
    type: String,
    required: true
  },
  resourceId: {
    type: String,
    required: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  sessionId: {
    type: String
  },
  success: {
    type: Boolean,
    default: true
  },
  errorMessage: {
    type: String
  }
})

// Indexes for efficient querying
auditLogSchema.index({ userId: 1, timestamp: -1 })
auditLogSchema.index({ action: 1, timestamp: -1 })
auditLogSchema.index({ resource: 1, timestamp: -1 })
auditLogSchema.index({ timestamp: -1 })
auditLogSchema.index({ ipAddress: 1, timestamp: -1 })

// TTL index - automatically delete logs older than 1 year
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 })

export default mongoose.model('AuditLog', auditLogSchema)
