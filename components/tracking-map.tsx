"use client"

import { useEffect, useState } from "react"
import { Loader } from "lucide-react"
import { useTheme } from "next-themes"

export function TrackingMap({ parcel }: any) {
  const { theme } = useTheme()
  const [mapLoaded, setMapLoaded] = useState(false)
  const [route, setRoute] = useState([])

  useEffect(() => {
    // Load Google Maps script
    const script = document.createElement("script")
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    script.async = true
    script.defer = true
    script.onload = () => {
      setMapLoaded(true)
      initializeMap()
    }
    document.head.appendChild(script)

    return () => {
      document.head.removeChild(script)
    }
  }, [])

  useEffect(() => {
    if (mapLoaded && parcel) {
      fetchRoute()
    }
  }, [mapLoaded, parcel])

  const fetchRoute = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/parcels/route/${parcel.trackingId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setRoute(data.route)
      }
    } catch (error) {
      console.error("Failed to fetch route:", error)
    }
  }

  const initializeMap = () => {
    if (!window.google || !parcel) return

    const mapElement = document.getElementById("tracking-map")
    if (!mapElement) return

    const center = {
      lat: parcel.currentLocation?.coordinates?.lat || 0,
      lng: parcel.currentLocation?.coordinates?.lng || 0,
    }

    const map = new window.google.maps.Map(mapElement, {
      zoom: 6,
      center: center,
      styles: theme === "dark" ? [
        {
          elementType: "geometry",
          stylers: [{ color: "#1a2332" }],
        },
        {
          elementType: "labels.text.stroke",
          stylers: [{ color: "#1a2332" }],
        },
        {
          elementType: "labels.text.fill",
          stylers: [{ color: "#ffffff" }],
        },
      ] : [
        {
          elementType: "geometry",
          stylers: [{ color: "#f5f5f5" }],
        },
        {
          elementType: "labels.text.stroke",
          stylers: [{ color: "#ffffff" }],
        },
        {
          elementType: "labels.text.fill",
          stylers: [{ color: "#333333" }],
        },
      ],
    })

    // Add markers for route points
    if (route.length > 0) {
      route.forEach((point, idx) => {
        const isStart = idx === 0
        const isEnd = idx === route.length - 1
        const isCurrent = idx === route.length - 1

        new window.google.maps.Marker({
          position: { lat: point.lat, lng: point.lng },
          map: map,
          title: point.location,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: isCurrent ? 12 : 8,
            fillColor: isCurrent ? "#007BFF" : isStart ? "#00C851" : isEnd ? "#FF6B6B" : "#007BFF",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          },
        })
      })

      // Draw polyline
      const polylineCoordinates = route.map((p) => ({
        lat: p.lat,
        lng: p.lng,
      }))

      new window.google.maps.Polyline({
        path: polylineCoordinates,
        geodesic: true,
        strokeColor: "#007BFF",
        strokeOpacity: 0.7,
        strokeWeight: 3,
        map: map,
      })
    }

    // Add current location marker
    if (parcel.currentLocation?.coordinates) {
      new window.google.maps.Marker({
        position: {
          lat: parcel.currentLocation.coordinates.lat,
          lng: parcel.currentLocation.coordinates.lng,
        },
        map: map,
        title: "Current Location",
        icon: {
          path: "M0,-28c-7.732,0 -14,6.268 -14,14c0,14 14,28 14,28s14,-14 14,-28c0,-7.732 -6.268,-14 -14,-14zm0,19c-2.761,0 -5,-2.239 -5,-5s2.239,-5 5,-5s5,2.239 5,5s-2.239,5 -5,5z",
          scale: 1.5,
          fillColor: "#007BFF",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      })
    }
  }

  return (
    <div className="glass p-8 h-96 flex flex-col">
      {!mapLoaded ? (
        <div className="flex items-center justify-center h-full">
          <Loader className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <h3 className="text-lg font-semibold mb-4">Live Route Map</h3>
          <div id="tracking-map" className="flex-1 rounded-lg overflow-hidden" />
          <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-foreground/60">Origin</p>
              <p className="font-semibold">{parcel.sender?.city}</p>
            </div>
            <div>
              <p className="text-foreground/60">Current</p>
              <p className="font-semibold">{parcel.currentLocation?.city}</p>
            </div>
            <div>
              <p className="text-foreground/60">Destination</p>
              <p className="font-semibold">{parcel.receiver?.city}</p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
