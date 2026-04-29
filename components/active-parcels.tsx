"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export function ActiveParcels() {
  const [parcels, setParcels] = useState([])

  useEffect(() => {
    const fetchActiveParcels = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/parcels/history`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          const active = data.filter((p: any) =>
            ["Pending", "In Transit", "Out for Delivery"].includes(p.parcelData?.status),
          )
          setParcels(active.slice(0, 5))
        }
      } catch (error) {
        console.error("Failed to fetch active parcels:", error)
      }
    }

    fetchActiveParcels()
  }, [])

  return (
    <div className="glass p-8">
      <h2 className="text-2xl font-bold mb-6">Active Parcels</h2>

      {parcels.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-foreground/60 mb-4">No active parcels</p>
          <Link href="/track" className="text-primary hover:text-primary/80 flex items-center justify-center gap-2">
            Track a parcel <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {parcels.map((parcel: any) => (
            <Link
              key={parcel._id}
              href={`/track?id=${parcel.trackingId}`}
              className="block p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-smooth"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-mono font-semibold">{parcel.trackingId}</p>
                  <p className="text-sm text-foreground/60">{parcel.courier}</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/20 text-primary">
                  {parcel.parcelData?.status}
                </span>
              </div>
              <p className="text-sm text-foreground/70">
                To: {parcel.parcelData?.receiver?.city}, {parcel.parcelData?.receiver?.country}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
