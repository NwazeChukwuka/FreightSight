"use client"

import { useState, useEffect } from "react"
import { Search, Plus, Edit, Trash2, Clock, MapPin, Package, Calendar, Bell, Settings } from "lucide-react"
import { ExportButtons } from "./export-buttons"
import { AdvancedFilters } from "./advanced-filters"
import { ParcelCardSkeleton, SearchSkeleton } from "./skeleton-loader"

interface Parcel {
  _id: string
  trackingId: string
  courier: string
  status: string
  weight?: string
  dimensions?: string
  contents?: string
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

interface ScheduledUpdate {
  _id: string
  trackingId: string
  scheduledTime: string
  location: {
    address: string
    city: string
    country: string
  }
  status: string
  notes: string
  isExecuted: boolean
  createdBy: {
    email: string
    firstName: string
    lastName: string
  }
  createdAt: string
}

export function AdminParcelManager() {
  const [parcels, setParcels] = useState<Parcel[]>([])
  const [scheduledUpdates, setScheduledUpdates] = useState<ScheduledUpdate[]>([])
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [showScheduledForm, setShowScheduledForm] = useState(false)
  const [showParcelForm, setShowParcelForm] = useState(false)
  const [activeTab, setActiveTab] = useState("parcels")
  const [advancedFilters, setAdvancedFilters] = useState<{
    status: string[]
    courier: string[]
    dateRange: { start: string; end: string }
    weightRange: { min: string; max: string }
    location: string
    senderName: string
    receiverName: string
    trackingId: string
  }>({
    status: [],
    courier: [],
    dateRange: { start: "", end: "" },
    weightRange: { min: "", max: "" },
    location: "",
    senderName: "",
    receiverName: "",
    trackingId: ""
  })

  useEffect(() => {
    fetchParcels()
    fetchScheduledUpdates()
  }, [])

  const fetchParcels = async () => {
    try {
      const response = await fetch("/api/admin/parcels", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      const data = await response.json()
      setParcels(data)
    } catch (error) {
      console.error("Error fetching parcels:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchScheduledUpdates = async () => {
    try {
      const response = await fetch("/api/scheduled-updates", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      const data = await response.json()
      setScheduledUpdates(data.scheduledUpdates || [])
    } catch (error) {
      console.error("Error fetching scheduled updates:", error)
    }
  }

  const filteredParcels = parcels.filter(parcel => {
    // Basic search
    const matchesSearch = searchTerm === "" || 
      parcel.trackingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      parcel.sender.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      parcel.receiver.name.toLowerCase().includes(searchTerm.toLowerCase())

    // Basic status filter
    const matchesStatus = statusFilter === "all" || parcel.status === statusFilter

    // Advanced filters
    const matchesAdvancedStatus = advancedFilters.status.length === 0 || 
      advancedFilters.status.includes(parcel.status)

    const matchesAdvancedCourier = advancedFilters.courier.length === 0 || 
      advancedFilters.courier.includes(parcel.courier)

    const matchesTrackingId = advancedFilters.trackingId === "" || 
      parcel.trackingId.toLowerCase().includes(advancedFilters.trackingId.toLowerCase())

    const matchesSenderName = advancedFilters.senderName === "" || 
      parcel.sender.name.toLowerCase().includes(advancedFilters.senderName.toLowerCase())

    const matchesReceiverName = advancedFilters.receiverName === "" || 
      parcel.receiver.name.toLowerCase().includes(advancedFilters.receiverName.toLowerCase())

    const matchesLocation = advancedFilters.location === "" || 
      (parcel.currentLocation?.city && parcel.currentLocation.city.toLowerCase().includes(advancedFilters.location.toLowerCase())) ||
      (parcel.sender.city && parcel.sender.city.toLowerCase().includes(advancedFilters.location.toLowerCase())) ||
      (parcel.receiver.city && parcel.receiver.city.toLowerCase().includes(advancedFilters.location.toLowerCase()))

    const matchesDateRange = () => {
      if (!advancedFilters.dateRange.start && !advancedFilters.dateRange.end) return true
      const parcelDate = new Date(parcel.createdAt)
      const startDate = advancedFilters.dateRange.start ? new Date(advancedFilters.dateRange.start) : null
      const endDate = advancedFilters.dateRange.end ? new Date(advancedFilters.dateRange.end) : null
      if (startDate && parcelDate < startDate) return false
      if (endDate && parcelDate > endDate) return false
      return true
    }

    const matchesWeightRange = () => {
      if (!advancedFilters.weightRange.min && !advancedFilters.weightRange.max) return true
      const weight = parseFloat(parcel.weight || "0") || 0
      const minWeight = parseFloat(advancedFilters.weightRange.min) || 0
      const maxWeight = parseFloat(advancedFilters.weightRange.max) || Infinity
      return weight >= minWeight && weight <= maxWeight
    }

    return matchesSearch && 
           matchesStatus && 
           matchesAdvancedStatus && 
           matchesAdvancedCourier && 
           matchesTrackingId && 
           matchesSenderName && 
           matchesReceiverName && 
           matchesLocation && 
           matchesDateRange() && 
           matchesWeightRange()
  })

  const clearAdvancedFilters = () => {
    setAdvancedFilters({
      status: [],
      courier: [],
      dateRange: { start: "", end: "" },
      weightRange: { min: "", max: "" },
      location: "",
      senderName: "",
      receiverName: "",
      trackingId: ""
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Delivered": return "bg-green-500"
      case "In Transit": return "bg-blue-500"
      case "Out for Delivery": return "bg-orange-500"
      case "Delayed": return "bg-red-500"
      case "Pending": return "bg-gray-500"
      default: return "bg-gray-500"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Parcel Management</h1>
            <p className="text-foreground/70">Manage parcels and schedule updates</p>
          </div>
          <div className="flex gap-3">
            <ExportButtons 
              data={filteredParcels} 
              filename="parcels-export" 
              type="parcels"
              className="flex gap-2"
            />
            <button
              onClick={() => setShowParcelForm(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2 transition-smooth"
            >
              <Plus size={20} />
              New Parcel
            </button>
            <button
              onClick={() => setShowScheduledForm(true)}
              className="bg-secondary hover:bg-secondary/90 text-secondary-foreground px-4 py-2 rounded-lg flex items-center gap-2 transition-smooth"
            >
              <Clock size={20} />
              Schedule Update
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b">
          <button
            onClick={() => setActiveTab("parcels")}
            className={`pb-3 px-4 font-medium transition-smooth ${
              activeTab === "parcels" 
                ? "text-primary border-b-2 border-primary" 
                : "text-foreground/60 hover:text-foreground"
            }`}
          >
            <Package size={20} className="inline mr-2" />
            Parcels ({parcels.length})
          </button>
          <button
            onClick={() => setActiveTab("scheduled")}
            className={`pb-3 px-4 font-medium transition-smooth ${
              activeTab === "scheduled" 
                ? "text-primary border-b-2 border-primary" 
                : "text-foreground/60 hover:text-foreground"
            }`}
          >
            <Clock size={20} className="inline mr-2" />
            Scheduled Updates ({scheduledUpdates.filter(u => !u.isExecuted).length})
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-foreground/40" size={20} />
            <input
              type="text"
              placeholder="Search parcels..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Status</option>
            <option value="Pending">Pending</option>
            <option value="In Transit">In Transit</option>
            <option value="Out for Delivery">Out for Delivery</option>
            <option value="Delivered">Delivered</option>
            <option value="Delayed">Delayed</option>
          </select>
        </div>

        {/* Advanced Filters */}
        <AdvancedFilters
          filters={advancedFilters}
          onFiltersChange={setAdvancedFilters}
          onClearFilters={clearAdvancedFilters}
          className="mb-6"
        />

        {/* Parcels Tab */}
        {activeTab === "parcels" && (
          <div className="grid gap-4">
            {loading ? (
              <>
                <SearchSkeleton />
                {Array.from({ length: 5 }).map((_, i) => (
                  <ParcelCardSkeleton key={i} />
                ))}
              </>
            ) : filteredParcels.length === 0 ? (
              <div className="text-center py-12">
                <Package size={48} className="mx-auto text-foreground/20 mb-4" />
                <p className="text-foreground/60">No parcels found</p>
              </div>
            ) : (
              filteredParcels.map((parcel) => (
                <div
                  key={parcel._id}
                  className="glass p-6 rounded-lg hover:bg-card/80 transition-smooth cursor-pointer"
                  onClick={() => setSelectedParcel(parcel)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-1">{parcel.trackingId}</h3>
                      <p className="text-sm text-foreground/60">{parcel.courier}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(parcel.status)}`}></div>
                      <span className="text-sm font-medium">{parcel.status}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-foreground/60 mb-1">From</p>
                      <p className="font-medium">{parcel.sender.name}</p>
                      <p className="text-foreground/60">{parcel.sender.city}, {parcel.sender.country}</p>
                    </div>
                    <div>
                      <p className="text-foreground/60 mb-1">To</p>
                      <p className="font-medium">{parcel.receiver.name}</p>
                      <p className="text-foreground/60">{parcel.receiver.city}, {parcel.receiver.country}</p>
                    </div>
                    <div>
                      <p className="text-foreground/60 mb-1">Current Location</p>
                      <p className="font-medium">{parcel.currentLocation.city}</p>
                      <p className="text-foreground/60">{formatDate(parcel.currentLocation.timestamp)}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-border">
                    <p className="text-sm text-foreground/60">
                      Created: {formatDate(parcel.createdAt)}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          // Handle quick status update
                        }}
                        className="p-2 hover:bg-accent rounded-lg transition-smooth"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          // Handle schedule update
                        }}
                        className="p-2 hover:bg-accent rounded-lg transition-smooth"
                      >
                        <Clock size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Scheduled Updates Tab */}
        {activeTab === "scheduled" && (
          <div className="grid gap-4">
            {scheduledUpdates.filter(u => !u.isExecuted).length === 0 ? (
              <div className="text-center py-12">
                <Clock size={48} className="mx-auto text-foreground/20 mb-4" />
                <p className="text-foreground/60">No scheduled updates</p>
              </div>
            ) : (
              scheduledUpdates.filter(u => !u.isExecuted).map((update) => (
                <div key={update._id} className="glass p-6 rounded-lg">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-1">{update.trackingId}</h3>
                      <p className="text-sm text-foreground/60">Scheduled by {update.createdBy.firstName} {update.createdBy.lastName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatDate(update.scheduledTime)}</p>
                      <p className="text-sm text-foreground/60">Status: {update.status}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <p className="text-foreground/60 mb-1">Location</p>
                      <p className="font-medium">{update.location.address || update.location.city}</p>
                      <p className="text-foreground/60">{update.location.city}, {update.location.country}</p>
                    </div>
                    {update.notes && (
                      <div>
                        <p className="text-foreground/60 mb-1">Notes</p>
                        <p className="font-medium">{update.notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        // Handle edit
                      }}
                      className="px-3 py-1 text-sm bg-accent hover:bg-accent/80 rounded-lg transition-smooth"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        // Handle cancel
                      }}
                      className="px-3 py-1 text-sm bg-destructive hover:bg-destructive/80 text-destructive-foreground rounded-lg transition-smooth"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Parcel Detail Modal */}
        {selectedParcel && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-card rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">{selectedParcel.trackingId}</h2>
                    <p className="text-foreground/60">{selectedParcel.courier}</p>
                  </div>
                  <button
                    onClick={() => setSelectedParcel(null)}
                    className="p-2 hover:bg-accent rounded-lg transition-smooth"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-3 mb-6">
                  <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2 transition-smooth">
                    <Edit size={20} />
                    Update Status
                  </button>
                  <button className="bg-secondary hover:bg-secondary/90 text-secondary-foreground px-4 py-2 rounded-lg flex items-center gap-2 transition-smooth">
                    <Clock size={20} />
                    Schedule Update
                  </button>
                  <button className="bg-accent hover:bg-accent/80 text-accent-foreground px-4 py-2 rounded-lg flex items-center gap-2 transition-smooth">
                    <Bell size={20} />
                    Send Notification
                  </button>
                </div>

                {/* Parcel Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="font-semibold mb-3">Sender Information</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="text-foreground/60">Name:</span> {selectedParcel.sender.name}</p>
                      <p><span className="text-foreground/60">Email:</span> {selectedParcel.sender.email}</p>
                      <p><span className="text-foreground/60">Address:</span> {selectedParcel.sender.address}</p>
                      <p><span className="text-foreground/60">Location:</span> {selectedParcel.sender.city}, {selectedParcel.sender.country}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3">Receiver Information</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="text-foreground/60">Name:</span> {selectedParcel.receiver.name}</p>
                      <p><span className="text-foreground/60">Email:</span> {selectedParcel.receiver.email}</p>
                      <p><span className="text-foreground/60">Address:</span> {selectedParcel.receiver.address}</p>
                      <p><span className="text-foreground/60">Location:</span> {selectedParcel.receiver.city}, {selectedParcel.receiver.country}</p>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div>
                  <h3 className="font-semibold mb-3">Tracking Timeline</h3>
                  <div className="space-y-3">
                    {selectedParcel.timeline.map((event, index) => (
                      <div key={index} className="flex gap-4 p-3 bg-card/50 rounded-lg">
                        <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(event.status)}`}></div>
                          {index < selectedParcel.timeline.length - 1 && (
                            <div className="w-0.5 h-8 bg-border mt-2"></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{event.status}</p>
                          <p className="text-sm text-foreground/60">{event.location}</p>
                          <p className="text-xs text-foreground/40">{formatDate(event.timestamp)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
