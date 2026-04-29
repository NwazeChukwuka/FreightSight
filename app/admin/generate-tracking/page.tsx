"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"

export default function GenerateTrackingPage() {
  const [courier, setCourier] = useState("FreightSight")
  const [trackingId, setTrackingId] = useState("")
  const [copied, setCopied] = useState(false)

  const generateTrackingId = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/generate-tracking-id`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ courier }),
      })

      if (response.ok) {
        const data = await response.json()
        setTrackingId(data.trackingId)
      }
    } catch (error) {
      console.error("Failed to generate tracking ID:", error)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(trackingId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-8">Generate Tracking ID</h1>

      <div className="glass p-8 max-w-2xl">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Select Courier</label>
            <select
              value={courier}
              onChange={(e) => setCourier(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-smooth"
            >
              <option value="FreightSight" style={{ color: '#111827' }}>FreightSight (FTS)</option>
              <option value="DHL" style={{ color: '#111827' }}>DHL</option>
              <option value="FedEx" style={{ color: '#111827' }}>FedEx</option>
              <option value="UPS" style={{ color: '#111827' }}>UPS</option>
              <option value="USPS" style={{ color: '#111827' }}>USPS</option>
              <option value="Aramex" style={{ color: '#111827' }}>Aramex</option>
              <option value="Royal Mail" style={{ color: '#111827' }}>Royal Mail</option>
            </select>
          </div>

          <button
            onClick={generateTrackingId}
            className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-lg transition-smooth"
          >
            Generate Tracking ID
          </button>

          {trackingId && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <p className="text-sm text-foreground/60 mb-2">Generated Tracking ID</p>
              <div className="flex items-center gap-3">
                <code className="text-2xl font-mono font-bold text-primary flex-1">{trackingId}</code>
                <button
                  onClick={copyToClipboard}
                  className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-smooth"
                >
                  {copied ? <Check size={20} className="text-secondary" /> : <Copy size={20} />}
                </button>
              </div>
            </div>
          )}

          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <p className="text-sm text-foreground/60">
              <strong>Note:</strong> All parcels are handled by FreightSight backend, regardless of the courier format
              selected.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
