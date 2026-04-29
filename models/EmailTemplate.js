import mongoose from "mongoose"

const emailTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  type: {
    type: String,
    enum: ["parcel_update", "welcome", "delay_alert", "delivery_confirmation", "custom"],
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  htmlContent: {
    type: String,
    required: true,
  },
  variables: [{
    name: String,
    description: String,
    required: Boolean,
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization",
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

emailTemplateSchema.pre("save", function (next) {
  this.updatedAt = new Date()
  next()
})

export default mongoose.model("EmailTemplate", emailTemplateSchema)
