"use client"

import { useEffect, useState } from "react"

export function RecentParcels() {
  const [parcels, setParcels] = useState([])

  useEffect(() => {
    const fetchRecentParcels = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/parcels?limit=5`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setParcels(data.slice(0, 5))
        }
      } catch (error) {
        console.error("Failed to fetch recent parcels:", error)
      }
    }

    fetchRecentParcels()
  }, [])

  return (
    <div className="glass p-8">
      <h2 className="text-2xl font-bold mb-6">Recent Parcels</h2>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-3 px-4 text-sm font-semibold">Tracking ID</th>
              <th className="text-left py-3 px-4 text-sm font-semibold">Courier</th>
              <th className="text-left py-3 px-4 text-sm font-semibold">Status</th>
              <th className="text-left py-3 px-4 text-sm font-semibold">Destination</th>
            </tr>
          </thead>
          <tbody>
            {parcels.map((parcel: any) => (
              <tr key={parcel._id} className="border-b border-white/5 hover:bg-white/5 transition-smooth">
                <td className="py-3 px-4 font-mono text-sm">{parcel.trackingId}</td>
                <td className="py-3 px-4">{parcel.courier}</td>
                <td className="py-3 px-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      parcel.status === "Delivered"
                        ? "bg-secondary/20 text-secondary"
                        : parcel.status === "Delayed"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-primary/20 text-primary"
                    }`}
                  >
                    {parcel.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm">{parcel.receiver?.city}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
