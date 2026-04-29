"use client"

import { useEffect, useState } from "react"
import { Package, CheckCircle, AlertCircle } from "lucide-react"
import { UserCard } from "@/components/user-card"
import { ActiveParcels } from "@/components/active-parcels"

export default function UserDashboard() {
  const [stats, setStats] = useState({
    activeParcels: 0,
    deliveredParcels: 0,
    delayedParcels: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
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
          ).length
          const delivered = data.filter((p: any) => p.parcelData?.status === "Delivered").length
          const delayed = data.filter((p: any) => p.parcelData?.status === "Delayed").length

          setStats({
            activeParcels: active,
            deliveredParcels: delivered,
            delayedParcels: delayed,
          })
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-8">My Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <UserCard icon={Package} title="Active Parcels" value={stats.activeParcels} color="text-primary" />
        <UserCard icon={CheckCircle} title="Delivered" value={stats.deliveredParcels} color="text-secondary" />
        <UserCard icon={AlertCircle} title="Delayed" value={stats.delayedParcels} color="text-red-500" />
      </div>

      {/* Active Parcels */}
      <ActiveParcels />
    </div>
  )
}
