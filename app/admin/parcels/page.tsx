"use client"

import { useEffect, useState } from "react"
import { Plus, Loader } from "lucide-react"
import { ParcelForm } from "@/components/parcel-form"
import { ParcelTable } from "@/components/parcel-table"

export default function ParcelsPage() {
  const [parcels, setParcels] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingParcel, setEditingParcel] = useState(null)

  useEffect(() => {
    fetchParcels()
  }, [])

  const fetchParcels = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/parcels`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setParcels(data)
      }
    } catch (error) {
      console.error("Failed to fetch parcels:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this parcel?")) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/parcels/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (response.ok) {
        setParcels(parcels.filter((p) => p._id !== id))
      }
    } catch (error) {
      console.error("Failed to delete parcel:", error)
    }
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Parcel Management</h1>
        <button
          onClick={() => {
            setEditingParcel(null)
            setShowForm(!showForm)
          }}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg flex items-center gap-2 transition-smooth"
        >
          <Plus size={20} />
          New Parcel
        </button>
      </div>

      {showForm && (
        <ParcelForm
          parcel={editingParcel}
          onClose={() => {
            setShowForm(false)
            setEditingParcel(null)
            fetchParcels()
          }}
        />
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <ParcelTable
          parcels={parcels}
          onEdit={(parcel) => {
            setEditingParcel(parcel)
            setShowForm(true)
          }}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
