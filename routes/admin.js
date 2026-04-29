import express from "express"
import Parcel from "../models/Parcel.js"
import { authMiddleware, roleMiddleware } from "../middleware/auth.js"
import { adminLimiter } from "../middleware/rateLimit.js"
import { validateParcelCreation, validateParcelUpdate } from "../middleware/inputValidation.js"
import AuditService from "../services/audit.js"
import CacheService from "../services/cache.js"
import monitoringService from "../services/monitoring.js"

const router = express.Router()

// Admin only middleware
router.use(roleMiddleware(["Admin", "Staff"]))
router.use(adminLimiter)

// Generate tracking ID
router.post("/generate-tracking-id", async (req, res) => {
  try {
    const { courier } = req.body

    let trackingId
    const randomStr = Math.random().toString(36).substring(2, 12).toUpperCase()

    switch (courier) {
      case "DHL":
        trackingId = `DHL${Math.floor(Math.random() * 1000000000)}`
        break
      case "FedEx":
        trackingId = `FDX${randomStr}`
        break
      case "UPS":
        trackingId = `1Z${randomStr}`
        break
      default:
        trackingId = `FTS${randomStr}`
    }

    res.json({ trackingId })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create new parcel
router.post("/parcels", validateParcelCreation, async (req, res) => {
  const startTime = Date.now()
  try {
    const parcel = new Parcel(req.body)
    await parcel.save()

    // Invalidate cache
    await CacheService.invalidatePattern('api:*')

    // Log parcel creation
    await AuditService.log({
      userId: req.user.id,
      action: 'PARCEL_CREATED',
      resource: 'Parcel',
      resourceId: parcel._id,
      details: { 
        trackingId: parcel.trackingId, 
        courier: parcel.courier,
        sender: parcel.sender.email,
        receiver: parcel.receiver.email
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true
    })

    // Log metrics
    monitoringService.logRequest(req, res, Date.now() - startTime)
    monitoringService.logParcelOperation('created', parcel.trackingId, req.user.id)

    res.status(201).json(parcel)
  } catch (error) {
    await AuditService.log({
      userId: req.user.id,
      action: 'PARCEL_CREATED',
      resource: 'Parcel',
      resourceId: 'unknown',
      details: { error: error.message, ...req.body },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: false,
      errorMessage: error.message
    })
    
    monitoringService.logError(error, { context: 'parcel_creation', userId: req.user.id })
    res.status(500).json({ error: error.message })
  }
})

// Update parcel status
router.patch("/parcels/:id", validateParcelUpdate, async (req, res) => {
  const startTime = Date.now()
  try {
    const oldParcel = await Parcel.findById(req.params.id)
    if (!oldParcel) {
      return res.status(404).json({ error: "Parcel not found" })
    }

    const parcel = await Parcel.findByIdAndUpdate(req.params.id, req.body, { new: true })
    
    // Invalidate cache for this parcel
    await CacheService.invalidateParcel(parcel.trackingId)

    // Log parcel update
    await AuditService.log({
      userId: req.user.id,
      action: 'PARCEL_UPDATED',
      resource: 'Parcel',
      resourceId: parcel._id,
      details: { 
        trackingId: parcel.trackingId,
        oldStatus: oldParcel.status,
        newStatus: parcel.status,
        changes: req.body
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true
    })

    // Log metrics
    monitoringService.logRequest(req, res, Date.now() - startTime)
    monitoringService.logParcelOperation('updated', parcel.trackingId, req.user.id)

    res.json(parcel)
  } catch (error) {
    await AuditService.log({
      userId: req.user.id,
      action: 'PARCEL_UPDATED',
      resource: 'Parcel',
      resourceId: req.params.id,
      details: { error: error.message, ...req.body },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: false,
      errorMessage: error.message
    })
    
    monitoringService.logError(error, { context: 'parcel_update', userId: req.user.id, parcelId: req.params.id })
    res.status(500).json({ error: error.message })
  }
})

// Get all parcels (admin only)
router.get("/parcels", roleMiddleware(["Admin"]), async (req, res) => {
  try {
    const parcels = await Parcel.find().limit(100)
    res.json(parcels)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get dashboard stats
router.get("/stats", async (req, res) => {
  try {
    const stats = {
      activeParcels: await Parcel.countDocuments({ status: { $in: ["Pending", "In Transit", "Out for Delivery"] } }),
      deliveredParcels: await Parcel.countDocuments({ status: "Delivered" }),
      delayedParcels: await Parcel.countDocuments({ status: "Delayed" }),
    }
    res.json(stats)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
