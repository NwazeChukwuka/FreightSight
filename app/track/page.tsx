"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { TrackingDetails } from "@/components/tracking-details"
import { TrackingTimeline } from "@/components/tracking-timeline"
import { TrackingMap } from "@/components/tracking-map"
import { TrackingSearch } from "@/components/tracking-search"
import { AIChatWidget } from "@/components/ai-chat-widget"
import { Loader, Search, Package } from "lucide-react"

interface Parcel {
  trackingId: string
  courier: string
  status: string
  sender: {
    name: string
    email: string
    address: string
    city: string
    country: string
  }
  receiver: {
    name: string
    email: string
    address: string
    city: string
    country: string
  }
  currentLocation: {
    address: string
    city: string
    country: string
    timestamp: string
  }
  estimatedDelivery: string
  timeline: Array<{
    status: string
    location: string
    timestamp: string
  }>
  createdAt: string
  updatedAt: string
}

export default function TrackPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const trackingId = searchParams.get("id")
  const courier = searchParams.get("courier")
  const [parcel, setParcel] = useState<Parcel | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [searchMode, setSearchMode] = useState(!trackingId)

  useEffect(() => {
    if (trackingId) {
      fetchParcel(trackingId, courier)
    }
  }, [trackingId, courier])

  const fetchParcel = async (id: string, courierName?: string | null) => {
    setLoading(true)
    setError("")
    setParcel(null)

    try {
      const url = courierName 
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/parcels/search/${id}?courier=${courierName}`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/parcels/search/${id}`

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      })

      if (!response.ok) {
        throw new Error("Parcel not found")
      }

      const data = await response.json()
      setParcel(data)
      setSearchMode(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch parcel")
      setParcel(null)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (id: string, courierName: string) => {
    router.push(`/track?id=${encodeURIComponent(id)}${courierName ? `&courier=${encodeURIComponent(courierName)}` : ''}`)
  }

  if (searchMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center">
                <Package className="w-10 h-10 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-4">Track Your Parcel</h1>
            <p className="text-foreground/70 text-lg max-w-2xl mx-auto">
              Enter your tracking ID to get real-time updates on your package location and delivery status
            </p>
          </div>

          {/* Search Component */}
          <div className="glass rounded-2xl p-8">
            <TrackingSearch onSearch={handleSearch} />
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Real-time Tracking</h3>
              <p className="text-foreground/70 text-sm">Get instant updates on your parcel location</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Multiple Couriers</h3>
              <p className="text-foreground/70 text-sm">Track packages from DHL, FedEx, UPS, and more</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Loader className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Live Updates</h3>
              <p className="text-foreground/70 text-sm">Receive notifications as your package moves</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-foreground/70">Tracking your parcel...</p>
        </div>
      </div>
    )
  }

  if (error && !parcel) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center px-4">
        <div className="glass p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Parcel Not Found</h2>
          <p className="text-foreground/70 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => setSearchMode(true)}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg transition-smooth"
            >
              Search Another Parcel
            </button>
            <a
              href="/"
              className="block bg-accent hover:bg-accent/80 text-accent-foreground px-6 py-3 rounded-lg transition-smooth"
            >
              Back to Home
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header with search again option */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">Tracking Details</h1>
            {parcel && (
              <p className="text-foreground/70 mt-2">
                Tracking ID: <span className="font-mono text-primary">{parcel.trackingId}</span>
              </p>
            )}
          </div>
          <button
            onClick={() => setSearchMode(true)}
            className="bg-accent hover:bg-accent/80 text-accent-foreground px-4 py-2 rounded-lg transition-smooth"
          >
            Track Another
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Details & Timeline */}
          <div className="lg:col-span-2 space-y-8">
            {parcel && (
              <>
                <TrackingDetails parcel={parcel} />
                <TrackingTimeline parcel={parcel} />
              </>
            )}
          </div>

          {/* Right Column - Map */}
          <div>{parcel && <TrackingMap parcel={parcel} />}</div>
        </div>
      </div>

      {/* AI Chat Widget */}
      <AIChatWidget trackingId={trackingId || undefined} />
    </div>
  )
}
