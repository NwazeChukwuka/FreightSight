import express from "express"
import { generateAIResponse, parseUserIntent } from "../services/ai-chat.js"
import Parcel from "../models/Parcel.js"

const router = express.Router()

router.post("/message", async (req, res) => {
  try {
    const { message, trackingId } = req.body

    if (!message) {
      return res.status(400).json({ error: "Message is required" })
    }

    // Parse user intent
    const intent = parseUserIntent(message)

    // Get parcel context if tracking ID provided
    let context = {}
    if (trackingId) {
      const parcel = await Parcel.findOne({ trackingId })
      if (parcel) {
        context = {
          trackingId: parcel.trackingId,
          status: parcel.status,
          location: `${parcel.currentLocation?.city}, ${parcel.currentLocation?.country}`,
          estimatedDelivery: parcel.estimatedDelivery,
        }
      }
    }

    // Generate AI response
    const aiResponse = await generateAIResponse(message, context)

    res.json({
      message: aiResponse,
      intent,
      context,
    })
  } catch (error) {
    console.error("Chat error:", error)
    res.status(500).json({ error: error.message })
  }
})

export default router
