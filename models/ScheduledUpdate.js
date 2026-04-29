import mongoose from 'mongoose'

const scheduledUpdateSchema = new mongoose.Schema({
  trackingId: {
    type: String,
    required: true,
    ref: 'Parcel'
  },
  scheduledTime: {
    type: Date,
    required: true
  },
  location: {
    address: String,
    city: String,
    country: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  status: {
    type: String,
    enum: ['In Transit', 'Out for Delivery', 'Delivered', 'Delayed'],
    required: true
  },
  notes: {
    type: String,
    maxlength: 500
  },
  isExecuted: {
    type: Boolean,
    default: false
  },
  executedAt: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
})

// Index for efficient querying
scheduledUpdateSchema.index({ trackingId: 1, scheduledTime: 1 })
scheduledUpdateSchema.index({ scheduledTime: 1, isExecuted: 1 })
scheduledUpdateSchema.index({ createdBy: 1 })

// Pre-save middleware
scheduledUpdateSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

export default mongoose.model('ScheduledUpdate', scheduledUpdateSchema)
