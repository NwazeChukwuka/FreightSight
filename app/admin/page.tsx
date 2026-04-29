"use client"

import { useEffect, useState } from "react"
import { Package, CheckCircle, AlertCircle, Activity } from "lucide-react"
import { AdminCard } from "@/components/admin-card"
import { RecentParcels } from "@/components/recent-parcels"

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    activeParcels: 0,
    deliveredParcels: 0,
    delayedParcels: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/stats`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setStats(data)
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
      <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <AdminCard icon={Package} title="Active Parcels" value={stats.activeParcels} color="text-primary" />
        <AdminCard icon={CheckCircle} title="Delivered" value={stats.deliveredParcels} color="text-secondary" />
        <AdminCard icon={AlertCircle} title="Delayed" value={stats.delayedParcels} color="text-red-500" />
        <AdminCard icon={Activity} title="System Health" value="100%" color="text-green-500" />
      </div>

      {/* Recent Parcels */}
      <RecentParcels />
    </div>
  )
}
