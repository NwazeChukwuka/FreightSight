import axios from "axios"

const AFTERSHIP_API_KEY = process.env.AFTERSHIP_API_KEY
const AFTERSHIP_BASE_URL = "https://api.aftership.com/v4"

const aftershipClient = axios.create({
  baseURL: AFTERSHIP_BASE_URL,
  headers: {
    "AAS-API-KEY": AFTERSHIP_API_KEY,
    "Content-Type": "application/json",
  },
})

export const searchTrackingWithAfterShip = async (trackingId, courier = null) => {
  try {
    // Build query params
    const params = {
      tracking_numbers: trackingId,
    }

    if (courier) {
      params.slug = courier.toLowerCase()
    }

    const response = await aftershipClient.get("/trackings", { params })

    if (response.data.data.trackings && response.data.data.trackings.length > 0) {
      const tracking = response.data.data.trackings[0]

      // Transform AfterShip data to FreightSight format
      return {
        trackingId: tracking.tracking_number,
        courier: tracking.slug.toUpperCase(),
        status: mapAfterShipStatus(tracking.status),
        currentLocation: {
          address: tracking.origin_address?.address || "Unknown",
          city: tracking.origin_address?.city || "Unknown",
          country: tracking.origin_address?.country_name || "Unknown",
          coordinates: {
            lat: tracking.origin_address?.latitude || 0,
            lng: tracking.origin_address?.longitude || 0,
          },
          timestamp: new Date(tracking.updated_at),
        },
        estimatedDelivery: tracking.expected_delivery ? new Date(tracking.expected_delivery) : null,
        timeline: transformAfterShipCheckpoints(tracking.checkpoints || []),
        sender: {
          name: "External Courier",
          address: tracking.origin_address?.address || "Unknown",
          city: tracking.origin_address?.city || "Unknown",
          country: tracking.origin_address?.country_name || "Unknown",
        },
        receiver: {
          name: "Recipient",
          address: tracking.destination_address?.address || "Unknown",
          city: tracking.destination_address?.city || "Unknown",
          country: tracking.destination_address?.country_name || "Unknown",
        },
      }
    }

    return null
  } catch (error) {
    console.error("AfterShip API error:", error.message)
    return null
  }
}

const mapAfterShipStatus = (status) => {
  const statusMap = {
    pending: "Pending",
    info_received: "Pending",
    in_transit: "In Transit",
    out_for_delivery: "Out for Delivery",
    delivered: "Delivered",
    exception: "Delayed",
    expired: "Returned",
  }

  return statusMap[status] || "Pending"
}

const transformAfterShipCheckpoints = (checkpoints) => {
  return checkpoints.map((checkpoint) => ({
    status: checkpoint.tag || "Update",
    location: `${checkpoint.city || ""}, ${checkpoint.country_name || ""}`.trim(),
    timestamp: new Date(checkpoint.checkpoint_time),
    coordinates: {
      lat: checkpoint.latitude || 0,
      lng: checkpoint.longitude || 0,
    },
  }))
}

export default aftershipClient
