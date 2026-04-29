"use client"

import { useState, useEffect } from "react"
import { ArrowRight, Play, Pause, RotateCcw, Package, MapPin, Clock, CheckCircle, BarChart3, Users, Globe, Zap, Shield, Truck, Plane, Activity } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export default function DemoPage() {
  const [isDemoRunning, setIsDemoRunning] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [demoTrackingId, setDemoTrackingId] = useState("FTS2024DEMO123")
  const [selectedCourier, setSelectedCourier] = useState("FreightSight")
  const [packageWeight, setPackageWeight] = useState("2.5")
  const [notifications, setNotifications] = useState<{time: string, message: string}[]>([])
  const [demoRunCount, setDemoRunCount] = useState(0)
  const [isNotificationPanelVisible, setIsNotificationPanelVisible] = useState(true)
  const [notificationPosition, setNotificationPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  
  const [demoData, setDemoData] = useState({
    status: "Ready for Pickup",
    location: "New York Distribution Center, NY",
    progress: 0,
    estimatedDelivery: "May 2, 2024",
    carrier: "FreightSight Express",
    packageType: "Electronics",
    timeline: [
      { time: "Just now", status: "Package Picked Up", location: "New York, NY", agent: "John Smith" },
      { time: "2 hours ago", status: "In Transit", location: "Philadelphia, PA", agent: "Transit Hub" },
      { time: "5 hours ago", status: "In Transit", location: "Chicago, IL", agent: "Regional Center" },
      { time: "8 hours ago", status: "Out for Delivery", location: "Local Facility", agent: "Delivery Driver" },
      { time: "10 hours ago", status: "Delivered", location: "Customer Address", agent: "Completed" }
    ]
  })

  const demoSteps = [
    { title: "Package Registration", description: "Enter tracking ID and select courier", icon: Package, active: false },
    { title: "Real-Time Tracking", description: "Live GPS tracking with route visualization", icon: MapPin, active: true },
    { title: "Smart Notifications", description: "AI-powered delivery predictions and alerts", icon: Clock, active: false },
    { title: "Delivery Confirmation", description: "Photo confirmation and signature capture", icon: CheckCircle, active: false }
  ]

  const couriers = ["FreightSight", "DHL", "FedEx", "UPS", "USPS", "Aramex", "Royal Mail"]

  const locations = [
    "New York Distribution Center, NY",
    "Los Angeles Hub, CA", 
    "Chicago Sorting Facility, IL",
    "Miami Gateway, FL",
    "Dallas Distribution Center, TX",
    "Atlanta Hub, GA",
    "Seattle Facility, WA",
    "Boston Distribution Center, MA"
  ]

  const packageTypes = ["Electronics", "Documents", "Clothing", "Books", "Medical Supplies", "Food Items"]

  const generateRandomDemoData = () => {
    const randomLocation = locations[Math.floor(Math.random() * locations.length)]
    const randomWeight = (Math.random() * 10 + 0.5).toFixed(1)
    const randomPackageType = packageTypes[Math.floor(Math.random() * packageTypes.length)]
    const randomTrackingId = `FTS${Date.now().toString().slice(-6)}`
    
    setPackageWeight(randomWeight)
    setDemoTrackingId(randomTrackingId)
    
    setDemoData({
      status: "Ready for Pickup",
      location: randomLocation,
      progress: 0,
      estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      }),
      carrier: selectedCourier + " Express",
      packageType: randomPackageType,
      timeline: [
        { time: "Just now", status: "Package Picked Up", location: randomLocation.split(',')[0], agent: "John Smith" },
        { time: "2 hours ago", status: "In Transit", location: "Transit Hub", agent: "System" },
        { time: "5 hours ago", status: "In Transit", location: "Regional Center", agent: "System" },
        { time: "8 hours ago", status: "Out for Delivery", location: "Local Facility", agent: "Delivery Driver" },
        { time: "10 hours ago", status: "Delivered", location: "Customer Address", agent: "Completed" }
      ]
    })
    
    setDemoRunCount(prev => prev + 1)
  }

  const handleDragStart = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({
      x: e.clientX - notificationPosition.x,
      y: e.clientY - notificationPosition.y
    })
  }

  const handleDragMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    
    const newX = e.clientX - dragStart.x
    const newY = e.clientY - dragStart.y
    
    // Keep panel within viewport bounds (negative values for bottom-right positioning)
    const maxX = 0 // Can't move further right than bottom-right corner
    const maxY = 0 // Can't move further down than bottom-right corner
    const minX = -(window.innerWidth - 320 - 16) // Can move left by viewport width minus panel width
    const minY = -(window.innerHeight - 400 - 16) // Can move up by viewport height minus panel height
    
    setNotificationPosition({
      x: Math.max(minX, Math.min(newX, maxX)),
      y: Math.max(minY, Math.min(newY, maxY))
    })
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      const handleMouseMove = (e: MouseEvent) => {
        const newX = e.clientX - dragStart.x
        const newY = e.clientY - dragStart.y
        
        // Keep panel within viewport bounds (negative values for bottom-right positioning)
        const maxX = 0 // Can't move further right than bottom-right corner
        const maxY = 0 // Can't move further down than bottom-right corner
        const minX = -(window.innerWidth - 320 - 16) // Can move left by viewport width minus panel width
        const minY = -(window.innerHeight - 400 - 16) // Can move up by viewport height minus panel height
        
        setNotificationPosition({
          x: Math.max(minX, Math.min(newX, maxX)),
          y: Math.max(minY, Math.min(newY, maxY))
        })
      }

      const handleMouseUp = () => {
        setIsDragging(false)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, dragStart])

  const handleDemoToggle = () => {
    if (!isDemoRunning) {
      // Reset and generate new demo data
      generateRandomDemoData()
      setIsDemoRunning(true)
      // Add notification with new tracking ID
      setNotifications(prev => [...prev, {
        time: "Just now",
        message: `🚀 Demo started! Tracking package ${demoTrackingId} from ${demoData.location}`
      }])
    } else {
      setIsDemoRunning(false)
      setNotifications(prev => [...prev, {
        time: "Just now",
        message: "⏸️ Demo paused"
      }])
    }
  }

  const simulateProgress = () => {
    if (!isDemoRunning) return
    
    let currentStage = 0
    const stages = [
      { progress: 5, status: "Package Picked Up", duration: 2000, location: demoData.location },
      { progress: 15, status: "In Transit", duration: 4000, location: "Regional Hub" },
      { progress: 25, status: "In Transit", duration: 3000, location: "Sorting Facility" },
      { progress: 40, status: "In Transit", duration: 5000, location: "Distribution Center" },
      { progress: 55, status: "In Transit", duration: 4000, location: "Local Transit Hub" },
      { progress: 70, status: "Out for Delivery", duration: 3000, location: "Local Facility" },
      { progress: 85, status: "Out for Delivery", duration: 4000, location: "Delivery Route" },
      { progress: 95, status: "Out for Delivery", duration: 2000, location: "Near Destination" },
      { progress: 100, status: "Delivered", duration: 1000, location: "Customer Address" }
    ]
    
    const runStage = () => {
      if (currentStage >= stages.length) {
        setIsDemoRunning(false)
        const completionMessages = [
          `✅ Package delivered successfully! Run #${demoRunCount + 1} completed`,
          `🎯 Delivery complete! ${demoData.packageType} (${packageWeight}kg) delivered to customer`,
          `📦 Mission accomplished! ${selectedCourier} delivery confirmed`,
          `🌟 Excellent! Package arrived on time via ${demoData.location}`
        ]
        setNotifications(prev => [...prev, {
          time: "Just now",
          message: completionMessages[demoRunCount % completionMessages.length]
        }])
        return
      }
      
      const stage = stages[currentStage]
      setDemoData(prev => ({
        ...prev,
        progress: stage.progress,
        status: stage.status,
        location: stage.location
      }))
      
      // Add notification for major milestones
      if (stage.progress === 5 || stage.progress === 70 || stage.progress === 100) {
        setNotifications(prev => [...prev, {
          time: "Just now",
          message: `${stage.status === "Delivered" ? "🎉" : "📍"} ${stage.status} at ${stage.location}`
        }])
      }
      
      currentStage++
      setTimeout(runStage, stage.duration)
    }
    
    runStage()
  }

  useEffect(() => {
    if (isDemoRunning) {
      simulateProgress()
    }
  }, [isDemoRunning])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="relative py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-primary/20 px-4 py-2 rounded-full mb-6">
              <Activity className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Live Demo Mode</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold mb-4">
              Experience <span className="text-primary">FreightSight</span> in Action
            </h1>
            <p className="text-xl text-foreground/70 max-w-2xl mx-auto">
              Interactive parcel tracking simulation with real-time updates and notifications
            </p>
          </div>

          {/* Demo Controls */}
          <div className="glass rounded-2xl p-8 max-w-5xl mx-auto mb-12 border border-border/50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Tracking ID</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={demoTrackingId}
                    onChange={(e) => setDemoTrackingId(e.target.value.toUpperCase())}
                    className="bg-card border-border rounded-lg px-4 py-3 font-mono text-lg font-semibold w-full"
                    placeholder="Enter tracking ID"
                  />
                  <button className="bg-primary/10 text-primary px-3 py-3 rounded-lg text-sm hover:bg-primary/20 transition-colors">
                    Copy
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Courier</label>
                <select 
                  value={selectedCourier}
                  onChange={(e) => setSelectedCourier(e.target.value)}
                  className="w-full bg-card border-border rounded-lg px-4 py-3 text-foreground font-medium"
                >
                  {couriers.map(courier => (
                    <option key={courier} value={courier} className="bg-card text-foreground">{courier}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Weight (kg)</label>
                <input
                  type="number"
                  value={packageWeight}
                  onChange={(e) => setPackageWeight(e.target.value)}
                  className="w-full bg-card border-border rounded-lg px-4 py-3 text-foreground font-medium"
                  step="0.1"
                  min="0.1"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleDemoToggle}
                  className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                    isDemoRunning 
                      ? "bg-red-500 hover:bg-red-600 text-white shadow-lg" 
                      : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl"
                  }`}
                >
                  {isDemoRunning ? <Pause size={20} /> : <Play size={20} />}
                  {isDemoRunning ? "Pause Demo" : "Start Live Demo"}
                </button>
              </div>
            </div>

            {/* Enhanced Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium text-foreground">Delivery Progress</span>
                <span className={`text-lg font-bold ${
                  demoData.progress === 100 ? 'text-green-600' : 
                  demoData.progress >= 75 ? 'text-blue-600' : 
                  demoData.progress >= 50 ? 'text-orange-600' : 'text-gray-600'
                }`}>{demoData.progress}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-4 overflow-hidden">
                <div 
                  className={`h-4 rounded-full transition-all duration-500 ${
                    demoData.progress === 100 ? 'bg-green-500' : 
                    demoData.progress >= 75 ? 'bg-blue-500' : 
                    demoData.progress >= 50 ? 'bg-orange-500' : 'bg-gray-500'
                  }`}
                  style={{ width: `${demoData.progress}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-foreground/60 mt-2">
                <span>Package Picked Up</span>
                <span>Delivered</span>
              </div>
            </div>

            {/* Current Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    demoData.status === "Delivered" ? 'bg-green-100' : 
                    demoData.status === "Out for Delivery" ? 'bg-blue-100' : 
                    demoData.status === "In Transit" ? 'bg-orange-100' : 'bg-gray-100'
                  }`}>
                    <Package className={`w-5 h-5 ${
                      demoData.status === "Delivered" ? 'text-green-600' : 
                      demoData.status === "Out for Delivery" ? 'text-blue-600' : 
                      demoData.status === "In Transit" ? 'text-orange-600' : 'text-gray-600'
                    }`} />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-foreground">{demoData.status}</div>
                    <div className="text-sm text-foreground/60">Current Status</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-foreground">{demoData.location}</div>
                    <div className="text-sm text-foreground/60">Current Location</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-foreground">{demoData.estimatedDelivery}</div>
                    <div className="text-sm text-foreground/60">Est. Delivery</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Demo Steps */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Platform Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {demoSteps.map((step, idx) => (
              <div 
                key={idx}
                className={`bg-card border rounded-xl p-6 cursor-pointer transition-all duration-300 hover:shadow-lg ${
                  step.active ? 'ring-2 ring-primary/20 bg-primary/5' : 'hover:bg-accent/50'
                }`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    step.active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    <step.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
                </div>
                <p className="text-foreground/70 leading-relaxed">{step.description}</p>
                {step.active && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="text-sm text-primary font-medium">✓ Currently Active</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Timeline */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">Live Tracking Timeline</h2>
            <div className="flex items-center gap-2 text-sm text-foreground/60">
              <div className={`w-3 h-3 rounded-full ${isDemoRunning ? 'bg-green-500 animate-pulse' : 'bg-muted'}`} />
              <span>{isDemoRunning ? 'Live Tracking Active' : 'Tracking Paused'}</span>
            </div>
          </div>
          
          <div className="bg-card border border-border rounded-2xl p-8">
            <div className="space-y-6">
              {demoData.timeline.map((event, idx) => (
                <div key={idx} className="flex gap-6 group">
                  <div className="flex flex-col items-center">
                    <div className={`w-4 h-4 rounded-full ${
                      idx <= 2 ? 'bg-primary' : 'bg-muted'
                    }`} />
                    {idx < demoData.timeline.length - 1 && (
                      <div className={`w-1 h-20 ${
                        idx < 2 ? 'bg-primary/30' : 'bg-muted'
                      }`} />
                    )}
                  </div>
                  <div className={`pb-6 ${idx <= 2 ? 'opacity-100' : 'opacity-60'} transition-opacity duration-300`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`text-sm font-medium px-3 py-1 rounded-full ${
                          idx <= 2 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                        }`}>
                          {event.status}
                        </div>
                        <span className="text-sm text-foreground/60">{event.time}</span>
                      </div>
                      {event.agent && (
                        <div className="text-sm text-foreground/70">by {event.agent}</div>
                      )}
                    </div>
                    <p className="text-foreground font-medium">{event.location}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Movable Notifications Panel */}
      {isNotificationPanelVisible && (
        <div 
          className={`fixed max-w-sm z-50 shadow-2xl transition-shadow ${isDragging ? 'cursor-grabbing shadow-3xl' : 'cursor-grab'}`}
          style={{ 
            right: `${16 - notificationPosition.x}px`,
            bottom: `${16 - notificationPosition.y}px`
          }}
        >
          <div className="bg-card border border-border rounded-lg overflow-hidden max-h-80">
            {/* Draggable Header */}
            <div 
              className="p-4 border-b border-border bg-muted/50 cursor-grab select-none"
              onMouseDown={handleDragStart}
              onMouseMove={handleDragMove}
              onMouseUp={handleDragEnd}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  Live Notifications
                </h3>
                <button
                  onClick={() => setIsNotificationPanelVisible(false)}
                  className="text-foreground/60 hover:text-foreground transition-colors p-1 rounded hover:bg-accent/50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Notifications Content */}
            <div className="p-4 space-y-3 max-h-60 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-sm text-foreground/60">No notifications yet. Start the demo to see updates!</p>
              ) : (
                notifications.map((notif, idx) => (
                  <div key={idx} className="text-sm border-l-2 border-primary pl-3 py-2 bg-muted/30 rounded-r">
                    <div className="text-foreground/60 text-xs">{notif.time}</div>
                    <div className="text-foreground">{notif.message}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Re-open Notification Button */}
      {!isNotificationPanelVisible && (
        <button
          onClick={() => setIsNotificationPanelVisible(true)}
          className="fixed bottom-4 right-4 bg-primary hover:bg-primary/90 text-primary-foreground p-3 rounded-full shadow-lg transition-all duration-200 z-50 flex items-center gap-2"
        >
          <Activity className="w-4 h-4" />
          <span className="text-sm font-medium">Notifications</span>
          {notifications.length > 0 && (
            <span className="bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded-full">
              {notifications.length}
            </span>
          )}
        </button>
      )}

      {/* Theme Toggle */}
      <div className="fixed top-4 right-4">
        <ThemeToggle />
      </div>
    </div>
  )
}
