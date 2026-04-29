import mongoose from "mongoose"

const trackingHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  trackingId: String,
  courier: String,
  searchedAt: {
    type: Date,
    default: Date.now,
  },
  parcelData: mongoose.Schema.Types.Mixed,
})

export default mongoose.model("TrackingHistory", trackingHistorySchema)
