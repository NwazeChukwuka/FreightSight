"use client"

import { useEffect, useState } from "react"
import { Loader, Search, Trash2 } from "lucide-react"

export default function TrackingHistoryPage() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/parcels/history`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setHistory(data)
      }
    } catch (error) {
      console.error("Failed to fetch history:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this from history?")) return

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/parcels/history/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      setHistory(history.filter((h) => h._id !== id))
    } catch (error) {
      console.error("Failed to delete history:", error)
    }
  }

  const filteredHistory = history.filter((h) => h.trackingId.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-8">Tracking History</h1>

      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-3 text-foreground/50" size={20} />
          <input
            type="text"
            placeholder="Search tracking ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-lg pl-12 pr-4 py-3 text-foreground placeholder-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary transition-smooth"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="glass p-12 text-center">
          <p className="text-foreground/60">No tracking history found</p>
        </div>
      ) : (
        <div className="glass overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-sm font-semibold">Tracking ID</th>
                <th className="text-left py-3 px-4 text-sm font-semibold">Courier</th>
                <th className="text-left py-3 px-4 text-sm font-semibold">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold">Searched</th>
                <th className="text-left py-3 px-4 text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((item) => (
                <tr key={item._id} className="border-b border-white/5 hover:bg-white/5 transition-smooth">
                  <td className="py-3 px-4 font-mono text-sm">{item.trackingId}</td>
                  <td className="py-3 px-4">{item.courier}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        item.parcelData?.status === "Delivered"
                          ? "bg-secondary/20 text-secondary"
                          : item.parcelData?.status === "Delayed"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-primary/20 text-primary"
                      }`}
                    >
                      {item.parcelData?.status || "Unknown"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm">{new Date(item.searchedAt).toLocaleDateString()}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition-smooth text-red-400"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
