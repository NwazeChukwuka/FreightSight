import express from 'express'
import ScheduledUpdate from '../models/ScheduledUpdate.js'
import Parcel from '../models/Parcel.js'
import schedulerService from '../services/scheduler.js'
import CacheService from '../services/cache.js'
import { authMiddleware, roleMiddleware } from '../middleware/auth.js'
import { validateScheduledUpdate, validateTrackingId } from '../middleware/inputValidation.js'
import { adminLimiter } from '../middleware/rateLimit.js'

const router = express.Router()

// Apply auth middleware to all routes
router.use(authMiddleware)

// Apply admin/staff role requirement
router.use(roleMiddleware(['Admin', 'Staff']))

// Create a new scheduled update
router.post('/', adminLimiter, validateScheduledUpdate, async (req, res) => {
  try {
    const { trackingId, scheduledTime, location, status, notes } = req.body

    // Verify parcel exists
    const parcel = await Parcel.findOne({ trackingId })
    if (!parcel) {
      return res.status(404).json({ error: 'Parcel not found' })
    }

    // Check if scheduled time is in the future
    if (new Date(scheduledTime) <= new Date()) {
      return res.status(400).json({ error: 'Scheduled time must be in the future' })
    }

    // Create scheduled update
    const scheduledUpdate = await schedulerService.createScheduledUpdate({
      trackingId,
      scheduledTime: new Date(scheduledTime),
      location,
      status,
      notes
    }, req.user.id)

    res.status(201).json({
      message: 'Scheduled update created successfully',
      scheduledUpdate
    })
  } catch (error) {
    console.error('Create scheduled update error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get all scheduled updates for a parcel
router.get('/:trackingId', validateTrackingId, async (req, res) => {
  try {
    const { trackingId } = req.params
    const { includeExecuted = false } = req.query

    let updates
    if (includeExecuted === 'true') {
      updates = await ScheduledUpdate.find({ trackingId })
        .populate('createdBy', 'email firstName lastName')
        .sort({ scheduledTime: -1 })
    } else {
      updates = await schedulerService.getScheduledUpdates(trackingId)
    }

    res.json({ scheduledUpdates: updates })
  } catch (error) {
    console.error('Get scheduled updates error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Cancel a scheduled update
router.delete('/:updateId', adminLimiter, async (req, res) => {
  try {
    const { updateId } = req.params

    const cancelledUpdate = await schedulerService.cancelScheduledUpdate(updateId, req.user.id)

    res.json({
      message: 'Scheduled update cancelled successfully',
      cancelledUpdate
    })
  } catch (error) {
    console.error('Cancel scheduled update error:', error)
    if (error.message === 'Scheduled update not found or already executed') {
      return res.status(404).json({ error: error.message })
    }
    res.status(500).json({ error: error.message })
  }
})

// Update a scheduled update (only if not executed)
router.patch('/:updateId', adminLimiter, async (req, res) => {
  try {
    const { updateId } = req.params
    const { scheduledTime, location, status, notes } = req.body

    const update = await ScheduledUpdate.findOne({
      _id: updateId,
      isExecuted: false
    })

    if (!update) {
      return res.status(404).json({ error: 'Scheduled update not found or already executed' })
    }

    // Check ownership (admin can update any, staff only their own)
    if (req.user.role !== 'Admin' && update.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You can only update your own scheduled updates' })
    }

    // Update fields
    if (scheduledTime) {
      if (new Date(scheduledTime) <= new Date()) {
        return res.status(400).json({ error: 'Scheduled time must be in the future' })
      }
      update.scheduledTime = new Date(scheduledTime)
    }

    if (location) update.location = location
    if (status) update.status = status
    if (notes !== undefined) update.notes = notes

    await update.save()

    // Invalidate cache
    await CacheService.invalidatePattern(`scheduled:${update.trackingId}`)

    res.json({
      message: 'Scheduled update updated successfully',
      scheduledUpdate: update
    })
  } catch (error) {
    console.error('Update scheduled update error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get all scheduled updates for current user (staff only see their own)
router.get('/', adminLimiter, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query
    const skip = (page - 1) * limit

    let query = {}
    if (req.user.role === 'Staff') {
      query.createdBy = req.user.id
    }

    if (status === 'executed') {
      query.isExecuted = true
    } else if (status === 'pending') {
      query.isExecuted = false
    }

    const updates = await ScheduledUpdate.find(query)
      .populate('trackingId', 'trackingId courier')
      .populate('createdBy', 'email firstName lastName')
      .sort({ scheduledTime: -1 })
      .skip(skip)
      .limit(parseInt(limit))

    const total = await ScheduledUpdate.countDocuments(query)

    res.json({
      scheduledUpdates: updates,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Get all scheduled updates error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get scheduler status (admin only)
router.get('/system/status', roleMiddleware(['Admin']), async (req, res) => {
  try {
    const status = schedulerService.getStatus()
    const cacheHealth = await CacheService.healthCheck()

    res.json({
      scheduler: status,
      cache: cacheHealth
    })
  } catch (error) {
    console.error('Get scheduler status error:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
