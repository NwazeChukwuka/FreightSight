"use client"

import { useState, useEffect } from "react"
import { Bell, Mail, MessageSquare } from "lucide-react"

export default function PreferencesPage() {
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    smsNotifications: false,
    deliveryUpdates: true,
    delayAlerts: true,
    weeklyReport: false,
  })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    // Load preferences from localStorage
    const saved = localStorage.getItem("userPreferences")
    if (saved) {
      setPreferences(JSON.parse(saved))
    }
  }, [])

  const handleToggle = (key: string) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
    setSaved(false)
  }

  const handleSave = () => {
    localStorage.setItem("userPreferences", JSON.stringify(preferences))
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-8">Notification Preferences</h1>

      <div className="glass p-8 max-w-2xl">
        <div className="space-y-6">
          {/* Email Notifications */}
          <div className="flex items-start justify-between pb-6 border-b border-white/10">
            <div className="flex items-start gap-4">
              <Mail className="w-6 h-6 text-primary mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Email Notifications</h3>
                <p className="text-sm text-foreground/60">Receive updates via email</p>
              </div>
            </div>
            <button
              onClick={() => handleToggle("emailNotifications")}
              className={`relative w-12 h-6 rounded-full transition-smooth ${
                preferences.emailNotifications ? "bg-primary" : "bg-white/10"
              }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-smooth ${
                  preferences.emailNotifications ? "right-1" : "left-1"
                }`}
              />
            </button>
          </div>

          {/* SMS Notifications */}
          <div className="flex items-start justify-between pb-6 border-b border-white/10">
            <div className="flex items-start gap-4">
              <MessageSquare className="w-6 h-6 text-primary mt-1" />
              <div>
                <h3 className="font-semibold mb-1">SMS Notifications</h3>
                <p className="text-sm text-foreground/60">Receive updates via SMS</p>
              </div>
            </div>
            <button
              onClick={() => handleToggle("smsNotifications")}
              className={`relative w-12 h-6 rounded-full transition-smooth ${
                preferences.smsNotifications ? "bg-primary" : "bg-white/10"
              }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-smooth ${
                  preferences.smsNotifications ? "right-1" : "left-1"
                }`}
              />
            </button>
          </div>

          {/* Delivery Updates */}
          <div className="flex items-start justify-between pb-6 border-b border-white/10">
            <div className="flex items-start gap-4">
              <Bell className="w-6 h-6 text-primary mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Delivery Updates</h3>
                <p className="text-sm text-foreground/60">Get notified when parcel status changes</p>
              </div>
            </div>
            <button
              onClick={() => handleToggle("deliveryUpdates")}
              className={`relative w-12 h-6 rounded-full transition-smooth ${
                preferences.deliveryUpdates ? "bg-primary" : "bg-white/10"
              }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-smooth ${
                  preferences.deliveryUpdates ? "right-1" : "left-1"
                }`}
              />
            </button>
          </div>

          {/* Delay Alerts */}
          <div className="flex items-start justify-between pb-6 border-b border-white/10">
            <div className="flex items-start gap-4">
              <Bell className="w-6 h-6 text-red-500 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Delay Alerts</h3>
                <p className="text-sm text-foreground/60">Alert me if delivery is delayed</p>
              </div>
            </div>
            <button
              onClick={() => handleToggle("delayAlerts")}
              className={`relative w-12 h-6 rounded-full transition-smooth ${
                preferences.delayAlerts ? "bg-primary" : "bg-white/10"
              }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-smooth ${
                  preferences.delayAlerts ? "right-1" : "left-1"
                }`}
              />
            </button>
          </div>

          {/* Weekly Report */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <Mail className="w-6 h-6 text-secondary mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Weekly Report</h3>
                <p className="text-sm text-foreground/60">Receive weekly summary of all parcels</p>
              </div>
            </div>
            <button
              onClick={() => handleToggle("weeklyReport")}
              className={`relative w-12 h-6 rounded-full transition-smooth ${
                preferences.weeklyReport ? "bg-primary" : "bg-white/10"
              }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-smooth ${
                  preferences.weeklyReport ? "right-1" : "left-1"
                }`}
              />
            </button>
          </div>
        </div>

        <div className="mt-8 flex gap-4">
          <button
            onClick={handleSave}
            className="flex-1 bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-lg transition-smooth"
          >
            Save Preferences
          </button>
        </div>

        {saved && (
          <div className="mt-4 p-4 bg-secondary/20 border border-secondary/50 rounded-lg text-secondary text-sm">
            Preferences saved successfully!
          </div>
        )}
      </div>
    </div>
  )
}
