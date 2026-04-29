"use client"

import type React from "react"

import { useState } from "react"
import { X } from "lucide-react"

interface ParcelFormProps {
  parcel?: any
  onClose: () => void
}

export function ParcelForm({ parcel, onClose }: ParcelFormProps) {
  const [formData, setFormData] = useState(
    parcel || {
      trackingId: "",
      courier: "FreightSight",
      sender: { name: "", email: "", phone: "", address: "", city: "", country: "" },
      receiver: { name: "", email: "", phone: "", address: "", city: "", country: "" },
      status: "Pending",
      estimatedDelivery: "",
    },
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const method = parcel ? "PATCH" : "POST"
      const url = parcel
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/admin/parcels/${parcel._id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/admin/parcels`

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        onClose()
      }
    } catch (error) {
      console.error("Failed to save parcel:", error)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="glass p-8 max-w-2xl w-full max-h-96 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{parcel ? "Edit Parcel" : "Create New Parcel"}</h2>
          <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-lg transition-smooth">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Tracking ID"
              value={formData.trackingId}
              onChange={(e) => setFormData({ ...formData, trackingId: e.target.value })}
              className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-foreground placeholder-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
            <select
              value={formData.courier}
              onChange={(e) => setFormData({ ...formData, courier: e.target.value })}
              className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="FreightSight">FreightSight</option>
              <option value="DHL">DHL</option>
              <option value="FedEx">FedEx</option>
              <option value="UPS">UPS</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Sender Name"
              value={formData.sender.name}
              onChange={(e) => setFormData({ ...formData, sender: { ...formData.sender, name: e.target.value } })}
              className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-foreground placeholder-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="text"
              placeholder="Receiver Name"
              value={formData.receiver.name}
              onChange={(e) => setFormData({ ...formData, receiver: { ...formData.receiver, name: e.target.value } })}
              className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-foreground placeholder-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="Pending">Pending</option>
            <option value="In Transit">In Transit</option>
            <option value="Out for Delivery">Out for Delivery</option>
            <option value="Delivered">Delivered</option>
            <option value="Delayed">Delayed</option>
            <option value="Returned">Returned</option>
          </select>

          <input
            type="date"
            value={formData.estimatedDelivery}
            onChange={(e) => setFormData({ ...formData, estimatedDelivery: e.target.value })}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2 rounded-lg transition-smooth"
            >
              {parcel ? "Update" : "Create"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white/10 hover:bg-white/20 text-foreground font-semibold py-2 rounded-lg transition-smooth"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
