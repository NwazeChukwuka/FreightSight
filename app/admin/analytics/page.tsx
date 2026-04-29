"use client"

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

const deliveryData = [
  { month: "Jan", deliveries: 240, delayed: 24 },
  { month: "Feb", deliveries: 321, delayed: 32 },
  { month: "Mar", deliveries: 200, delayed: 20 },
  { month: "Apr", deliveries: 278, delayed: 28 },
  { month: "May", deliveries: 189, delayed: 19 },
  { month: "Jun", deliveries: 239, delayed: 24 },
]

const regionData = [
  { region: "North America", parcels: 1200 },
  { region: "Europe", parcels: 980 },
  { region: "Asia", parcels: 1500 },
  { region: "South America", parcels: 450 },
  { region: "Africa", parcels: 320 },
]

export default function AnalyticsPage() {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-8">Analytics</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Deliveries per Month */}
        <div className="glass p-8">
          <h2 className="text-2xl font-bold mb-6">Deliveries per Month</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={deliveryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="month" stroke="rgba(255,255,255,0.6)" />
              <YAxis stroke="rgba(255,255,255,0.6)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(11, 18, 34, 0.9)",
                  border: "1px solid rgba(255,255,255,0.2)",
                }}
              />
              <Legend />
              <Bar dataKey="deliveries" fill="#007BFF" />
              <Bar dataKey="delayed" fill="#FF6B6B" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Most Active Regions */}
        <div className="glass p-8">
          <h2 className="text-2xl font-bold mb-6">Most Active Regions</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={regionData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis type="number" stroke="rgba(255,255,255,0.6)" />
              <YAxis dataKey="region" type="category" stroke="rgba(255,255,255,0.6)" width={100} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(11, 18, 34, 0.9)",
                  border: "1px solid rgba(255,255,255,0.2)",
                }}
              />
              <Bar dataKey="parcels" fill="#00C851" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Average Delivery Time */}
        <div className="glass p-8 lg:col-span-2">
          <h2 className="text-2xl font-bold mb-6">Average Delivery Time Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={deliveryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="month" stroke="rgba(255,255,255,0.6)" />
              <YAxis stroke="rgba(255,255,255,0.6)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(11, 18, 34, 0.9)",
                  border: "1px solid rgba(255,255,255,0.2)",
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="deliveries" stroke="#007BFF" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
