"use client"

import { useState } from "react"
import { Calendar, MapPin, Clock, Save, X, Package } from "lucide-react"

interface ScheduledUpdateFormProps {
  parcel?: {
    trackingId: string
    currentLocation: {
      city: string
      country: string
    }
  }
  onClose: () => void
  onSubmit: (data: any) => void
}

export function ScheduledUpdateForm({ parcel, onClose, onSubmit }: ScheduledUpdateFormProps) {
  const [formData, setFormData] = useState({
    trackingId: parcel?.trackingId || "",
    scheduledTime: "",
    location: {
      address: "",
      city: parcel?.currentLocation?.city || "",
      country: parcel?.currentLocation?.country || "",
      coordinates: {
        lat: 0,
        lng: 0
      }
    },
    status: "In Transit",
    notes: ""
  })

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.trackingId) {
      newErrors.trackingId = "Tracking ID is required"
    }

    if (!formData.scheduledTime) {
      newErrors.scheduledTime = "Scheduled time is required"
    } else if (new Date(formData.scheduledTime) <= new Date()) {
      newErrors.scheduledTime = "Scheduled time must be in the future"
    }

    if (!formData.location.city) {
      newErrors.city = "City is required"
    }

    if (!formData.location.country) {
      newErrors.country = "Country is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    try {
      await onSubmit(formData)
      onClose()
    } catch (error) {
      console.error("Submit error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ""
      }))
    }
  }

  const handleLocationChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        [field]: value
      }
    }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ""
      }))
    }
  }

  // Set minimum date to current time
  const getMinDateTime = () => {
    const now = new Date()
    now.setMinutes(now.getMinutes() + 1) // Minimum 1 minute from now
    return now.toISOString().slice(0, 16)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-card rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Clock size={24} />
                Schedule Update
              </h2>
              <p className="text-foreground/60 mt-1">
                Schedule automatic parcel status updates
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-accent rounded-lg transition-smooth"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tracking ID */}
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <Package size={16} />
                Tracking ID
              </label>
              <input
                type="text"
                value={formData.trackingId}
                onChange={(e) => handleChange("trackingId", e.target.value.toUpperCase())}
                className={`w-full px-4 py-3 bg-card border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.trackingId ? "border-destructive" : "border-border"
                }`}
                placeholder="e.g. FTSX48T9ZP237"
                disabled={!!parcel}
              />
              {errors.trackingId && (
                <p className="text-sm text-destructive mt-1">{errors.trackingId}</p>
              )}
            </div>

            {/* Scheduled Time */}
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <Calendar size={16} />
                Scheduled Time
              </label>
              <input
                type="datetime-local"
                value={formData.scheduledTime}
                onChange={(e) => handleChange("scheduledTime", e.target.value)}
                min={getMinDateTime()}
                className={`w-full px-4 py-3 bg-card border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.scheduledTime ? "border-destructive" : "border-border"
                }`}
              />
              {errors.scheduledTime && (
                <p className="text-sm text-destructive mt-1">{errors.scheduledTime}</p>
              )}
              <p className="text-xs text-foreground/60 mt-1">
                Schedule must be at least 1 minute in the future
              </p>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => handleChange("status", e.target.value)}
                className="w-full px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="In Transit">In Transit</option>
                <option value="Out for Delivery">Out for Delivery</option>
                <option value="Delivered">Delivered</option>
                <option value="Delayed">Delayed</option>
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <MapPin size={16} />
                Location
              </label>
              <div className="space-y-3">
                <div>
                  <input
                    type="text"
                    value={formData.location.address}
                    onChange={(e) => handleLocationChange("address", e.target.value)}
                    placeholder="Street address (optional)"
                    className="w-full px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input
                      type="text"
                      value={formData.location.city}
                      onChange={(e) => handleLocationChange("city", e.target.value)}
                      placeholder="City*"
                      className={`w-full px-4 py-3 bg-card border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                        errors.city ? "border-destructive" : "border-border"
                      }`}
                    />
                    {errors.city && (
                      <p className="text-sm text-destructive mt-1">{errors.city}</p>
                    )}
                  </div>
                  <div>
                    <input
                      type="text"
                      value={formData.location.country}
                      onChange={(e) => handleLocationChange("country", e.target.value)}
                      placeholder="Country*"
                      className={`w-full px-4 py-3 bg-card border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                        errors.country ? "border-destructive" : "border-border"
                      }`}
                    />
                    {errors.country && (
                      <p className="text-sm text-destructive mt-1">{errors.country}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="Additional notes about this update..."
                rows={3}
                className="w-full px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>

            {/* Preview */}
            <div className="p-4 bg-muted/30 rounded-lg">
              <h3 className="font-medium mb-2">Preview</h3>
              <div className="text-sm text-foreground/60">
                <p><strong>Tracking ID:</strong> {formData.trackingId || "Not specified"}</p>
                <p><strong>Status:</strong> {formData.status}</p>
                <p><strong>Location:</strong> {formData.location.address || `${formData.location.city}, ${formData.location.country}`}</p>
                <p><strong>Scheduled Time:</strong> {formData.scheduledTime ? new Date(formData.scheduledTime).toLocaleString() : "Not specified"}</p>
                {formData.notes && <p><strong>Notes:</strong> {formData.notes}</p>}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-accent hover:bg-accent/80 text-accent-foreground rounded-lg font-medium transition-smooth"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium flex items-center justify-center gap-2 transition-smooth disabled:opacity-50"
              >
                <Save size={20} />
                {loading ? "Scheduling..." : "Schedule Update"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
