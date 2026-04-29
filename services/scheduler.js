import cron from 'node-cron'
import Parcel from '../models/Parcel.js'
import ScheduledUpdate from '../models/ScheduledUpdate.js'
import CacheService from './cache.js'
import { sendNotification } from './notifications.js'

class ScheduledUpdateService {
  constructor() {
    this.isRunning = false
    this.tasks = new Map()
  }

  // Start the scheduler service
  start() {
    if (this.isRunning) {
      console.log('Scheduler already running')
      return
    }

    this.isRunning = true
    console.log('Starting scheduled update service...')

    // Check for scheduled updates every minute
    this.tasks.set('checkUpdates', cron.schedule('* * * * *', async () => {
      await this.processScheduledUpdates()
    }, {
      scheduled: true,
      timezone: 'UTC'
    }))

    // Clean up old executed updates daily at 2 AM
    this.tasks.set('cleanup', cron.schedule('0 2 * * *', async () => {
      await this.cleanupOldUpdates()
    }, {
      scheduled: true,
      timezone: 'UTC'
    }))

    console.log('Scheduled update service started successfully')
  }

  // Stop the scheduler service
  stop() {
    if (!this.isRunning) return

    console.log('Stopping scheduled update service...')
    
    this.tasks.forEach(task => task.stop())
    this.tasks.clear()
    this.isRunning = false
    
    console.log('Scheduled update service stopped')
  }

  // Process all pending scheduled updates
  async processScheduledUpdates() {
    try {
      const now = new Date()
      
      // Find all scheduled updates that need to be executed
      const pendingUpdates = await ScheduledUpdate.find({
        scheduledTime: { $lte: now },
        isExecuted: false
      }).populate('trackingId createdBy')

      console.log(`Processing ${pendingUpdates.length} scheduled updates`)

      for (const update of pendingUpdates) {
        await this.executeScheduledUpdate(update)
      }
    } catch (error) {
      console.error('Error processing scheduled updates:', error)
    }
  }

  // Execute a single scheduled update
  async executeScheduledUpdate(scheduledUpdate) {
    try {
      const { trackingId, location, status, notes, createdBy } = scheduledUpdate

      // Find the parcel
      const parcel = await Parcel.findOne({ trackingId: trackingId.trackingId })
      if (!parcel) {
        console.error(`Parcel not found for tracking ID: ${trackingId.trackingId}`)
        return
      }

      // Create timeline event
      const timelineEvent = {
        status,
        location: `${location.address || location.city}, ${location.country}`,
        timestamp: new Date(),
        coordinates: location.coordinates
      }

      // Update parcel
      parcel.status = status
      parcel.currentLocation = {
        ...location,
        timestamp: new Date()
      }
      parcel.timeline.push(timelineEvent)
      parcel.updatedAt = new Date()

      await parcel.save()

      // Mark scheduled update as executed
      scheduledUpdate.isExecuted = true
      scheduledUpdate.executedAt = new Date()
      await scheduledUpdate.save()

      // Invalidate cache
      await CacheService.invalidateParcel(trackingId.trackingId)

      // Send notifications
      await this.sendUpdateNotifications(parcel, timelineEvent, createdBy)

      console.log(`Successfully executed scheduled update for parcel ${trackingId.trackingId}`)
    } catch (error) {
      console.error('Error executing scheduled update:', error)
      
      // Mark as failed but don't retry to avoid infinite loops
      scheduledUpdate.isExecuted = true
      scheduledUpdate.executedAt = new Date()
      await scheduledUpdate.save()
    }
  }

  // Send notifications for update
  async sendUpdateNotifications(parcel, timelineEvent, updatedBy) {
    try {
      // Send to receiver
      if (parcel.receiver?.email) {
        await sendNotification({
          type: 'email',
          recipient: parcel.receiver.email,
          subject: `Parcel Update: ${parcel.trackingId}`,
          template: 'parcelUpdate',
          data: {
            trackingId: parcel.trackingId,
            status: timelineEvent.status,
            location: timelineEvent.location,
            timestamp: timelineEvent.timestamp,
            estimatedDelivery: parcel.estimatedDelivery
          }
        })
      }

      // Send to sender
      if (parcel.sender?.email) {
        await sendNotification({
          type: 'email',
          recipient: parcel.sender.email,
          subject: `Parcel Update: ${parcel.trackingId}`,
          template: 'parcelUpdate',
          data: {
            trackingId: parcel.trackingId,
            status: timelineEvent.status,
            location: timelineEvent.location,
            timestamp: timelineEvent.timestamp,
            estimatedDelivery: parcel.estimatedDelivery
          }
        })
      }

      // Log the update for audit
      console.log(`Notifications sent for parcel ${parcel.trackingId} update by ${updatedBy.email}`)
    } catch (error) {
      console.error('Error sending notifications:', error)
    }
  }

  // Create a new scheduled update
  async createScheduledUpdate(updateData, userId) {
    try {
      const scheduledUpdate = new ScheduledUpdate({
        ...updateData,
        createdBy: userId
      })

      await scheduledUpdate.save()
      
      // Invalidate cache for scheduled updates
      await CacheService.invalidatePattern('scheduled:*')

      return scheduledUpdate
    } catch (error) {
      console.error('Error creating scheduled update:', error)
      throw error
    }
  }

  // Get scheduled updates for a parcel
  async getScheduledUpdates(trackingId) {
    try {
      const cacheKey = `scheduled:${trackingId}`
      let updates = await CacheService.get(cacheKey)

      if (!updates) {
        updates = await ScheduledUpdate.find({
          trackingId,
          isExecuted: false,
          scheduledTime: { $gte: new Date() }
        }).populate('createdBy', 'email firstName lastName')
        .sort({ scheduledTime: 1 })

        await CacheService.set(cacheKey, updates, 300) // 5 minutes cache
      }

      return updates
    } catch (error) {
      console.error('Error getting scheduled updates:', error)
      throw error
    }
  }

  // Cancel a scheduled update
  async cancelScheduledUpdate(updateId, userId) {
    try {
      const update = await ScheduledUpdate.findOneAndDelete({
        _id: updateId,
        createdBy: userId,
        isExecuted: false
      })

      if (!update) {
        throw new Error('Scheduled update not found or already executed')
      }

      // Invalidate cache
      await CacheService.invalidatePattern(`scheduled:${update.trackingId}`)

      return update
    } catch (error) {
      console.error('Error canceling scheduled update:', error)
      throw error
    }
  }

  // Clean up old executed updates (older than 30 days)
  async cleanupOldUpdates() {
    try {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const result = await ScheduledUpdate.deleteMany({
        isExecuted: true,
        executedAt: { $lt: thirtyDaysAgo }
      })

      console.log(`Cleaned up ${result.deletedCount} old scheduled updates`)
    } catch (error) {
      console.error('Error cleaning up old updates:', error)
    }
  }

  // Get scheduler status
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeTasks: this.tasks.size,
      uptime: this.isRunning ? process.uptime() : 0
    }
  }
}

// Create singleton instance
const schedulerService = new ScheduledUpdateService()

export default schedulerService
