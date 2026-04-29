import express from "express"
import Parcel from "../models/Parcel.js"
import TrackingHistory from "../models/TrackingHistory.js"
import { searchTrackingWithAfterShip } from "../services/aftership.js"
import authMiddleware from "../middleware/auth.js"
import validateTrackingId from "../middleware/inputValidation.js"
import AuditService from "../services/audit.js"
import CacheService from "../services/cache.js"
import monitoringService from "../services/monitoring.js"

const router = express.Router()

// Search parcel by tracking ID
router.get("/search/:trackingId", validateTrackingId, authMiddleware, async (req, res) => {
  const startTime = Date.now()
  try {
    const { trackingId } = req.params
    const { courier } = req.query

    // Check cache first
    let parcel = await CacheService.getCachedParcel(trackingId)

    if (!parcel) {
      // Check FreightSight database
      parcel = await Parcel.findOne({ trackingId })

      if (!parcel) {
        // If not found, call AfterShip API
        console.log(`Parcel not found locally, checking AfterShip for ${trackingId}`)
        parcel = await searchTrackingWithAfterShip(trackingId, courier)

        if (!parcel) {
          await AuditService.log({
            userId: req.user?.id || null,
            action: 'VIEW',
            resource: 'Parcel',
            resourceId: trackingId,
            details: { courier, reason: 'Parcel not found' },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            success: false,
            errorMessage: 'Parcel not found in any system'
          })
          return res.status(404).json({ error: "Parcel not found in any system" })
        }

        // Save to database for future reference
        try {
          const newParcel = new Parcel(parcel)
          await newParcel.save()
          console.log("AfterShip parcel saved to database")
        } catch (saveError) {
          console.log("Could not save AfterShip parcel to database:", saveError.message)
        }
      }

      // Cache the parcel data
      await CacheService.setCachedParcel(trackingId, parcel)
    }

    // Save to tracking history
    await TrackingHistory.create({
      userId: req.user?.id || "anonymous",
      trackingId,
      courier: parcel.courier,
      parcelData: parcel,
    })

    // Log successful search
    await AuditService.log({
      userId: req.user?.id || null,
      action: 'PARCEL_VIEWED',
      resource: 'Parcel',
      resourceId: trackingId,
      details: { courier: parcel.courier, status: parcel.status },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true
    })

    // Log metrics
    monitoringService.logRequest(req, res, Date.now() - startTime)
    monitoringService.logParcelOperation('searched', trackingId, req.user?.id)

    res.json(parcel)
  } catch (error) {
    await AuditService.log({
      userId: req.user?.id || null,
      action: 'VIEW',
      resource: 'Parcel',
      resourceId: req.params.trackingId,
      details: { error: error.message },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: false,
      errorMessage: error.message
    })
    
    monitoringService.logError(error, { context: 'parcel_search', trackingId: req.params.trackingId })
    res.status(500).json({ error: error.message })
  }
})

// Get tracking history for user
router.get("/history", authMiddleware, async (req, res) => {
  const startTime = Date.now()
  try {
    const history = await TrackingHistory.find({ userId: req.user.id }).sort({ searchedAt: -1 }).limit(50)

    // Log metrics
    monitoringService.logRequest(req, res, Date.now() - startTime)

    res.json(history)
  } catch (error) {
    monitoringService.logError(error, { context: 'parcel_history', userId: req.user.id })
    res.status(500).json({ error: error.message })
  }
})

router.get("/route/:trackingId", async (req, res) => {
  try {
    const { trackingId } = req.params

    const parcel = await Parcel.findOne({ trackingId })

    if (!parcel) {
      return res.status(404).json({ error: "Parcel not found" })
    }

    // Build route from timeline
    const route = parcel.timeline.map((event) => ({
      lat: event.coordinates?.lat || 0,
      lng: event.coordinates?.lng || 0,
      timestamp: event.timestamp,
      status: event.status,
      location: event.location,
    }))

    res.json({ route })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
