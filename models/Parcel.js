import mongoose from "mongoose"

const parcelSchema = new mongoose.Schema({
  trackingId: {
    type: String,
    required: true,
    unique: true,
  },
  courier: {
    type: String,
    enum: ["FreightSight", "DHL", "FedEx", "UPS", "USPS", "Aramex", "Royal Mail"],
    default: "FreightSight",
  },
  sender: {
    name: String,
    email: String,
    phone: String,
    address: String,
    city: String,
    country: String,
    coordinates: {
      lat: Number,
      lng: Number,
    },
  },
  receiver: {
    name: String,
    email: String,
    phone: String,
    address: String,
    city: String,
    country: String,
    coordinates: {
      lat: Number,
      lng: Number,
    },
  },
  status: {
    type: String,
    enum: ["Pending", "In Transit", "Out for Delivery", "Delivered", "Delayed", "Returned"],
    default: "Pending",
  },
  currentLocation: {
    address: String,
    city: String,
    country: String,
    coordinates: {
      lat: Number,
      lng: Number,
    },
    timestamp: Date,
  },
  estimatedDelivery: Date,
  weight: String,
  dimensions: String,
  contents: String,
  timeline: [
    {
      status: String,
      location: String,
      timestamp: Date,
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
  ],
  route: [
    {
      lat: Number,
      lng: Number,
      timestamp: Date,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

export default mongoose.model("Parcel", parcelSchema)
