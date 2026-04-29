"use client"

import { Edit2, Trash2 } from "lucide-react"

interface ParcelTableProps {
  parcels: any[]
  onEdit: (parcel: any) => void
  onDelete: (id: string) => void
}

export function ParcelTable({ parcels, onEdit, onDelete }: ParcelTableProps) {
  return (
    <div className="glass p-8 overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/10">
            <th className="text-left py-3 px-4 text-sm font-semibold">Tracking ID</th>
            <th className="text-left py-3 px-4 text-sm font-semibold">Courier</th>
            <th className="text-left py-3 px-4 text-sm font-semibold">Sender</th>
            <th className="text-left py-3 px-4 text-sm font-semibold">Receiver</th>
            <th className="text-left py-3 px-4 text-sm font-semibold">Status</th>
            <th className="text-left py-3 px-4 text-sm font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {parcels.map((parcel) => (
            <tr key={parcel._id} className="border-b border-white/5 hover:bg-white/5 transition-smooth">
              <td className="py-3 px-4 font-mono text-sm">{parcel.trackingId}</td>
              <td className="py-3 px-4">{parcel.courier}</td>
              <td className="py-3 px-4 text-sm">{parcel.sender?.name}</td>
              <td className="py-3 px-4 text-sm">{parcel.receiver?.name}</td>
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
              <td className="py-3 px-4">
                <div className="flex gap-2">
                  <button onClick={() => onEdit(parcel)} className="p-2 hover:bg-white/10 rounded-lg transition-smooth">
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => onDelete(parcel._id)}
                    className="p-2 hover:bg-red-500/20 rounded-lg transition-smooth text-red-400"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
