"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"

interface TrackingSearchProps {
  onSearch?: (trackingId: string, courier: string) => void
}

export function TrackingSearch({ onSearch }: TrackingSearchProps) {
  const [trackingId, setCourierTrackingId] = useState("")
  const [courier, setCourier] = useState("FreightSight")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()

    if (trackingId.length < 13) {
      alert("Tracking ID must be at least 13 characters")
      return
    }

    if (onSearch) {
      onSearch(trackingId, courier)
      return
    }

    setLoading(true)
    try {
      // Redirect to tracking page with query params
      router.push(`/track?id=${trackingId}&courier=${courier}`)
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSearch} className="glass p-8 max-w-2xl mx-auto">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Enter Tracking ID</label>
          <input
            type="text"
            placeholder="e.g. DHL9843782922 or FTSX48T9ZP237"
            value={trackingId}
            onChange={(e) => setCourierTrackingId(e.target.value.toUpperCase())}
            className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground placeholder-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary transition-smooth"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Select Courier (Optional)</label>
          <select
            value={courier}
            onChange={(e) => setCourier(e.target.value)}
            className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-smooth"
          >
            <option value="FreightSight" className="bg-background text-foreground">FreightSight</option>
            <option value="DHL" className="bg-background text-foreground">DHL</option>
            <option value="FedEx" className="bg-background text-foreground">FedEx</option>
            <option value="UPS" className="bg-background text-foreground">UPS</option>
            <option value="USPS" className="bg-background text-foreground">USPS</option>
            <option value="Aramex" className="bg-background text-foreground">Aramex</option>
            <option value="Royal Mail" className="bg-background text-foreground">Royal Mail</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-primary-foreground font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-smooth"
        >
          <Search size={20} />
          {loading ? "Searching..." : "Track Parcel"}
        </button>
      </div>
    </form>
  )
}
