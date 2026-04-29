"use client"

import { useState } from "react"
import { Filter, X, Calendar, MapPin, Package, User, Search, ChevronDown, ChevronUp } from "lucide-react"

interface FilterOptions {
  status: string[]
  courier: string[]
  dateRange: {
    start: string
    end: string
  }
  weightRange: {
    min: string
    max: string
  }
  location: string
  senderName: string
  receiverName: string
  trackingId: string
}

interface AdvancedFiltersProps {
  filters: FilterOptions
  onFiltersChange: (filters: FilterOptions) => void
  onClearFilters: () => void
  className?: string
}

const couriers = ["All", "FreightSight", "DHL", "FedEx", "UPS", "USPS", "Aramex", "Royal Mail"]
const statuses = ["All", "Pending", "In Transit", "Out for Delivery", "Delivered", "Delayed", "Returned"]

export function AdvancedFilters({ filters, onFiltersChange, onClearFilters, className = "" }: AdvancedFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeSection, setActiveSection] = useState<string | null>(null)

  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? null : section)
  }

  const updateFilter = (key: keyof FilterOptions, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const toggleStatusFilter = (status: string) => {
    if (status === "All") {
      updateFilter("status", [])
    } else {
      const newStatuses = filters.status.includes(status)
        ? filters.status.filter(s => s !== status)
        : [...filters.status, status]
      updateFilter("status", newStatuses)
    }
  }

  const toggleCourierFilter = (courier: string) => {
    if (courier === "All") {
      updateFilter("courier", [])
    } else {
      const newCouriers = filters.courier.includes(courier)
        ? filters.courier.filter(c => c !== courier)
        : [...filters.courier, courier]
      updateFilter("courier", newCouriers)
    }
  }

  const hasActiveFilters = 
    filters.status.length > 0 ||
    filters.courier.length > 0 ||
    filters.dateRange.start ||
    filters.dateRange.end ||
    filters.weightRange.min ||
    filters.weightRange.max ||
    filters.location ||
    filters.senderName ||
    filters.receiverName ||
    filters.trackingId

  return (
    <div className={`glass ${className}`}>
      {/* Filter Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Filter size={20} className="text-primary" />
          <span className="font-semibold">Advanced Filters</span>
          {hasActiveFilters && (
            <span className="bg-primary/20 text-primary px-2 py-1 rounded-full text-xs">
              Active
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="flex items-center gap-1 text-sm text-destructive hover:text-destructive/80 transition-colors"
            >
              <X size={16} />
              Clear All
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-accent rounded transition-colors"
          >
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
      </div>

      {/* Filter Content */}
      {isExpanded && (
        <div className="p-4 space-y-6">
          {/* Quick Search */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              <Search size={16} />
              Quick Search
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Tracking ID"
                value={filters.trackingId}
                onChange={(e) => updateFilter("trackingId", e.target.value)}
                className="px-3 py-2 bg-input border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <input
                type="text"
                placeholder="Sender Name"
                value={filters.senderName}
                onChange={(e) => updateFilter("senderName", e.target.value)}
                className="px-3 py-2 bg-input border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <input
                type="text"
                placeholder="Receiver Name"
                value={filters.receiverName}
                onChange={(e) => updateFilter("receiverName", e.target.value)}
                className="px-3 py-2 bg-input border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <button
              onClick={() => toggleSection("status")}
              className="flex items-center justify-between w-full text-sm font-medium mb-2"
            >
              <div className="flex items-center gap-2">
                <Package size={16} />
                Status
              </div>
              <ChevronDown 
                size={16} 
                className={`transition-transform ${activeSection === "status" ? "rotate-180" : ""}`}
              />
            </button>
            {activeSection === "status" && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {statuses.map((status) => (
                  <button
                    key={status}
                    onClick={() => toggleStatusFilter(status)}
                    className={`px-3 py-2 rounded-md text-sm transition-colors ${
                      (status === "All" && filters.status.length === 0) ||
                      filters.status.includes(status)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Courier Filter */}
          <div>
            <button
              onClick={() => toggleSection("courier")}
              className="flex items-center justify-between w-full text-sm font-medium mb-2"
            >
              <div className="flex items-center gap-2">
                <Package size={16} />
                Courier
              </div>
              <ChevronDown 
                size={16} 
                className={`transition-transform ${activeSection === "courier" ? "rotate-180" : ""}`}
              />
            </button>
            {activeSection === "courier" && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {couriers.map((courier) => (
                  <button
                    key={courier}
                    onClick={() => toggleCourierFilter(courier)}
                    className={`px-3 py-2 rounded-md text-sm transition-colors ${
                      (courier === "All" && filters.courier.length === 0) ||
                      filters.courier.includes(courier)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    {courier}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date Range */}
          <div>
            <button
              onClick={() => toggleSection("date")}
              className="flex items-center justify-between w-full text-sm font-medium mb-2"
            >
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                Date Range
              </div>
              <ChevronDown 
                size={16} 
                className={`transition-transform ${activeSection === "date" ? "rotate-180" : ""}`}
              />
            </button>
            {activeSection === "date" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">From Date</label>
                  <input
                    type="date"
                    value={filters.dateRange.start}
                    onChange={(e) => updateFilter("dateRange", { ...filters.dateRange, start: e.target.value })}
                    className="w-full px-3 py-2 bg-input border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">To Date</label>
                  <input
                    type="date"
                    value={filters.dateRange.end}
                    onChange={(e) => updateFilter("dateRange", { ...filters.dateRange, end: e.target.value })}
                    className="w-full px-3 py-2 bg-input border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Weight Range */}
          <div>
            <button
              onClick={() => toggleSection("weight")}
              className="flex items-center justify-between w-full text-sm font-medium mb-2"
            >
              <div className="flex items-center gap-2">
                <Package size={16} />
                Weight Range (kg)
              </div>
              <ChevronDown 
                size={16} 
                className={`transition-transform ${activeSection === "weight" ? "rotate-180" : ""}`}
              />
            </button>
            {activeSection === "weight" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Min Weight</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={filters.weightRange.min}
                    onChange={(e) => updateFilter("weightRange", { ...filters.weightRange, min: e.target.value })}
                    className="w-full px-3 py-2 bg-input border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Max Weight</label>
                  <input
                    type="number"
                    placeholder="100"
                    value={filters.weightRange.max}
                    onChange={(e) => updateFilter("weightRange", { ...filters.weightRange, max: e.target.value })}
                    className="w-full px-3 py-2 bg-input border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Location */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              <MapPin size={16} />
              Location
            </label>
            <input
              type="text"
              placeholder="City, State, or Country"
              value={filters.location}
              onChange={(e) => updateFilter("location", e.target.value)}
              className="w-full px-3 py-2 bg-input border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      )}
    </div>
  )
}
